import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import { badgeClass, bodyTextClass, cardClass } from "@/components/ui";

export const revalidate = 60;

export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("manifesto");

  const { content } = getContainer();
  const items = await content.listManifesto(true);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("title")}</h1>
      <div className="grid gap-6">
        {items.map((item) => {
          const title = locale === "hi" ? item.titleHi : item.titleEn;
          const body = locale === "hi" ? item.bodyHi : item.bodyEn;
          const url = `/${locale}/manifesto#${item.slug}`;
          return (
            <article key={item.id} id={item.slug} className={`scroll-mt-24 ${cardClass}`}>
              <span className={badgeClass}>{item.theme}</span>
              <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className={`mt-3 ${bodyTextClass}`}>{body}</p>
              <div className="mt-4">
                <WhatsAppShare url={url} text={title} label={t("share")} />
              </div>
            </article>
          );
        })}
      </div>
      {items.length === 0 && (
        <p className="text-gray-600 dark:text-neutral-400">No manifesto items published yet.</p>
      )}
    </div>
  );
}
