import { useTranslations } from "next-intl";

export default function LocaleLoading() {
  const t = useTranslations("common");
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label={t("loadingPage")}>
      <div className="h-9 w-56 rounded-lg bg-[#e7e1ff] dark:bg-neutral-800" />
      <div className="h-4 w-full max-w-md rounded bg-[#eef7fc] dark:bg-neutral-800" />
      <div className="mt-6 space-y-3">
          <div className="h-28 rounded-xl bg-white ring-1 ring-[#d9e9f2] dark:bg-neutral-900 dark:ring-neutral-700" />
          <div className="h-28 rounded-xl bg-white ring-1 ring-[#d9e9f2] dark:bg-neutral-900 dark:ring-neutral-700" />
          <div className="h-28 rounded-xl bg-white ring-1 ring-[#d9e9f2] dark:bg-neutral-900 dark:ring-neutral-700" />
      </div>
    </div>
  );
}
