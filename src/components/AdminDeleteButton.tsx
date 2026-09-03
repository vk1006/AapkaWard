"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { btnSecondaryClass } from "@/components/ui";

export function AdminDeleteButton({
  onDelete,
  disabled,
}: {
  onDelete: () => Promise<void>;
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${btnSecondaryClass} !border-red-200 !text-red-700 hover:!bg-red-50`}
    >
      {loading ? "..." : t("delete")}
    </button>
  );
}
