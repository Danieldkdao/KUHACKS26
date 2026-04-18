import { db } from "@repo/db";
import { ApprovalRequestTable } from "@repo/db/schema";
import { tool } from "ai";
import { and, eq, gte, ilike, lte } from "drizzle-orm";
import z from "zod";

const FlightStatus = z.enum([
  "scheduled",
  "active",
  "landed",
  "cancelled",
  "incident",
  "diverted",
]);

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format");

const getRequiredEnvVar = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const toSearchParams = (
  params: Record<string, string | number | undefined | null>,
) => {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
};

const normalizeHotelApiError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return error;
  }

  const record = error as Record<string, unknown>;
  const statusCode = record.status_code;
  const message = record.message;

  if (
    statusCode === 401 &&
    typeof message === "string" &&
    message.includes("RapidAPI")
  ) {
    return {
      status_code: 401,
      message:
        "Xotelo now requires RapidAPI access for this endpoint. The current direct request is not authorized.",
      provider_message: message,
    };
  }

  return error;
};

const extractApiErrorDetails = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directMessage =
    typeof record.message === "string" ? record.message : undefined;
  const directCode =
    typeof record.code === "number" || typeof record.code === "string"
      ? record.code
      : undefined;

  if (directMessage || directCode) {
    return {
      code: directCode,
      message: directMessage,
    };
  }

  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;
    return {
      code:
        typeof nested.code === "number" || typeof nested.code === "string"
          ? nested.code
          : typeof nested.status_code === "number" ||
              typeof nested.status_code === "string"
            ? nested.status_code
            : undefined,
      message:
        typeof nested.message === "string"
          ? nested.message
          : typeof nested.info === "string"
            ? nested.info
            : undefined,
    };
  }

  return null;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const serializeApprovalRequest = (
  approvalRequest: {
    id: string;
    userId: string;
    destination: string;
    cost: number;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
  },
) => {
  return {
    ...approvalRequest,
    createdAt: approvalRequest.createdAt.toISOString(),
  };
};

const fetchJson = async <T>(label: string, url: string): Promise<T> => {
  const res = await fetch(url);
  const json = (await res.json()) as T;

  if (!res.ok) {
    const apiError = extractApiErrorDetails(json);
    const errorDetails = [
      `HTTP ${res.status} ${res.statusText}`.trim(),
      apiError?.code !== undefined ? `provider code ${apiError.code}` : null,
      apiError?.message ?? null,
    ]
      .filter(Boolean)
      .join(" | ");

    throw new Error(`${label} failed: ${errorDetails}`);
  }

  return json;
};

export const flightSearchTool = tool({
  description: "Gets relevant flights based on the given parameters/filters.",
  inputSchema: z.object({
    flight_status: FlightStatus.optional().describe(
      "Filter by current flight status: 'scheduled' (not yet departed), 'active' (in the air), 'landed', 'cancelled', 'incident', or 'diverted'",
    ),
    flight_date: DateString.optional().describe(
      "Filter by flight date in YYYY-MM-DD format, e.g. '2024-06-01'",
    ),
    flight_iata: z
      .string()
      .optional()
      .describe(
        "Filter by full IATA flight code (airline code + flight number), e.g. 'AA1004' for American Airlines flight 1004",
      ),
    flight_icao: z
      .string()
      .optional()
      .describe(
        "Filter by full ICAO flight code (3-letter airline code + flight number), e.g. 'AAL1004'",
      ),
    flight_number: z
      .string()
      .optional()
      .describe(
        "Filter by the numeric part of the flight number only, e.g. '1004'. Use this when you don't know the airline code",
      ),
    airline_name: z
      .string()
      .optional()
      .describe(
        "Filter by full airline name, e.g. 'American Airlines' or 'Delta'. Use this when the user mentions an airline by name",
      ),
    airline_iata: z
      .string()
      .optional()
      .describe(
        "Filter by 2-letter IATA airline code, e.g. 'AA' for American Airlines, 'DL' for Delta, 'UA' for United",
      ),
    airline_icao: z
      .string()
      .optional()
      .describe(
        "Filter by 3-letter ICAO airline code, e.g. 'AAL' for American Airlines. Prefer airline_iata unless the user specifies ICAO",
      ),
    dep_iata: z
      .string()
      .optional()
      .describe(
        "Filter by departure airport using its 3-letter IATA code, e.g. 'SFO' for San Francisco, 'JFK' for New York",
      ),
    dep_icao: z
      .string()
      .optional()
      .describe(
        "Filter by departure airport using its 4-letter ICAO code, e.g. 'KSFO'. Prefer dep_iata unless the user specifies ICAO",
      ),
    dep_country_iso2: z
      .string()
      .length(2)
      .optional()
      .describe(
        "Filter by departure country using its 2-letter ISO code, e.g. 'US', 'GB', 'FR'. Use this when the user asks for all flights from a country",
      ),
    arr_iata: z
      .string()
      .optional()
      .describe(
        "Filter by arrival airport using its 3-letter IATA code, e.g. 'DFW' for Dallas, 'LHR' for London Heathrow",
      ),
    arr_icao: z
      .string()
      .optional()
      .describe(
        "Filter by arrival airport using its 4-letter ICAO code, e.g. 'KDFW'. Prefer arr_iata unless the user specifies ICAO",
      ),
    arr_country_iso2: z
      .string()
      .length(2)
      .optional()
      .describe(
        "Filter by arrival country using its 2-letter ISO code, e.g. 'US', 'GB', 'FR'. Use this when the user asks for all flights arriving in a country",
      ),
  }),
  execute: async (params) => {
    const accessKey = getRequiredEnvVar("AVIATION_STACK_API_KEY");
    const query = toSearchParams(params as Record<string, string | number>);
    const url = `https://api.aviationstack.com/v1/flights?access_key=${accessKey}&limit=10&${query.toString()}`;

    return fetchJson<any>("flight lookup", url);
  },
});

const Currency = z.enum([
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "CHF",
  "AUD",
  "JPY",
  "CNY",
  "INR",
  "THB",
  "BRL",
  "HKD",
  "RUB",
  "BZD",
]);

export const hotelSearchTool = tool({
  description: `Search for hotels and return their details plus real-time prices from
    OTAs like Booking.com, Expedia, Hotels.com, and Agoda. 
    Use this when the user asks to find, search, or compare hotels in a location.
    Always ask the user for check-in and check-out dates if not provided.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Hotel name, city, or landmark to search for. E.g. 'Tokyo', 'Hilton Paris', 'Eiffel Tower'",
      ),
    chk_in: DateString.describe("Check-in date in YYYY-MM-DD format"),
    chk_out: DateString.describe("Check-out date in YYYY-MM-DD format"),
    currency: Currency.default("USD").describe("Currency for prices"),
    rooms: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(1)
      .describe("Number of rooms"),
    adults: z
      .number()
      .int()
      .min(1)
      .max(32)
      .default(1)
      .describe("Number of adults"),
    age_of_children: z
      .string()
      .regex(/^(\d|1[0-7])(,(\d|1[0-7]))*$/)
      .optional()
      .describe(
        "Ages of children separated by commas, e.g. '0,4,7'. Ages must be between 0 and 17",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe("Number of hotels to return"),
    sort: z
      .enum(["best_value", "popularity", "distance"])
      .default("best_value")
      .describe("How to sort the hotel list"),
  }),
  execute: async ({
    query,
    chk_in,
    chk_out,
    currency,
    rooms,
    adults,
    age_of_children,
    limit,
    sort,
  }) => {
    const searchParams = toSearchParams({ query });
    const searchData = await fetchJson<any>(
      "hotel search",
      `https://data.xotelo.com/api/search?${searchParams.toString()}`,
    );

    if (searchData.error || !searchData.result?.list?.length) {
      const error = normalizeHotelApiError(searchData.error);
      return { error: error ?? "No hotels found for that query." };
    }

    const location_key = searchData.result.list[0].location_key;

    const listParams = toSearchParams({
      location_key,
      limit: String(limit),
      offset: "0",
      sort,
    });
    const listData = await fetchJson<any>(
      "hotel list",
      `https://data.xotelo.com/api/list?${listParams.toString()}`,
    );

    if (listData.error || !listData.result?.list?.length) {
      const error = normalizeHotelApiError(listData.error);
      return { error: error ?? "Could not retrieve hotel list." };
    }

    const hotelsWithRates = await Promise.all(
      listData.result.list.map(async (hotel: any) => {
        const ratesParams = toSearchParams({
          hotel_key: hotel.key,
          chk_in,
          chk_out,
          currency,
          rooms: String(rooms),
          adults: String(adults),
          ...(age_of_children ? { age_of_children } : {}),
        });
        const ratesData = await fetchJson<any>(
          `hotel rates (${hotel.key})`,
          `https://data.xotelo.com/api/rates?${ratesParams.toString()}`,
        );

        return {
          name: hotel.name,
          hotel_key: hotel.key,
          accommodation_type: hotel.accommodation_type,
          image: hotel.image,
          url: hotel.url,
          review_summary: hotel.review_summary,
          price_ranges: hotel.price_ranges,
          geo: hotel.geo,
          mentions: hotel.mentions,

          rates: ratesData.error ? [] : (ratesData.result?.rates ?? []),

          cheapest_rate: ratesData.result?.rates?.length
            ? Math.min(...ratesData.result.rates.map((r: any) => r.rate))
            : null,
          currency,
        };
      }),
    );

    return {
      location_key,
      total_count: listData.result.total_count,
      chk_in,
      chk_out,
      hotels: hotelsWithRates,
    };
  },
});

async function otmGet<T>(
  label: string,
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  const query = toSearchParams({
    apikey: getRequiredEnvVar("OPEN_TRIP_MAP_API_KEY"),
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });

  return fetchJson<T>(
    label,
    `https://api.opentripmap.com/0.1/en/places/${endpoint}?${query.toString()}`,
  );
}

export const experienceSearchTool = tool({
  description:
    "Search for things to do, see, and eat in any location worldwide.",
  inputSchema: z.object({
    location: z
      .string()
      .describe("City or place name, e.g. 'Tokyo' or 'Paris'"),
    radius_km: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe("Search radius in kilometers"),
  }),
  execute: async ({ location, radius_km }) => {
    const geo = await otmGet<any>("geoname lookup", "geoname", {
      name: location,
    });
    if (geo.status !== "OK") return { error: `Could not find "${location}"` };

    const pois = await otmGet<any[]>("radius lookup", "radius", {
      lat: geo.lat,
      lon: geo.lon,
      radius: radius_km * 1000,
      limit: 6,
      rate: 2,
      format: "json",
    });

    const results: Array<{
      name: string;
      categories: string[];
      description: string | null;
      image: string | null;
      url: string | null;
      coordinates: { lat: number | undefined; lon: number | undefined };
    }> = [];
    const skippedPois: Array<{ xid: string; reason: string }> = [];

    for (const [index, poi] of (pois ?? []).entries()) {
      try {
        const details = await otmGet<any>(
          `poi details (${poi.xid})`,
          `xid/${poi.xid}`,
          {},
        );

        results.push({
          name: details.name || poi.name,
          categories: poi.kinds?.split(",").map((k: string) => k.trim()) ?? [],
          description:
            details.wikipedia_extracts?.text?.slice(0, 300) ??
            details.info?.descr ??
            null,
          image: details.preview?.source ?? null,
          url: details.otm ?? null,
          coordinates: { lat: poi.point?.lat, lon: poi.point?.lon },
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        skippedPois.push({ xid: poi.xid, reason });
      }

      if (index < (pois ?? []).length - 1) {
        await sleep(250);
      }
    }

    return {
      location: `${geo.name}, ${geo.country}`,
      results,
      skipped_pois: skippedPois,
    };
  },
});

export const createListApprovalRequestsTool = (userId: string) =>
  tool({
    description: "Lists all the current user's approval requests.",
    inputSchema: z.object({}),
    execute: async () => {
      const rows = await db.query.ApprovalRequestTable.findMany({
        where: eq(ApprovalRequestTable.userId, userId),
      });

      return rows.map(serializeApprovalRequest);
    },
  });

export const createGetApprovalRequestTool = (userId: string) =>
  tool({
    description:
      "Get a user's approval request based on the id, destination, or price.",
    inputSchema: z.object({
      id: z
        .uuid()
        .optional()
        .describe(
          "The id of the approval request. You will only include this if you remember what the id of the approval request was. Otherwise rely on the destination or cost instead.",
        ),
      destination: z
        .string()
        .optional()
        .describe(
          "The destination of the approval request. Note that this will be used to search by ilike.",
        ),
      gteCost: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "The greater than cost boundary that you might want to set if the user gives you a cost it must be greater than or equal to.",
        ),
      lteCost: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "The less than cost boundary that you might want to set if the user gives you a cost it must be less than or equal to.",
        ),
    }),
    execute: async (input) => {
      const { id, destination, gteCost, lteCost } = input;

      const row = await db.query.ApprovalRequestTable.findFirst({
        where: and(
          eq(ApprovalRequestTable.userId, userId),
          id ? eq(ApprovalRequestTable.id, id) : undefined,
          destination?.trim()
            ? ilike(ApprovalRequestTable.destination, `%${destination}%`)
            : undefined,
          gteCost ? gte(ApprovalRequestTable.cost, gteCost) : undefined,
          lteCost ? lte(ApprovalRequestTable.cost, lteCost) : undefined,
        ),
      });

      return row ? serializeApprovalRequest(row) : null;
    },
  });

export const createCreateApprovalRequestTool = (userId: string) =>
  tool({
    description: "Create an approval request for the current user.",
    inputSchema: z.object({
      destination: z
        .string()
        .min(1)
        .describe(
          "The destination of the trip that will be associated with this approval request.",
        ),
      cost: z
        .number()
        .int()
        .positive()
        .min(1)
        .describe(
          "The cost of the trip that will be associated with this approval request.",
        ),
    }),
    execute: async (input) => {
      const [insertedApprovalRequest] = await db
        .insert(ApprovalRequestTable)
        .values({
          userId,
          ...input,
        })
        .returning();

      return insertedApprovalRequest
        ? serializeApprovalRequest(insertedApprovalRequest)
        : { error: "FAILED TO INSERT APPROVAL REQUEST" };
    },
  });
