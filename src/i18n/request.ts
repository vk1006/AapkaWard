import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { isDevelopment } from "@/shared/is-local-dev";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";

const catalogs = { en, hi };

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "hi" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: catalogs[locale as keyof typeof catalogs],
    getMessageFallback({ key, namespace }) {
      return namespace ? `${namespace}.${key}` : key;
    },
    onError(error) {
      if (error.code === "MISSING_MESSAGE") return;
      if (isDevelopment()) console.error(error);
    },
  };
});
