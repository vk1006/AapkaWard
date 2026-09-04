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
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#c7deec] bg-white px-3 text-xs font-bold uppercase text-[#3a00ff] transition-colors hover:bg-[#e7e1ff] focus:outline-none focus:ring-2 focus:ring-[#3a00ff]/25 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
      aria-label={t("language")}
    >
      {locale === "hi" ? "EN" : "हि"}
    </button>
  );
}
