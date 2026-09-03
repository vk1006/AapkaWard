export type LatencySample = {
  ms: number;
  status: number;
  ok: boolean;
};

export type LatencyStats = {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  errors: number;
};

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(rank, sorted.length - 1))]!;
}

export function summarize(samples: LatencySample[]): LatencyStats {
  const durations = samples.map((s) => s.ms).sort((a, b) => a - b);
  const errors = samples.filter((s) => !s.ok).length;

  if (durations.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, errors: 0 };
  }

  const sum = durations.reduce((total, ms) => total + ms, 0);

  return {
    count: durations.length,
    min: durations[0]!,
    max: durations[durations.length - 1]!,
    avg: Math.round(sum / durations.length),
    p50: Math.round(percentile(durations, 50)),
    p95: Math.round(percentile(durations, 95)),
    errors,
  };
}
