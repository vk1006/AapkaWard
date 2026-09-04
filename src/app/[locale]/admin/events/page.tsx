"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminDeleteButton } from "@/components/AdminDeleteButton";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  inputClass,
  listCardClass,
  mutedTextClass,
  sectionHeadingClass,
} from "@/components/ui";

interface EventItem {
  id: string;
  titleHi: string;
  titleEn: string;
  bodyHi: string;
  bodyEn: string;
  startsAt: string;
  placeText: string;
  published: boolean;
}

const empty = {
  titleHi: "",
  titleEn: "",
  bodyHi: "",
  bodyEn: "",
  startsAt: "",
  placeText: "",
  published: true,
};

export default function AdminEventsPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<EventItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | undefined>();

  async function load() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: editId,
        startsAt: new Date(form.startsAt).toISOString(),
      }),
    });
    setForm(empty);
    setEditId(undefined);
    load();
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    if (editId === id) {
      setForm(empty);
      setEditId(undefined);
    }
    load();
  }

  function startEdit(item: EventItem) {
    setEditId(item.id);
    setForm({
      titleHi: item.titleHi,
      titleEn: item.titleEn,
      bodyHi: item.bodyHi,
      bodyEn: item.bodyEn,
      startsAt: item.startsAt.slice(0, 16),
      placeText: item.placeText,
      published: item.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <h2 className={sectionHeadingClass}>{t("events")}</h2>

      <form onSubmit={save} className={`space-y-3 ${cardClass}`}>
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
          rows={2}
          required
        />
        <textarea
          placeholder="bodyEn"
          value={form.bodyEn}
          onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
          className={inputClass}
          rows={2}
          required
        />
        <input
          type="datetime-local"
          value={form.startsAt}
          onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          className={inputClass}
          required
        />
        <input
          placeholder="placeText"
          value={form.placeText}
          onChange={(e) => setForm({ ...form, placeText: e.target.value })}
          className={inputClass}
          required
        />
        <label className={`flex items-center gap-2 text-sm ${mutedTextClass}`}>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimaryClass}>
            {editId ? t("update") : t("create")}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setForm(empty);
                setEditId(undefined);
              }}
              className={btnPrimaryClass}
            >
              {t("cancelEdit")}
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className={listCardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong className="text-[#3a00ff] dark:text-white">{item.titleHi}</strong>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  {new Date(item.startsAt).toLocaleString()} — {item.placeText}
                </p>
                {!item.published && (
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">
                    Draft
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className={btnSecondaryClass}
                >
                  {t("edit")}
                </button>
                <AdminDeleteButton onDelete={() => deleteEvent(item.id)} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
