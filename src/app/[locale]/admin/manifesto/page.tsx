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

interface ManifestoItem {
  id: string;
  slug: string;
  theme: string;
  sortOrder: number;
  titleHi: string;
  titleEn: string;
  bodyHi: string;
  bodyEn: string;
  published: boolean;
}

const empty: Omit<ManifestoItem, "id"> = {
  slug: "",
  theme: "general",
  sortOrder: 0,
  titleHi: "",
  titleEn: "",
  bodyHi: "",
  bodyEn: "",
  published: false,
};

export default function AdminManifestoPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<ManifestoItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | undefined>();

  async function load() {
    const res = await fetch("/api/admin/manifesto");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/manifesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editId }),
    });
    setForm(empty);
    setEditId(undefined);
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className={sectionHeadingClass}>{t("manifesto")}</h2>

      <form onSubmit={save} className={`space-y-3 ${cardClass}`}>
        <input
          placeholder="slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className={inputClass}
          required
        />
        <input
          placeholder="theme"
          value={form.theme}
          onChange={(e) => setForm({ ...form, theme: e.target.value })}
          className={inputClass}
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
          rows={3}
          required
        />
        <textarea
          placeholder="bodyEn"
          value={form.bodyEn}
          onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
          className={inputClass}
          rows={3}
          required
        />
        <label className={`flex items-center gap-2 ${bodyTextClass}`}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published
        </label>
        <button type="submit" className={btnPrimaryClass}>
          {editId ? t("update") : t("create")}
        </button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`flex items-center justify-between ${listCardClass}`}>
            <span className="text-gray-900 dark:text-white">
              {item.titleHi} {item.published ? "✓" : "(draft)"}
            </span>
            <button
              type="button"
              onClick={() => {
                setEditId(item.id);
                setForm({
                  slug: item.slug,
                  theme: item.theme,
                  sortOrder: item.sortOrder,
                  titleHi: item.titleHi,
                  titleEn: item.titleEn,
                  bodyHi: item.bodyHi,
                  bodyEn: item.bodyEn,
                  published: item.published,
                });
              }}
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
