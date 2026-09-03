export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** True in dev when the browser is on localhost or 127.0.0.1 (or during SSR in dev). */
export function isLocalDevHost(): boolean {
  if (!isDevelopment()) return false;
  if (typeof window === "undefined") return true;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function devLogError(...args: unknown[]): void {
  if (isDevelopment()) {
    console.error(...args);
  }
}
