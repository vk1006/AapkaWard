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
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#c7deec] bg-white px-3 py-2 text-sm font-medium text-[#3a00ff] transition-colors hover:bg-[#eef7fc] focus:outline-none focus:ring-2 focus:ring-[#3a00ff]/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
        {open ? hideLabel : showLabel}
        <span className="rounded-full bg-[#eef7fc] px-2 py-0.5 text-xs font-semibold text-[#3a00ff] dark:bg-neutral-800 dark:text-white">
          {comments.length}
        </span>
      </button>

      {open && (
        <AdminCommentLedger label={label} teamLabel={teamLabel} comments={comments} />
      )}
    </div>
  );
}
