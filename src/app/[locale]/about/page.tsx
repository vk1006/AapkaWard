import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { Link } from "@/i18n/navigation";
import {
  accentPanelClass,
  bodyTextClass,
  cardClass,
  linkAccentClass,
  proseContentClass,
} from "@/components/ui";

export const revalidate = 300;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const { content } = getContainer();
  const about = await content.getPage("about");
  const scope = await content.getPage("panch-scope");

  return (
    <div className="space-y-8">
      <h1 className="page-title">{t("title")}</h1>

      {about && (
        <section className={cardClass}>
          <div
            className={proseContentClass}
            dangerouslySetInnerHTML={{
              __html: (locale === "hi" ? about.bodyHi : about.bodyEn).replace(/\n/g, "<br/>"),
            }}
          />
        </section>
      )}

      {scope && (
        <section className={accentPanelClass}>
          <h2 className="text-xl font-bold text-[#3a00ff] dark:text-white">
            {locale === "hi" ? scope.titleHi : scope.titleEn}
          </h2>
          <p className={`mt-3 ${bodyTextClass}`}>
            {locale === "hi" ? scope.bodyHi : scope.bodyEn}
          </p>
        </section>
      )}
    </div>
  );
}
