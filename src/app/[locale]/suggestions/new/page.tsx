import { redirect } from "next/navigation";
import { SuggestionForm } from "@/components/SuggestionForm";
import { getCurrentUser } from "@/shared/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { linkAccentClass } from "@/components/ui";

export default async function NewSuggestionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?next=/suggestions/new`);
  }

  const t = await getTranslations("suggestions");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/suggestions" className={`text-sm ${linkAccentClass}`}>
        ← {t("wallTitle")}
      </Link>
      <h1 className="page-title">{t("title")}</h1>
      <SuggestionForm locale={locale} />
    </div>
  );
}
