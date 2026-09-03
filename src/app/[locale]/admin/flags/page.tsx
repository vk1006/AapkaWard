"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { listCardClass, mutedTextClass, sectionHeadingClass } from "@/components/ui";

interface Flag {
  key: string;
  enabled: boolean;
}

export default function AdminFlagsPage() {
  const t = useTranslations("admin");
  const [flags, setFlags] = useState<Flag[]>([]);

  async function load() {
    const res = await fetch("/api/admin/flags");
    const data = await res.json();
    setFlags(data.flags ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className={sectionHeadingClass}>{t("flags")}</h2>
      <ul className="space-y-3">
        {flags.map((flag) => (
          <li key={flag.key} className={`flex items-center justify-between ${listCardClass}`}>
            <div>
              <strong className="text-gray-900 dark:text-stone-100">{flag.key}</strong>
              {flag.key === "content_freeze" && (
                <p className={mutedTextClass}>{t("contentFreeze")}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggle(flag.key, !flag.enabled)}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                flag.enabled
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 hover:bg-gray-500 dark:bg-stone-600 dark:hover:bg-stone-500"
              }`}
            >
              {flag.enabled ? "ON" : "OFF"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
