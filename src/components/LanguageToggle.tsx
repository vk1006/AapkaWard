"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const next = locale === "hi" ? "en" : "hi";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-orange-200 px-3 text-xs font-semibold uppercase text-orange-800 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-stone-600 dark:bg-stone-800 dark:text-orange-300 dark:hover:bg-stone-700"
      aria-label={t("language")}
    >
      {locale === "hi" ? "EN" : "हि"}
    </button>
  );
}
