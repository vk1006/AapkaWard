"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function FooterFeedbackForm() {
  const t = useTranslations("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/website-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setName("");
      setEmail("");
      setMessage("");
      setWebsite("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-2 text-left">
      <div>
        <p className="font-bold text-[#25115d] dark:text-white">{t("title")}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-300">{t("description")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder={t("name")}
          aria-label={t("name")}
          className="min-h-10 rounded-xl border border-[#c7deec] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#3a00ff] focus:outline-none focus:ring-2 focus:ring-[#3a00ff]/20 dark:border-neutral-700 dark:bg-black dark:text-white"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
          placeholder={t("email")}
          aria-label={t("email")}
          className="min-h-10 rounded-xl border border-[#c7deec] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#3a00ff] focus:outline-none focus:ring-2 focus:ring-[#3a00ff]/20 dark:border-neutral-700 dark:bg-black dark:text-white"
        />
      </div>
      <label className="sr-only" htmlFor="website-feedback-message">{t("message")}</label>
      <textarea
        id="website-feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        minLength={10}
        maxLength={1000}
        rows={3}
        required
        placeholder={t("message")}
        className="w-full rounded-xl border border-[#c7deec] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#3a00ff] focus:outline-none focus:ring-2 focus:ring-[#3a00ff]/20 dark:border-neutral-700 dark:bg-black dark:text-white"
      />
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        name="website"
        aria-hidden="true"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-10 rounded-full bg-[#3a00ff] px-4 text-sm font-bold text-white transition-colors hover:bg-[#2600b3] disabled:cursor-wait disabled:opacity-60"
        >
          {status === "sending" ? t("sending") : t("submit")}
        </button>
        {status === "success" && <p className="text-sm text-emerald-700 dark:text-emerald-300">{t("success")}</p>}
        {status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{t("error")}</p>}
      </div>
    </form>
  );
}
