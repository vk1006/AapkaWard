"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { btnSecondaryClass } from "@/components/ui";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("nav");
  const { setUser } = useAuth();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`${btnSecondaryClass} ${className ?? ""}`}
    >
      {t("logout")}
    </button>
  );
}
