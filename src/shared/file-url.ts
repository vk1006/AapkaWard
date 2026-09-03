/** Stable app URL for a stored file; presigning happens on demand in /api/files. */
export function publicFileUrl(storeKey: string): string {
  return `/api/files/${storeKey.split("/").map(encodeURIComponent).join("/")}`;
}
