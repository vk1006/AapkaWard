import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getContainer } from "@/infrastructure/container";
import { cardClass } from "@/components/ui";
import { SiteLogo } from "@/components/SiteLogo";
import { CandidatePortraitPlaceholder } from "@/components/CandidatePortraitPlaceholder";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const { content } = getContainer();
  const manifesto = await content.listManifesto(true);

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#b8d8e7] px-5 py-7 shadow-xl shadow-[#7daabd]/20 dark:bg-neutral-950 dark:shadow-black/40 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="absolute inset-0 -z-10 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,.72fr)] lg:gap-10">
          <div className="max-w-3xl py-2 lg:py-5">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/75 ring-1 ring-white dark:bg-neutral-800 dark:ring-neutral-700"><SiteLogo className="h-8 w-8 text-[#3a00ff]" /></span>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#3a00ff] dark:text-white">{t("eyebrow")}</p>
            </div>
            <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-[.94] tracking-[-.045em] text-[#3a00ff] dark:text-white sm:text-5xl md:text-6xl">{t("title")}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#24106a] dark:text-neutral-300 sm:text-lg">{t("subtitle")}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/suggestions" className="min-h-12 rounded-full bg-[#3a00ff] px-6 py-3 text-center font-bold text-white shadow-lg shadow-[#3a00ff]/20 hover:bg-[#2600b3] dark:bg-white dark:text-black dark:shadow-none dark:hover:bg-neutral-200">{t("ctaSuggestions")}</Link>
              <Link href="/events" className="min-h-12 rounded-full border border-[#3a00ff]/30 bg-white/60 px-6 py-3 text-center font-bold text-[#3a00ff] hover:bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800">{t("ctaEvents")}</Link>
            </div>
          </div>
          <CandidatePortraitPlaceholder label={t("candidatePhotoLabel")} hint={t("candidatePhotoHint")} />
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3a00ff] dark:text-white">{t("priorityEyebrow")}</p>
            <h2 className="page-title mt-1">{t("promiseTitle")}</h2>
          </div>
          <Link href="/manifesto" className="text-sm font-bold text-[#3a00ff] hover:underline dark:text-white">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {manifesto.slice(0, 4).map((item) => (
            <article key={item.id} className={`${cardClass} group relative overflow-hidden border-l-4 border-l-[#3a00ff] dark:border-l-white`}>
              <span className="mb-3 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#e7e1ff] px-3 text-xs font-extrabold text-[#3a00ff] dark:bg-neutral-800 dark:text-white">
                {item.theme}
              </span>
              <h3 className="font-bold text-[#25115d] dark:text-white">
                {locale === "hi" ? item.titleHi : item.titleEn}
              </h3>
              <p className="mt-2 line-clamp-3 leading-relaxed text-slate-600 dark:text-neutral-300">
                {locale === "hi" ? item.bodyHi : item.bodyEn}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
