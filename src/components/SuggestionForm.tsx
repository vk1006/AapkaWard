"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { btnPrimaryClass, cardClass, inputClass, selectClass, textareaClass, mutedTextClass } from "@/components/ui";

const CATEGORIES = ["water", "roads", "sanitation", "education", "health", "other"];

export function SuggestionForm({ locale }: { locale: string }) {
  const t = useTranslations("suggestions");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [body, setBody] = useState("");
  const [landmark, setLandmark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, body, landmark, locale }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(
          (locale === "hi" ? data.error?.messageHi : data.error?.messageEn) ??
            data.error?.messageEn ??
            data.error?.messageHi ??
            t("error")
        );
        return;
      }

      setSubmitted(true);
      timerRef.current = setTimeout(() => {
        window.location.assign(`/${locale}/suggestions?submitted=pending`);
      }, 1200);
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={`space-y-4 text-center py-8 ${cardClass}`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p role="status" className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
          {t("pending")}
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          {locale === "hi"
            ? "कृपया प्रतीक्षा करें, आपको सुझावों की सूची पर ले जाया जा रहा है..."
            : "Redirecting to suggestions, please wait..."}
        </p>
        <a
          href={`/${locale}/suggestions?submitted=pending`}
          className="inline-block text-xs text-[#3a00ff] underline dark:text-blue-400"
        >
          {locale === "hi" ? "यदि स्वतः न खुले तो यहाँ क्लिक करें" : "Click here if not redirected automatically"}
        </a>
      </div>
    );
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
                {t(`categories.${c}`)}
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
        <button type="submit" disabled={loading} className={btnPrimaryClass} aria-busy={loading}>
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </div>
  );
}
