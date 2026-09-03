const ALLOWED_NEXT =
  /^\/(suggestions|issues|events|manifesto|about|admin|login)(\/[\w-]+)?$/;

export function safeNextPath(next: string | null | undefined, fallback = "/suggestions"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  if (ALLOWED_NEXT.test(next)) return next;
  return fallback;
}
