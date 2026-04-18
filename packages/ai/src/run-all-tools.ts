import { inspect } from "node:util";
import {
  experienceSearchTool,
  flightSearchTool,
  hotelSearchTool,
} from "./tools.ts";

type RunnableTool = {
  description?: string;
  inputSchema: {
    parse: (value: unknown) => unknown;
  };
  execute?: (...args: any[]) => Promise<unknown> | unknown;
};

type ToolRunConfig = {
  name: string;
  tool: RunnableTool;
  params: unknown;
  requiredEnv?: string[];
};

const toolRuns: ToolRunConfig[] = [
  {
    name: "flightSearch",
    tool: flightSearchTool as unknown as RunnableTool,
    params: {
      dep_iata: "ORD",
      arr_iata: "LAX",
      flight_status: "scheduled",
    },
    requiredEnv: ["AVIATION_STACK_API_KEY"],
  },
  {
    name: "hotelSearchTool",
    tool: hotelSearchTool as unknown as RunnableTool,
    params: {
      query: "Chicago",
      chk_in: "2026-05-20",
      chk_out: "2026-05-22",
      currency: "USD",
      rooms: 1,
      adults: 2,
      limit: 3,
      sort: "best_value",
    },
  },
  {
    name: "experienceSearch",
    tool: experienceSearchTool as unknown as RunnableTool,
    params: {
      location: "Chicago",
      radius_km: 5,
    },
    requiredEnv: ["OPEN_TRIP_MAP_API_KEY"],
  },
];

function logStep(message: string, details?: unknown) {
  if (details === undefined) {
    console.log(`[run-all-tools] ${message}`);
    return;
  }

  console.log(
    `[run-all-tools] ${message} ${inspect(details, {
      depth: 6,
      colors: false,
      breakLength: 100,
      compact: false,
    })}`,
  );
}

function missingEnvVars(requiredEnv: string[] = []) {
  return requiredEnv.filter((name) => !process.env[name]);
}

async function runTool(config: ToolRunConfig) {
  const missingEnv = missingEnvVars(config.requiredEnv);

  console.log("\n============================================================");
  logStep(`Starting ${config.name}`);

  if (missingEnv.length > 0) {
    logStep(`Missing required environment variables for ${config.name}`, {
      missingEnv,
    });
  }

  logStep("Raw params", config.params);

  const parsedParams = config.tool.inputSchema.parse(config.params);
  logStep("Parsed params", parsedParams);

  if (typeof config.tool.execute !== "function") {
    throw new Error(`${config.name} does not expose an executable handler`);
  }

  const startedAt = Date.now();
  const result = await config.tool.execute(parsedParams, {
    toolCallId: `${config.name}-debug-run`,
    messages: [],
  });
  const durationMs = Date.now() - startedAt;

  logStep(`Completed ${config.name}`, { durationMs });
  logStep("Result", result);
}

async function main() {
  logStep("Preparing to run all tools", {
    toolCount: toolRuns.length,
    tools: toolRuns.map((toolRun) => toolRun.name),
  });

  const failures: Array<{ name: string; error: unknown }> = [];

  for (const toolRun of toolRuns) {
    try {
      await runTool(toolRun);
    } catch (error) {
      failures.push({ name: toolRun.name, error });
      logStep(`Failed while running ${toolRun.name}`, error);
    }
  }

  console.log("\n============================================================");

  if (failures.length === 0) {
    logStep("All tools finished successfully");
    return;
  }

  logStep("Finished with failures", {
    failedTools: failures.map((failure) => failure.name),
    failureCount: failures.length,
  });

  process.exitCode = 1;
}

await main();
