import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/shared/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("title")}</h1>
      <AdminNav />
      {children}
    </div>
  );
}
