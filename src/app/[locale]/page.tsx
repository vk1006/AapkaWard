import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getContainer } from "@/infrastructure/container";
import { cardClass } from "@/components/ui";
import { SiteLogo } from "@/components/SiteLogo";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tManifesto = await getTranslations("manifesto");

  const { content, platform } = getContainer();
  const [manifesto, suggestionsEnabled, eventsEnabled] = await Promise.all([
    content.listManifesto(true),
    platform.isEnabled("suggestions"),
    platform.isEnabled("events"),
  ]);

  const primaryHref = suggestionsEnabled ? "/suggestions" : "#priorities";
  const primaryLabel = suggestionsEnabled
    ? t("ctaSuggestions")
    : (locale === "hi" ? "प्राथमिकताएँ देखें ↓" : "Our Priorities ↓");

  const secondaryHref = eventsEnabled ? "/events" : "/about";
  const secondaryLabel = eventsEnabled
    ? t("ctaEvents")
    : (locale === "hi" ? "उम्मीदवार परिचय" : "About Candidate");

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
              <Link href={primaryHref} className="min-h-12 rounded-full bg-[#3a00ff] px-6 py-3 text-center font-bold text-white shadow-lg shadow-[#3a00ff]/20 hover:bg-[#2600b3] dark:bg-white dark:text-black dark:shadow-none dark:hover:bg-neutral-200">{primaryLabel}</Link>
              <Link href={secondaryHref} className="min-h-12 rounded-full border border-[#3a00ff]/30 bg-white/60 px-6 py-3 text-center font-bold text-[#3a00ff] hover:bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800">{secondaryLabel}</Link>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.5rem_1.5rem_4.5rem_1.5rem]">
              <Image
                src="/images/ward-20-candidate-portrait-cutout-v2.png"
                alt={t("candidatePhotoLabel")}
                fill
                preload
                sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 24rem, 30rem"
                className="relative z-10 object-cover object-top"
              />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-left sm:mx-auto sm:max-w-sm">
              <div className="rounded-2xl border border-white/70 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900">
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#3a00ff] dark:text-neutral-300">{t("candidateNameLabel")}</dt>
                <dd className="mt-1 text-lg font-extrabold leading-none text-[#25115d] dark:text-white">{t("candidateName")}</dd>
                <dd className="mt-2 inline-flex rounded-full bg-[#eef7fc] px-2 py-1 text-xs font-bold text-[#25115d] dark:bg-neutral-800 dark:text-neutral-200">{t("ballotNumberLabel")}: {t("ballotNumber")}</dd>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[#3a00ff] px-3 py-3 text-center text-white shadow-xl shadow-[#3a00ff]/35 ring-2 ring-white/75">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-white/75">{t("electionSymbolLabel")}</dt>
                <dd className="my-1 flex justify-center" aria-hidden="true">
                  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" className="text-white">
                    <path d="M9 7h30v33H9z" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M24 7v33M12 13h24M12 34h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="21" cy="24" r="1.8" fill="currentColor" />
                    <circle cx="27" cy="24" r="1.8" fill="currentColor" />
                    <path d="M13 40v3M35 40v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </dd>
                <dd className="text-sm font-extrabold leading-tight">{t("electionSymbol")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="priorities" className="scroll-mt-24">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3a00ff] dark:text-white">
            {t("priorityEyebrow")}
          </p>
          <h2 className="page-title mt-1">{t("promiseTitle")}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {manifesto.map((item) => {
            const title = locale === "hi" ? item.titleHi : item.titleEn;
            const body = locale === "hi" ? item.bodyHi : item.bodyEn;
            return (
              <article
                key={item.id}
                id={item.slug}
                className={`${cardClass} scroll-mt-28 group relative flex flex-col justify-between overflow-hidden border-l-4 border-l-[#3a00ff] dark:border-l-white`}
              >
                <div>
                  <span className="mb-3 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#e7e1ff] px-3 text-xs font-extrabold text-[#3a00ff] dark:bg-neutral-800 dark:text-white">
                    {item.theme}
                  </span>
                  <h3 className="text-lg font-bold text-[#25115d] dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-neutral-300">
                    {body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        {manifesto.length === 0 && (
          <p className="text-gray-600 dark:text-neutral-400">{tManifesto("empty")}</p>
        )}
      </section>
    </div>
  );
}
