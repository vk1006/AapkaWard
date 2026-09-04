import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { AdminCommentLedgerToggle } from "@/components/AdminCommentLedgerToggle";
import { listCardClass, emptyStateClass } from "@/components/ui";

export default async function SuggestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { locale } = await params;
  const { submitted } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("suggestions");

  const { suggestions } = getContainer();
  const { items } = await suggestions.listApproved();

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="page-title">{t("wallTitle")}</h1>
        <p className="page-subtitle mt-2">{t("policy")}</p>
      </div>

      {submitted === "pending" && (
        <p role="status" className="rounded-xl border border-[#3a00ff]/25 bg-[#e7e1ff]/60 px-4 py-3 text-sm font-medium text-[#2600b3] dark:border-neutral-600 dark:bg-neutral-900 dark:text-white">
          {t("pending")}
        </p>
      )}

      {items.length === 0 ? (
        <p className={emptyStateClass}>{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className={listCardClass}>
              <span className="text-xs font-medium uppercase tracking-wide text-[#3a00ff] dark:text-white">
                {t(`categories.${s.category}`)}
              </span>
              <p className="mt-1 break-words text-gray-800 dark:text-neutral-200">{s.body}</p>
              {s.landmark && <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">{s.landmark}</p>}
              <AdminCommentLedgerToggle
                label={t("adminResponse")}
                teamLabel={t("teamLabel")}
                comments={s.comments}
                showLabel={t("viewComments")}
                hideLabel={t("hideComments")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
