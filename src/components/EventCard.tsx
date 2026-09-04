"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const RSVP_STATUSES = ["going", "maybe", "not_going"] as const;
type RsvpStatus = (typeof RSVP_STATUSES)[number];

function isGoing(status: string) {
  return status === "going";
}

function countAfterStatusChange(count: number, from: string, to: string) {
  if (!isGoing(from) && isGoing(to)) return count + 1;
  if (isGoing(from) && !isGoing(to)) return Math.max(0, count - 1);
  return count;
}

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
}

export function EventCard({ event, locale, userRsvp, isLoggedIn }: EventCardProps) {
  const t = useTranslations("events");
  const title = locale === "hi" ? event.titleHi : event.titleEn;
  const body = locale === "hi" ? event.bodyHi : event.bodyEn;
  const [rsvp, setRsvp] = useState(userRsvp?.status ?? "");
  const [goingCount, setGoingCount] = useState(event.goingCount ?? 0);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const confirmedRsvp = useRef(userRsvp?.status ?? "");
  const confirmedGoingCount = useRef(event.goingCount ?? 0);
  const selectedRsvp = useRef(userRsvp?.status ?? "");
  const saving = useRef(false);

  async function saveLatestRsvp() {
    if (saving.current || selectedRsvp.current === confirmedRsvp.current) return;

    const statusBeingSaved = selectedRsvp.current as RsvpStatus;
    saving.current = true;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBeingSaved }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const apiError = data?.error;
        setError(
          (locale === "hi" ? apiError?.messageHi : apiError?.messageEn) ??
            apiError?.messageEn ??
            apiError?.messageHi ??
            t("rsvpFailed")
        );
        selectedRsvp.current = confirmedRsvp.current;
        setRsvp(confirmedRsvp.current);
        setGoingCount(confirmedGoingCount.current);
        return;
      }

      if (RSVP_STATUSES.includes(data?.rsvp?.status) && Number.isSafeInteger(data?.goingCount)) {
        confirmedRsvp.current = data.rsvp.status;
        confirmedGoingCount.current = Math.max(0, data.goingCount);
        setRsvp(selectedRsvp.current);
        setGoingCount(
          countAfterStatusChange(
            confirmedGoingCount.current,
            confirmedRsvp.current,
            selectedRsvp.current
          )
        );
      } else {
        setError(t("rsvpFailed"));
        selectedRsvp.current = confirmedRsvp.current;
        setRsvp(confirmedRsvp.current);
        setGoingCount(confirmedGoingCount.current);
      }
    } catch {
      setError(t("rsvpFailed"));
      selectedRsvp.current = confirmedRsvp.current;
      setRsvp(confirmedRsvp.current);
      setGoingCount(confirmedGoingCount.current);
    } finally {
      saving.current = false;
      setIsSaving(false);
      void saveLatestRsvp();
    }
  }

  function handleRsvp(status: RsvpStatus) {
    if (!isLoggedIn) {
      setError(t("loginRequired"));
      return;
    }

    // Selecting "Going" a second time is the explicit opt-out action.
    const previousStatus = selectedRsvp.current;
    const nextStatus: RsvpStatus = status === "going" && previousStatus === "going" ? "not_going" : status;
    selectedRsvp.current = nextStatus;
    setRsvp(nextStatus);
    setGoingCount((count) => countAfterStatusChange(count, previousStatus, nextStatus));
    setError("");
    void saveLatestRsvp();
  }

  return (
    <article
      id={event.id}
      className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#d9e9f2] transition-shadow hover:shadow-md dark:bg-neutral-900 dark:ring-neutral-700 dark:hover:shadow-lg dark:hover:shadow-black/20"
    >
      <h2 className="text-xl font-bold text-[#3a00ff] dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        {new Date(event.startsAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
          timeZone: "Asia/Kolkata",
        })}{" "}
        — {event.placeText}
      </p>
      <p className="mt-3 text-gray-700 dark:text-neutral-200">{body}</p>
      <p className="mt-2 text-sm font-medium text-[#3a00ff] dark:text-white">
        {t("goingCount", { count: goingCount })}
      </p>
      {isLoggedIn && (
        <div className="mt-4 flex flex-wrap gap-2" aria-busy={isSaving}>
          {RSVP_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleRsvp(s)}
              aria-pressed={rsvp === s}
              aria-label={s === "going" && rsvp === "going" ? t("cancelGoing") : t(s === "not_going" ? "notGoing" : s)}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                rsvp === s
                  ? "bg-[#3a00ff] text-white shadow-sm dark:bg-white dark:text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {t(s === "not_going" ? "notGoing" : s)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </article>
  );
}
