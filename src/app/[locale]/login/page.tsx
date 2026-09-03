import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
