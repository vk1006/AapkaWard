import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IssueForm } from "@/components/IssueForm";
import { IssuesDisabled } from "@/components/IssuesDisabled";
import { getCurrentUser } from "@/shared/auth";
import { getContainer } from "@/infrastructure/container";
import { linkAccentClass } from "@/components/ui";

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { platform } = getContainer();
  await platform.ensureDefaults();

  if (!(await platform.isEnabled("issues"))) {
    return <IssuesDisabled />;
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?next=/issues/new`);
  }

  const t = await getTranslations("issues");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/issues" className={`text-sm ${linkAccentClass}`}>
        ← {t("title")}
      </Link>
      <h1 className="page-title">{t("addTitle")}</h1>
      <IssueForm locale={locale} />
    </div>
  );
}
