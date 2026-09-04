import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContainer } from "@/infrastructure/container";
import { getCurrentUser } from "@/shared/auth";
import { EventCard } from "@/components/EventCard";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const user = await getCurrentUser();

  const { events } = getContainer();
  const items = await events.listPublicWithCounts();

  const userRsvps = user && items.length > 0
    ? await Promise.all(items.map((e) => events.getUserRsvp(e.id, user.id)))
    : [];
  const rsvpMap = new Map(userRsvps.filter(Boolean).map((r) => [r!.eventId, r]));

  const enriched = items.map((event) => ({
    ...event,
    userRsvp: rsvpMap.get(event.id) ?? null,
  }));

  return (
    <div className="space-y-6 pb-24">
      <h1 className="page-title">{t("title")}</h1>
      {enriched.length === 0 ? (
        <p className="text-gray-600 dark:text-neutral-400">{t("empty")}</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
