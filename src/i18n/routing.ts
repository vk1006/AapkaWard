import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["hi", "en"],
  defaultLocale: "hi",
  localePrefix: "always",
  // Keep the public entry point in Hindi even when the browser prefers English.
  // Visitors can still select /en with the language switcher.
  localeDetection: false,
});
