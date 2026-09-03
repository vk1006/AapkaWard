"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminCommentLedger, type AdminCommentEntry } from "@/components/AdminCommentLedger";
import { btnPrimaryClass, mutedTextClass, textareaClass } from "@/components/ui";

export function AdminCommentPanel({
  apiPath,
  comments,
  onAdded,
}: {
  apiPath: string;
  comments: AdminCommentEntry[];
  onAdded: () => void;
}) {
  const t = useTranslations("admin");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });

    setSaving(false);

    if (!res.ok) {
      setError(t("commentError"));
      return;
    }

    setBody("");
    onAdded();
  }

  return (
    <div className="mt-4 border-t border-orange-100 pt-4 dark:border-stone-700">
      {comments.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setLedgerOpen((value) => !value)}
            aria-expanded={ledgerOpen}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-stone-600 dark:bg-stone-800 dark:text-orange-300 dark:hover:bg-stone-700"
          >
            <span
              aria-hidden
              className={`inline-block transition-transform ${ledgerOpen ? "rotate-90" : ""}`}
            >
              ›
            </span>
            {ledgerOpen ? t("hideComments") : t("viewComments")}
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-stone-700 dark:text-orange-300">
              {comments.length}
            </span>
          </button>
          {ledgerOpen && (
            <AdminCommentLedger
              label={t("adminCommentLedger")}
              teamLabel={t("teamLabel")}
              comments={comments}
            />
          )}
        </div>
      )}
      <label className="mb-1 mt-4 block text-sm font-medium text-orange-800 dark:text-orange-300">
        {t("addComment")}
      </label>
      <p className={`mb-2 text-xs ${mutedTextClass}`}>{t("adminCommentHint")}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={t("adminCommentPlaceholder")}
        className={textareaClass}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || !body.trim()}
          className={btnPrimaryClass}
          aria-busy={saving}
        >
          {saving ? t("loading") : t("postComment")}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
