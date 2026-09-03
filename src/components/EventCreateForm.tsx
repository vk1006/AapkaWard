"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { btnPrimaryClass, cardClass, inputClass, textareaClass } from "@/components/ui";

export function EventCreateForm() {
  const t = useTranslations("events");
  const router = useRouter();
  const [titleHi, setTitleHi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [bodyHi, setBodyHi] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [placeText, setPlaceText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        titleHi,
        titleEn,
        bodyHi,
        bodyEn,
        startsAt: new Date(startsAt).toISOString(),
        placeText,
        published: true,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.messageEn ?? data.error?.messageHi ?? "Failed");
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${cardClass}`}>
      <input
        placeholder="titleHi"
        value={titleHi}
        onChange={(e) => setTitleHi(e.target.value)}
        className={inputClass}
        required
      />
      <input
        placeholder="titleEn"
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
        className={inputClass}
        required
      />
      <textarea
        placeholder="bodyHi"
        value={bodyHi}
        onChange={(e) => setBodyHi(e.target.value)}
        className={textareaClass}
        rows={2}
        required
      />
      <textarea
        placeholder="bodyEn"
        value={bodyEn}
        onChange={(e) => setBodyEn(e.target.value)}
        className={textareaClass}
        rows={2}
        required
      />
      <input
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        className={inputClass}
        required
      />
      <input
        placeholder="placeText"
        value={placeText}
        onChange={(e) => setPlaceText(e.target.value)}
        className={inputClass}
        required
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className={btnPrimaryClass} aria-busy={loading}>
        {loading ? "..." : t("create")}
      </button>
    </form>
  );
}
