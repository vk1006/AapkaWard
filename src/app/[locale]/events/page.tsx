import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { getCurrentUser } from "@/shared/auth";
import { EventCard } from "@/components/EventCard";
import { getRequestOrigin } from "@/shared/request-origin";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const user = await getCurrentUser();
  const origin = await getRequestOrigin();

  const { events } = getContainer();
  const items = await events.listPublic();

  const enriched = await Promise.all(
    items.map(async (e) => {
      const full = await events.getById(e.id);
      const userRsvp = user ? await events.getUserRsvp(e.id, user.id) : null;
      return { ...full!, userRsvp };
    })
  );

  return (
    <div className="space-y-6 pb-24">
      <h1 className="page-title">{t("title")}</h1>
      {enriched.length === 0 ? (
        <p className="text-gray-600 dark:text-stone-400">No upcoming events.</p>
      ) : (
        <div className="space-y-6">
          {enriched.map((event) => (
            <EventCard
              key={event.id}
              event={{
                ...event,
                startsAt: event.startsAt.toISOString(),
              }}
              locale={locale}
              userRsvp={event.userRsvp}
              isLoggedIn={!!user}
              shareUrl={`${origin}/${locale}/events#${event.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
