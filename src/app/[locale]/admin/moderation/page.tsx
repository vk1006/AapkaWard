"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminDeleteButton } from "@/components/AdminDeleteButton";
import { AdminCommentPanel } from "@/components/AdminCommentPanel";
import type { AdminCommentEntry } from "@/components/AdminCommentLedger";
import {
  bodyTextClass,
  listCardClass,
  mutedTextClass,
  sectionHeadingClass,
} from "@/components/ui";

interface ModerationItem {
  id: string;
  category: string;
  body: string;
  moderationStatus: string;
  comments: AdminCommentEntry[];
  createdAt: string;
}

interface PetitionItem {
  id: string;
  authorityName: string;
  askHi: string;
  askEn: string;
  status: string;
  threshold: number;
  createdAt: string;
}

export default function AdminModerationPage() {
  const t = useTranslations("admin");
  const [suggestions, setSuggestions] = useState<ModerationItem[]>([]);
  const [issues, setIssues] = useState<ModerationItem[]>([]);
  const [petitions, setPetitions] = useState<PetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [suggestionsRes, issuesRes, petitionsRes] = await Promise.all([
      fetch("/api/admin/suggestions"),
      fetch("/api/admin/issues"),
      fetch("/api/admin/petitions"),
    ]);
    const suggestionsData = await suggestionsRes.json();
    const issuesData = await issuesRes.json();
    const petitionsData = await petitionsRes.json();
    setSuggestions(suggestionsData.items ?? []);
    setIssues(issuesData.items ?? []);
    setPetitions(petitionsData.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decideSuggestion(suggestionId: string, decision: "approved" | "rejected") {
    await fetch("/api/admin/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId, decision }),
    });
    load();
  }

  async function decideIssue(issueId: string, decision: "approved" | "rejected") {
    await fetch("/api/admin/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, decision }),
    });
    load();
  }

  async function deleteSuggestion(id: string) {
    await fetch(`/api/admin/suggestions?id=${id}`, { method: "DELETE" });
    load();
  }

  async function deleteIssue(id: string) {
    await fetch(`/api/admin/issues?id=${id}`, { method: "DELETE" });
    load();
  }

  async function deletePetition(id: string) {
    await fetch(`/api/admin/petitions?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className={mutedTextClass}>{t("loading")}</p>;

  return (
    <div className="space-y-8">
      <h2 className={sectionHeadingClass}>{t("moderation")}</h2>

      <section className="space-y-4">
        <h3 className={sectionHeadingClass}>{t("issues")}</h3>
        {issues.length === 0 ? (
          <p className={mutedTextClass}>{t("noItems")}</p>
        ) : (
          issues.map((item) => (
            <div key={item.id} className={listCardClass}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase text-orange-600 dark:text-orange-400">
                  {item.category}
                </span>
                <StatusBadge status={item.moderationStatus} />
              </div>
              <p className={`mt-2 break-words ${bodyTextClass}`}>{item.body}</p>
              <AdminCommentPanel
                apiPath={`/api/admin/issues/${item.id}/comments`}
                comments={item.comments}
                onAdded={load}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {item.moderationStatus === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => decideIssue(item.id, "approved")}
                      className="min-h-10 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      {t("approve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => decideIssue(item.id, "rejected")}
                      className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      {t("reject")}
                    </button>
                  </>
                )}
                <AdminDeleteButton onDelete={() => deleteIssue(item.id)} />
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h3 className={sectionHeadingClass}>{t("suggestions")}</h3>
        {suggestions.length === 0 ? (
          <p className={mutedTextClass}>{t("noItems")}</p>
        ) : (
          suggestions.map((item) => (
            <div key={item.id} className={listCardClass}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase text-orange-600 dark:text-orange-400">
                  {item.category}
                </span>
                <StatusBadge status={item.moderationStatus} />
              </div>
              <p className={`mt-2 break-words ${bodyTextClass}`}>{item.body}</p>
              <AdminCommentPanel
                apiPath={`/api/admin/suggestions/${item.id}/comments`}
                comments={item.comments}
                onAdded={load}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {item.moderationStatus === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => decideSuggestion(item.id, "approved")}
                      className="min-h-10 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      {t("approve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => decideSuggestion(item.id, "rejected")}
                      className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      {t("reject")}
                    </button>
                  </>
                )}
                <AdminDeleteButton onDelete={() => deleteSuggestion(item.id)} />
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h3 className={sectionHeadingClass}>{t("petitions")}</h3>
        {petitions.length === 0 ? (
          <p className={mutedTextClass}>{t("noPetitions")}</p>
        ) : (
          petitions.map((item) => (
            <div key={item.id} className={listCardClass}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  {item.authorityName}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className={`mt-2 break-words text-sm ${bodyTextClass}`}>{item.askHi}</p>
              <p className={`mt-1 text-xs ${mutedTextClass}`}>
                {t("petitionThreshold", { count: item.threshold })}
              </p>
              <div className="mt-3">
                <AdminDeleteButton onDelete={() => deletePetition(item.id)} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    collecting: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    threshold_met: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
    sent: "bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-200",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700 dark:bg-stone-700 dark:text-stone-200"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
