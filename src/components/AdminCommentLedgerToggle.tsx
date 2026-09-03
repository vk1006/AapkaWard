"use client";

import { useState } from "react";
import { AdminCommentLedger, type AdminCommentEntry } from "@/components/AdminCommentLedger";

export function AdminCommentLedgerToggle({
  label,
  teamLabel,
  comments,
  showLabel,
  hideLabel,
}: {
  label: string;
  teamLabel: string;
  comments: AdminCommentEntry[];
  showLabel: string;
  hideLabel: string;
}) {
  const [open, setOpen] = useState(false);

  if (comments.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-stone-600 dark:bg-stone-800 dark:text-orange-300 dark:hover:bg-stone-700"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
        {open ? hideLabel : showLabel}
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-stone-700 dark:text-orange-300">
          {comments.length}
        </span>
      </button>

      {open && (
        <AdminCommentLedger label={label} teamLabel={teamLabel} comments={comments} />
      )}
    </div>
  );
}
