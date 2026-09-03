import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getContainer } from "@/infrastructure/container";
import { cardClass } from "@/components/ui";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const { content } = getContainer();
  await content.ensureDefaultPages();
  const manifesto = await content.listManifesto(true);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 p-5 text-white shadow-lg sm:p-8 dark:from-orange-700 dark:to-orange-950">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-base text-orange-100 sm:text-lg">{t("subtitle")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/suggestions"
            className="rounded-lg bg-white px-6 py-3 text-center font-medium text-orange-700 hover:bg-orange-50 dark:bg-stone-100 dark:text-orange-800 dark:hover:bg-white"
          >
            {t("ctaSuggestions")}
          </Link>
          <Link
            href="/events"
            className="rounded-lg border-2 border-white px-6 py-3 text-center font-medium hover:bg-white/10"
          >
            {t("ctaEvents")}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="page-title mb-4">{t("promiseTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {manifesto.slice(0, 4).map((item) => (
            <div key={item.id} className={cardClass}>
              <h3 className="font-semibold text-orange-700 dark:text-orange-300">
                {locale === "hi" ? item.titleHi : item.titleEn}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-stone-400">
                {locale === "hi" ? item.bodyHi : item.bodyEn}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/manifesto"
          className="mt-4 inline-block text-orange-600 hover:underline dark:text-orange-400"
        >
          →
        </Link>
      </section>
    </div>
  );
}
