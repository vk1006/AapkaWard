"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { btnPrimaryClass, cardClass, inputClass, selectClass, textareaClass, mutedTextClass } from "@/components/ui";

const CATEGORIES = ["water", "roads", "sanitation", "education", "health", "other"];

export function SuggestionForm({ locale }: { locale: string }) {
  const t = useTranslations("suggestions");
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [body, setBody] = useState("");
  const [landmark, setLandmark] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus(null);

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, body, landmark, locale }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.messageEn ?? data.error?.messageHi ?? "Failed");
      return;
    }

    if (data.moderationStatus === "rejected") {
      setStatus("rejected");
      return;
    }

    router.push("/suggestions");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className={mutedTextClass}>{t("policy")}</p>
      <form onSubmit={handleSubmit} className={`space-y-4 ${cardClass}`}>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("body")}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={4}
            className={textareaClass}
            required
            minLength={10}
          />
          <p className="mt-1 text-right text-xs text-gray-400 dark:text-neutral-500">{body.length}/500</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("landmark")}</label>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {status === "rejected" && <p className="text-sm text-red-600">{t("rejected")}</p>}
        <button type="submit" disabled={loading} className={btnPrimaryClass} aria-busy={loading}>
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </div>
  );
}
