"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ACCEPTED_MEDIA_ACCEPT,
  classifyMediaKind,
  IMAGE_MAX_BYTES,
  MAX_PHOTOS,
  MAX_VIDEOS,
  VIDEO_MAX_BYTES,
} from "@/modules/issues/media";
import { btnPrimaryClass, cardClass, inputClass, selectClass, textareaClass, mutedTextClass } from "@/components/ui";

const CATEGORIES = ["water", "roads", "sanitation", "electricity", "other"];

type MediaFile = { file: File; kind: "photo" | "video" };

export function IssueForm({ locale }: { locale: string }) {
  const t = useTranslations("issues");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [body, setBody] = useState("");
  const [landmark, setLandmark] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";

    const next: MediaFile[] = [];
    let photos = 0;
    let videos = 0;

    for (const file of picked) {
      const kind = classifyMediaKind(file.type);
      if (!kind) {
        setError(t("mediaInvalid"));
        return;
      }

      if (kind === "photo") {
        if (file.size > IMAGE_MAX_BYTES) {
          setError(t("mediaPhotoTooLarge"));
          return;
        }
        if (photos >= MAX_PHOTOS) {
          setError(t("mediaTooManyPhotos"));
          return;
        }
        photos += 1;
      } else {
        if (file.size > VIDEO_MAX_BYTES) {
          setError(t("mediaVideoTooLarge"));
          return;
        }
        if (videos >= MAX_VIDEOS) {
          setError(t("mediaTooManyVideos"));
          return;
        }
        videos += 1;
      }

      next.push({ file, kind });
    }

    setError("");
    setMedia(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("body", body);
      if (landmark) formData.append("landmark", landmark);
      formData.append("locale", locale);
      for (const item of media) {
        formData.append("media", item.file);
      }

      const res = await fetch("/api/issues", {
        method: "POST",
        credentials: "include",
        body: formData,
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
        window.location.assign(`/${locale}/issues?submitted=pending`);
      }, 1200);
    } catch (err) {
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
            ? "कृपया प्रतीक्षा करें, आपको समस्याओं की सूची पर ले जाया जा रहा है..."
            : "Redirecting to issues, please wait..."}
        </p>
        <a
          href={`/${locale}/issues?submitted=pending`}
          className="inline-block text-xs text-[#3a00ff] underline dark:text-blue-400"
        >
          {locale === "hi" ? "यदि स्वतः न खुले तो यहाँ क्लिक करें" : "Click here if not redirected automatically"}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${cardClass}`}>
      <p className={mutedTextClass}>{t("policy")}</p>
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
          minLength={10}
          maxLength={2000}
          rows={5}
          required
          className={textareaClass}
        />
        <p className="mt-1 text-right text-xs text-gray-400 dark:text-neutral-500">{body.length}/2000</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("landmark")}</label>
        <input
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("media")}</label>
        <p className={`mb-2 text-xs ${mutedTextClass}`}>{t("mediaHint")}</p>
        <input
          type="file"
          accept={ACCEPTED_MEDIA_ACCEPT}
          multiple
          onChange={handleMediaChange}
          className="w-full rounded-lg border border-dashed border-[#c7deec] bg-[#eef7fc]/50 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#3a00ff] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#2600b3] dark:border-neutral-700 dark:bg-neutral-900"
        />
        {media.length > 0 && (
          <ul className={`mt-2 space-y-1 text-sm ${mutedTextClass}`}>
            {media.map((item) => (
              <li key={`${item.file.name}-${item.file.size}`}>
                {item.kind === "photo" ? t("mediaPhoto") : t("mediaVideo")}: {item.file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className={btnPrimaryClass} aria-busy={loading}>
        {loading ? "..." : t("submit")}
      </button>
    </form>
  );
}
