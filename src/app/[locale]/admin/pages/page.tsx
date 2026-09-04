"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  btnPrimaryClass,
  cardClass,
  inputClass,
  listCardClass,
  sectionHeadingClass,
  linkAccentClass,
  bodyTextClass,
} from "@/components/ui";

interface PageItem {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  bodyHi: string;
  bodyEn: string;
}

const empty = {
  slug: "",
  titleHi: "",
  titleEn: "",
  bodyHi: "",
  bodyEn: "",
};

export default function AdminPagesPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<PageItem[]>([]);
  const [form, setForm] = useState(empty);

  async function load() {
    const res = await fetch("/api/admin/pages");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  }

  function startEdit(item: PageItem) {
    setForm({
      slug: item.slug,
      titleHi: item.titleHi,
      titleEn: item.titleEn,
      bodyHi: item.bodyHi,
      bodyEn: item.bodyEn,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <h2 className={sectionHeadingClass}>{t("pages")}</h2>
      <p className={bodyTextClass}>
        Edit About page and other static pages. Slugs: <code>about</code>,{" "}
        <code>panch-scope</code>
      </p>

      <form onSubmit={save} className={`space-y-3 ${cardClass}`}>
        <input
          placeholder="slug (e.g. about)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className={inputClass}
          required
        />
        <input
          placeholder="titleHi"
          value={form.titleHi}
          onChange={(e) => setForm({ ...form, titleHi: e.target.value })}
          className={inputClass}
          required
        />
        <input
          placeholder="titleEn"
          value={form.titleEn}
          onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          className={inputClass}
          required
        />
        <textarea
          placeholder="bodyHi"
          value={form.bodyHi}
          onChange={(e) => setForm({ ...form, bodyHi: e.target.value })}
          className={inputClass}
          rows={6}
          required
        />
        <textarea
          placeholder="bodyEn"
          value={form.bodyEn}
          onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
          className={inputClass}
          rows={6}
          required
        />
        <button type="submit" className={btnPrimaryClass}>
          {t("update")}
        </button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`flex items-center justify-between ${listCardClass}`}>
            <span className="text-gray-900 dark:text-white">
              <span className="font-mono text-sm text-gray-500 dark:text-neutral-400">
                {item.slug}
              </span>
              {" — "}
              {item.titleHi}
            </span>
            <button
              type="button"
              onClick={() => startEdit(item)}
              className={`text-sm ${linkAccentClass}`}
            >
              {t("edit")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
