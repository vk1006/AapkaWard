"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WhatsAppShare } from "@/components/WhatsAppShare";

interface EventCardProps {
  event: {
    id: string;
    titleHi: string;
    titleEn: string;
    bodyHi: string;
    bodyEn: string;
    startsAt: string;
    placeText: string;
    goingCount?: number;
  };
  locale: string;
  userRsvp?: { status: string } | null;
  isLoggedIn: boolean;
  shareUrl: string;
}

export function EventCard({ event, locale, userRsvp, isLoggedIn, shareUrl }: EventCardProps) {
  const t = useTranslations("events");
  const title = locale === "hi" ? event.titleHi : event.titleEn;
  const body = locale === "hi" ? event.bodyHi : event.bodyEn;
  const [rsvp, setRsvp] = useState(userRsvp?.status ?? "");
  const [goingCount, setGoingCount] = useState(event.goingCount ?? 0);
  const [error, setError] = useState("");

  async function handleRsvp(status: string) {
    if (!isLoggedIn) {
      setError("Please login first");
      return;
    }
    const res = await fetch(`/api/events/${event.id}/rsvp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const prev = rsvp;
      setRsvp(status);
      if (status === "going" && prev !== "going") setGoingCount((c) => c + 1);
      if (prev === "going" && status !== "going") setGoingCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <article
      id={event.id}
      className="scroll-mt-24 rounded-xl bg-white p-6 shadow-sm ring-1 ring-orange-100 transition-shadow hover:shadow-md dark:bg-stone-900 dark:ring-stone-700 dark:hover:shadow-lg dark:hover:shadow-black/20"
    >
      <h2 className="text-xl font-bold text-orange-700 dark:text-orange-300">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-stone-400">
        {new Date(event.startsAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
          timeZone: "Asia/Kolkata",
        })}{" "}
        — {event.placeText}
      </p>
      <p className="mt-3 text-gray-700 dark:text-stone-300">{body}</p>
      <p className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400">
        {t("goingCount", { count: goingCount })}
      </p>
      {isLoggedIn && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(["going", "maybe", "not_going"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleRsvp(s)}
              aria-pressed={rsvp === s}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                rsvp === s
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {t(s === "not_going" ? "notGoing" : s)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <WhatsAppShare url={shareUrl} text={title} label={t("share")} />
      </div>
    </article>
  );
}
