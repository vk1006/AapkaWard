import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { IssuesDisabled } from "@/components/IssuesDisabled";
import { IssueMediaStrip } from "@/components/IssueMediaStrip";
import { AdminCommentLedgerToggle } from "@/components/AdminCommentLedgerToggle";
import { listCardClass, emptyStateClass } from "@/components/ui";

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("issues");

  const { platform, issues } = getContainer();
  await platform.ensureDefaults();

  if (!(await platform.isEnabled("issues"))) {
    return <IssuesDisabled />;
  }

  const items = await issues.listApproved();

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle mt-2">{t("policy")}</p>
      </div>

      {items.length === 0 ? (
        <p className={emptyStateClass}>{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((issue) => (
            <li key={issue.id} className={listCardClass}>
              <span className="text-xs font-medium uppercase text-[#3a00ff] dark:text-white">
                {issue.category} · {issue.lifecycle}
              </span>
              <p className="mt-1 break-words dark:text-neutral-200">{issue.body}</p>
              {issue.landmark && (
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">{issue.landmark}</p>
              )}
              <IssueMediaStrip media={issue.media} />
              <AdminCommentLedgerToggle
                label={t("adminResponse")}
                teamLabel={t("teamLabel")}
                comments={issue.comments}
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
