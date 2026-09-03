import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EventCreateForm } from "@/components/EventCreateForm";
import { getCurrentUser } from "@/shared/auth";
import { linkAccentClass } from "@/components/ui";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?next=/events/new`);
  }
  if (user.role !== "admin") {
    redirect(`/${locale}/events`);
  }

  const t = await getTranslations("events");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/events" className={`text-sm ${linkAccentClass}`}>
        ← {t("title")}
      </Link>
      <h1 className="page-title">{t("create")}</h1>
      <EventCreateForm />
    </div>
  );
}
