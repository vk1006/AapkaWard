import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { AdminCommentLedgerToggle } from "@/components/AdminCommentLedgerToggle";
import { listCardClass, emptyStateClass } from "@/components/ui";

export default async function SuggestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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

      {items.length === 0 ? (
        <p className={emptyStateClass}>{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className={listCardClass}>
              <span className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
                {s.category}
              </span>
              <p className="mt-1 break-words text-gray-800 dark:text-stone-200">{s.body}</p>
              {s.landmark && <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">{s.landmark}</p>}
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
