import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header, PageShell } from "@/components/Header";
import { FloatingAddButton } from "@/components/AddSuggestionButton";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getContainer } from "@/infrastructure/container";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "hi" | "en")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  const { platform } = getContainer();
  const [issuesEnabled, eventsEnabled, suggestionsEnabled] = await Promise.all([
    platform.isEnabled("issues"),
    platform.isEnabled("events"),
    platform.isEnabled("suggestions"),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <AuthProvider>
          <PageShell>
            <Header
              issuesEnabled={issuesEnabled}
              eventsEnabled={eventsEnabled}
              suggestionsEnabled={suggestionsEnabled}
            />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-8 sm:py-8">{children}</main>
            <FloatingAddButton
              issuesEnabled={issuesEnabled}
              eventsEnabled={eventsEnabled}
              suggestionsEnabled={suggestionsEnabled}
            />
          </PageShell>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
