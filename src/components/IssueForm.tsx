"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
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
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [body, setBody] = useState("");
  const [landmark, setLandmark] = useState("");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(data.error?.messageEn ?? data.error?.messageHi ?? "Failed");
      return;
    }

    router.push("/issues");
    router.refresh();
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
          minLength={10}
          maxLength={2000}
          rows={5}
          required
          className={textareaClass}
        />
        <p className="mt-1 text-right text-xs text-gray-400 dark:text-stone-500">{body.length}/2000</p>
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
          className="w-full rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-orange-700 dark:border-stone-600 dark:bg-stone-800/50"
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
