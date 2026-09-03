export type HttpMethod = "GET" | "POST";

export type BenchmarkEndpoint = {
  /** Display name in the report */
  name: string;
  method: HttpMethod;
  path: string;
  /** Expected HTTP status (default 200). Use acceptStatuses for multiple valid codes. */
  expectStatus?: number;
  acceptStatuses?: number[];
  /** Fail in --strict mode when p95 exceeds this (ms) */
  p95Ms?: number;
  category?: string;
  /** Requires mock login cookie */
  auth?: boolean;
  body?: unknown;
  /** Skip unless explicitly included (e.g. dynamic file URLs) */
  dynamic?: boolean;
  /** Shown when the endpoint returns a non-success status that is still accepted */
  note?: string;
};

export const DEFAULT_BASE_URL = process.env.BENCH_BASE_URL ?? "http://127.0.0.1:3000";
export const PROD_BASE_URL = process.env.BENCH_PROD_URL ?? "";
export const DEFAULT_ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 10);
export const DEFAULT_WARMUP = Number(process.env.BENCH_WARMUP ?? 2);

/** Tune thresholds for your environment (remote Neon is slower than local Postgres). */
export const ENDPOINTS: BenchmarkEndpoint[] = [
  {
    name: "health",
    method: "GET",
    path: "/api/health",
    category: "core",
    p95Ms: 600,
  },
  {
    name: "suggestions list",
    method: "GET",
    path: "/api/suggestions",
    category: "public",
    p95Ms: 900,
  },
  {
    name: "issues list",
    method: "GET",
    path: "/api/issues",
    category: "public",
    acceptStatuses: [200, 404],
    note: "404 when issues feature flag is off",
    p95Ms: 1200,
  },
  {
    name: "manifesto",
    method: "GET",
    path: "/api/manifesto",
    category: "public",
    p95Ms: 700,
  },
  {
    name: "events",
    method: "GET",
    path: "/api/events",
    category: "public",
    p95Ms: 900,
  },
  {
    name: "page (about)",
    method: "GET",
    path: "/api/pages/about",
    category: "public",
    p95Ms: 700,
  },
  {
    name: "me (session)",
    method: "GET",
    path: "/api/me",
    category: "auth",
    auth: true,
    p95Ms: 700,
  },
];

export const MOCK_LOGIN = {
  phone: process.env.BENCH_LOGIN_PHONE ?? "+919999999999",
  code: process.env.BENCH_LOGIN_CODE ?? "123456",
};
