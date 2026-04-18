import { inspect } from "node:util";
import { tool } from "ai";
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

const SECRET_QUERY_KEYS = new Set(["access_key", "apikey"]);

function logToolEvent(toolName: string, message: string, details?: unknown) {
  const prefix = `[tools:${toolName}]`;

  if (details === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }

  console.log(
    `${prefix} ${message} ${inspect(details, {
      depth: 5,
      colors: false,
      breakLength: 100,
      compact: false,
    })}`,
  );
}

function getRequiredEnvVar(name: string, toolName: string) {
  const value = process.env[name];

  if (!value) {
    const message = `Missing required environment variable: ${name}`;
    logToolEvent(toolName, message);
    throw new Error(message);
  }

  logToolEvent(toolName, `Resolved environment variable ${name}`);
  return value;
}

function toSearchParams(
  params: Record<string, string | number | undefined | null>,
) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function redactUrl(url: string) {
  const parsed = new URL(url);

  for (const key of SECRET_QUERY_KEYS) {
    if (parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, "***");
    }
  }

  return parsed.toString();
}

function summarizeJsonPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return {
      type: "array",
      length: payload.length,
      preview: payload.slice(0, 2),
    };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const summary: Record<string, unknown> = {
      type: "object",
      keys: Object.keys(record),
    };

    if (Array.isArray(record.data)) {
      summary.dataCount = record.data.length;
    }

    if (record.result && typeof record.result === "object") {
      const result = record.result as Record<string, unknown>;

      if (Array.isArray(result.list)) {
        summary.resultListCount = result.list.length;
      }

      if (Array.isArray(result.rates)) {
        summary.resultRateCount = result.rates.length;
      }

      if (typeof result.total_count === "number") {
        summary.resultTotalCount = result.total_count;
      }
    }

    return summary;
  }

  return payload;
}

function normalizeHotelApiError(error: unknown) {
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
}

function extractApiErrorDetails(payload: unknown) {
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
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithLogging<T>(
  toolName: string,
  label: string,
  url: string,
): Promise<T> {
  logToolEvent(toolName, `${label}: sending request`, {
    url: redactUrl(url),
  });

  const res = await fetch(url);

  logToolEvent(toolName, `${label}: received response`, {
    status: res.status,
    ok: res.ok,
    statusText: res.statusText,
  });

  const json = (await res.json()) as T;

  logToolEvent(toolName, `${label}: parsed JSON`, summarizeJsonPayload(json));

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
}

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
    const toolName = "flightSearch";
    logToolEvent(toolName, "Starting execution", params);

    const accessKey = getRequiredEnvVar("AVIATION_STACK_API_KEY", toolName);
    const query = toSearchParams(params as Record<string, string | number>);
    const url = `https://api.aviationstack.com/v1/flights?access_key=${accessKey}&limit=10&${query.toString()}`;

    const json = await fetchJsonWithLogging<any>(
      toolName,
      "flight lookup",
      url,
    );

    logToolEvent(toolName, "Finished execution", {
      dataCount: Array.isArray(json?.data) ? json.data.length : 0,
      pagination: json?.pagination ?? null,
      error: json?.error ?? null,
    });
    return json;
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
    const toolName = "hotelSearchTool";
    logToolEvent(toolName, "Starting execution", {
      query,
      chk_in,
      chk_out,
      currency,
      rooms,
      adults,
      age_of_children: age_of_children ?? null,
      limit,
      sort,
    });

    const searchParams = toSearchParams({ query });
    const searchData = await fetchJsonWithLogging<any>(
      toolName,
      "hotel search",
      `https://data.xotelo.com/api/search?${searchParams.toString()}`,
    );

    if (searchData.error || !searchData.result?.list?.length) {
      const error = normalizeHotelApiError(searchData.error);
      logToolEvent(toolName, "Hotel search returned no matches", {
        error: error ?? null,
      });
      return { error: error ?? "No hotels found for that query." };
    }

    const location_key = searchData.result.list[0].location_key;
    logToolEvent(toolName, "Resolved location key", { location_key });

    const listParams = toSearchParams({
      location_key,
      limit: String(limit),
      offset: "0",
      sort,
    });
    const listData = await fetchJsonWithLogging<any>(
      toolName,
      "hotel list",
      `https://data.xotelo.com/api/list?${listParams.toString()}`,
    );

    if (listData.error || !listData.result?.list?.length) {
      const error = normalizeHotelApiError(listData.error);
      logToolEvent(toolName, "Hotel list request returned no hotels", {
        error: error ?? null,
      });
      return { error: error ?? "Could not retrieve hotel list." };
    }

    logToolEvent(toolName, "Preparing rate lookups", {
      hotelCount: listData.result.list.length,
    });

    const hotelsWithRates = await Promise.all(
      listData.result.list.map(async (hotel: any) => {
        logToolEvent(toolName, "Fetching rates for hotel", {
          hotelName: hotel.name,
          hotelKey: hotel.key,
        });

        const ratesParams = toSearchParams({
          hotel_key: hotel.key,
          chk_in,
          chk_out,
          currency,
          rooms: String(rooms),
          adults: String(adults),
          ...(age_of_children ? { age_of_children } : {}),
        });
        const ratesData = await fetchJsonWithLogging<any>(
          toolName,
          `hotel rates (${hotel.key})`,
          `https://data.xotelo.com/api/rates?${ratesParams.toString()}`,
        );

        logToolEvent(toolName, "Completed rate lookup for hotel", {
          hotelName: hotel.name,
          hotelKey: hotel.key,
          rateCount: Array.isArray(ratesData.result?.rates)
            ? ratesData.result.rates.length
            : 0,
          error: normalizeHotelApiError(ratesData.error) ?? null,
        });

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

    logToolEvent(toolName, "Finished execution", {
      location_key,
      total_count: listData.result.total_count,
      returnedHotels: hotelsWithRates.length,
    });

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
  toolName: string,
  label: string,
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  const query = toSearchParams({
    apikey: getRequiredEnvVar("OPEN_TRIP_MAP_API_KEY", toolName),
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });

  return fetchJsonWithLogging<T>(
    toolName,
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
    const toolName = "experienceSearch";
    logToolEvent(toolName, "Starting execution", { location, radius_km });

    const geo = await otmGet<any>(
      toolName,
      "geoname lookup",
      "geoname",
      { name: location },
    );
    if (geo.status !== "OK") return { error: `Could not find "${location}"` };

    logToolEvent(toolName, "Resolved location", {
      name: geo.name,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
    });

    const pois = await otmGet<any[]>(
      toolName,
      "radius lookup",
      "radius",
      {
        lat: geo.lat,
        lon: geo.lon,
        radius: radius_km * 1000,
        limit: 6,
        rate: 2,
        format: "json",
      },
    );

    logToolEvent(toolName, "Fetched nearby points of interest", {
      count: Array.isArray(pois) ? pois.length : 0,
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
      logToolEvent(toolName, "Fetching POI details", {
        xid: poi.xid,
        name: poi.name,
        position: index + 1,
      });

      try {
        const details = await otmGet<any>(
          toolName,
          `poi details (${poi.xid})`,
          `xid/${poi.xid}`,
          {},
        );

        logToolEvent(toolName, "Fetched POI details", {
          xid: poi.xid,
          resolvedName: details.name || poi.name || null,
        });

        results.push({
          name: details.name || poi.name,
          categories:
            poi.kinds?.split(",").map((k: string) => k.trim()) ?? [],
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
        logToolEvent(toolName, "Skipping POI after detail lookup failure", {
          xid: poi.xid,
          reason,
        });
      }

      if (index < (pois ?? []).length - 1) {
        await sleep(250);
      }
    }

    logToolEvent(toolName, "Finished execution", {
      location: `${geo.name}, ${geo.country}`,
      resultCount: results.length,
      skippedPoiCount: skippedPois.length,
    });

    return {
      location: `${geo.name}, ${geo.country}`,
      results,
      skipped_pois: skippedPois,
    };
  },
});
