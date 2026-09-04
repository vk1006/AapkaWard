import { setRequestLocale } from "next-intl/server";
import { cardClass, bodyTextClass } from "@/components/ui";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className={cardClass}>
      <p className={bodyTextClass}>
        Use the navigation above to moderate suggestions, manage priority items,
        events, and feature flags.
      </p>
    </div>
  );
}
