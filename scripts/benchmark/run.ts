import "../load-env";

import { writeFile } from "fs/promises";
import {
  DEFAULT_BASE_URL,
  DEFAULT_ITERATIONS,
  DEFAULT_WARMUP,
  ENDPOINTS,
  MOCK_LOGIN,
  PROD_BASE_URL,
  type BenchmarkEndpoint,
} from "./config";
import { summarize, type LatencySample, type LatencyStats } from "./stats";

type BenchResult = {
  endpoint: BenchmarkEndpoint;
  stats: LatencyStats;
  thresholdMs?: number;
  overThreshold: boolean;
};

type CliOptions = {
  baseUrl: string;
  iterations: number;
  warmup: number;
  strict: boolean;
  json: boolean;
  skipAuth: boolean;
  out?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    baseUrl: DEFAULT_BASE_URL,
    iterations: DEFAULT_ITERATIONS,
    warmup: DEFAULT_WARMUP,
    strict: false,
    json: false,
    skipAuth: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--strict") opts.strict = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--skip-auth") opts.skipAuth = true;
    else if (arg === "--prod") {
      opts.skipAuth = true;
      if (!PROD_BASE_URL) {
        console.error("BENCH_PROD_URL is not set");
        process.exit(1);
      }
      opts.baseUrl = PROD_BASE_URL;
    } else if (arg === "--base-url") opts.baseUrl = argv[++i] ?? opts.baseUrl;
    else if (arg === "--iterations") opts.iterations = Number(argv[++i] ?? opts.iterations);
    else if (arg === "--warmup") opts.warmup = Number(argv[++i] ?? opts.warmup);
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`API latency benchmark

Usage:
  npm run bench:api [-- options]       # local dev (includes mock login)
  npm run bench:prod [-- options]      # production public APIs only

Options:
  --base-url <url>     Default: ${DEFAULT_BASE_URL}
  --prod               Use BENCH_PROD_URL and skip auth endpoints
  --skip-auth          Skip /api/me (use for production with OTP_ADAPTER=firebase)
  --iterations <n>     Measured requests per endpoint (default: ${DEFAULT_ITERATIONS})
  --warmup <n>         Warmup requests discarded (default: ${DEFAULT_WARMUP})
  --strict             Exit 1 if any p95 exceeds configured threshold
  --json               Print machine-readable JSON to stdout
  --out <file>         Write JSON report to file

Local: requires npm run dev
Production: set BENCH_PROD_URL=https://your-domain.com (in .env.local or env)
`);
}

function sessionFromSetCookie(headers: Headers): string | null {
  const cookies = headers.getSetCookie?.() ?? [];
  for (const header of cookies) {
    const match = header.match(/^ward_session=([^;]+)/);
    if (match) return `ward_session=${match[1]}`;
  }

  const single = headers.get("set-cookie");
  if (single) {
    const match = single.match(/ward_session=([^;]+)/);
    if (match) return `ward_session=${match[1]}`;
  }

  return null;
}

async function login(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(MOCK_LOGIN),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mock login failed (${response.status}): ${body}`);
  }

  const cookie = sessionFromSetCookie(response.headers);
  if (!cookie) {
    throw new Error("Mock login succeeded but no ward_session cookie was returned");
  }

  return cookie;
}

async function measureOnce(
  baseUrl: string,
  endpoint: BenchmarkEndpoint,
  cookie?: string
): Promise<LatencySample> {
  const url = `${baseUrl}${endpoint.path}`;
  const started = performance.now();

  const response = await fetch(url, {
    method: endpoint.method,
    headers: {
      ...(endpoint.body ? { "Content-Type": "application/json" } : {}),
      ...(endpoint.auth && cookie ? { Cookie: cookie } : {}),
    },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    redirect: "manual",
  });

  const ms = Math.round(performance.now() - started);
  const accepted =
    endpoint.acceptStatuses ??
    (endpoint.expectStatus !== undefined ? [endpoint.expectStatus] : [200]);
  const ok = accepted.includes(response.status);

  return { ms, status: response.status, ok };
}

async function benchmarkEndpoint(
  baseUrl: string,
  endpoint: BenchmarkEndpoint,
  iterations: number,
  warmup: number,
  cookie?: string
): Promise<LatencySample[]> {
  for (let i = 0; i < warmup; i++) {
    await measureOnce(baseUrl, endpoint, cookie);
  }

  const samples: LatencySample[] = [];
  for (let i = 0; i < iterations; i++) {
    samples.push(await measureOnce(baseUrl, endpoint, cookie));
  }

  return samples;
}

async function discoverFileEndpoint(baseUrl: string): Promise<BenchmarkEndpoint | null> {
  const response = await fetch(`${baseUrl}/api/issues`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    items?: Array<{ media?: Array<{ url?: string }> }>;
  };

  const fileUrl = payload.items?.flatMap((item) => item.media ?? []).find((m) => m.url)?.url;
  if (!fileUrl || !fileUrl.startsWith("/api/files/")) return null;

  return {
    name: "issue media file",
    method: "GET",
    path: fileUrl,
    category: "storage",
    expectStatus: 307,
    p95Ms: 800,
    dynamic: true,
  };
}

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}

function formatTable(results: BenchResult[]): string {
  const header = [
    pad("Endpoint", 22),
    pad("p50", 7),
    pad("p95", 7),
    pad("avg", 7),
    pad("max", 7),
    pad("err", 5),
    "threshold",
  ].join(" ");

  const lines = [header, "-".repeat(header.length)];

  for (const result of results) {
    const { stats, thresholdMs, overThreshold } = result;
    const threshold =
      thresholdMs === undefined
        ? "—"
        : overThreshold
          ? `>${thresholdMs}ms !`
          : `<=${thresholdMs}ms`;

    lines.push(
      [
        pad(result.endpoint.name, 22),
        pad(`${stats.p50}ms`, 7),
        pad(`${stats.p95}ms`, 7),
        pad(`${stats.avg}ms`, 7),
        pad(`${stats.max}ms`, 7),
        pad(String(stats.errors), 5),
        threshold,
      ].join(" ")
    );
  }

  return lines.join("\n");
}

async function ensureServerUp(baseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`health returned ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot reach ${baseUrl}/api/health (${message}). Start the app first: npm run dev`
    );
  }
}

function selectEndpoints(all: BenchmarkEndpoint[], skipAuth: boolean): BenchmarkEndpoint[] {
  return skipAuth ? all.filter((endpoint) => !endpoint.auth) : all;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await ensureServerUp(opts.baseUrl);

  const cookie = opts.skipAuth ? undefined : await login(opts.baseUrl);
  const endpoints = selectEndpoints([...ENDPOINTS], opts.skipAuth);
  const fileEndpoint = await discoverFileEndpoint(opts.baseUrl);
  if (fileEndpoint) endpoints.push(fileEndpoint);

  const results: BenchResult[] = [];

  for (const endpoint of endpoints) {
    const samples = await benchmarkEndpoint(
      opts.baseUrl,
      endpoint,
      opts.iterations,
      opts.warmup,
      endpoint.auth ? cookie : undefined
    );

    const stats = summarize(samples);
    const thresholdMs = endpoint.p95Ms;
    const overThreshold = thresholdMs !== undefined && stats.p95 > thresholdMs;

    results.push({ endpoint, stats, thresholdMs, overThreshold });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: opts.baseUrl,
    iterations: opts.iterations,
    warmup: opts.warmup,
    skipAuth: opts.skipAuth,
    results: results.map((r) => ({
      name: r.endpoint.name,
      method: r.endpoint.method,
      path: r.endpoint.path,
      category: r.endpoint.category,
      stats: r.stats,
      thresholdMs: r.thresholdMs,
      overThreshold: r.overThreshold,
    })),
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\nAPI latency benchmark — ${opts.baseUrl}`);
    console.log(`Iterations: ${opts.iterations} (+${opts.warmup} warmup per endpoint)`);
    if (opts.skipAuth) {
      console.log("Auth endpoints skipped (production / --skip-auth mode)\n");
    } else {
      console.log("");
    }
    console.log(formatTable(results));

    const slow = results.filter((r) => r.overThreshold);
    const notes = results.filter((r) => r.endpoint.note);
    if (slow.length > 0) {
      console.log(`\nSlow (p95 over threshold):`);
      for (const item of slow) {
        console.log(
          `  - ${item.endpoint.name}: p95 ${item.stats.p95}ms > ${item.thresholdMs}ms`
        );
      }
    } else {
      console.log("\nAll endpoints within configured p95 thresholds.");
    }

    if (notes.length > 0) {
      console.log("\nNotes:");
      for (const item of notes) {
        console.log(`  - ${item.endpoint.name}: ${item.endpoint.note}`);
      }
    }
  }

  if (opts.out) {
    await writeFile(opts.out, `${JSON.stringify(report, null, 2)}\n`);
    if (!opts.json) console.log(`\nWrote ${opts.out}`);
  }

  if (opts.strict && results.some((r) => r.overThreshold || r.stats.errors > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
