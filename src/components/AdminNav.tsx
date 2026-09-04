"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const links = [
  { href: "/admin", labelKey: "dashboard" as const, exact: true },
  { href: "/admin/moderation", labelKey: "moderation" as const },
  { href: "/admin/manifesto", labelKey: "manifesto" as const },
  { href: "/admin/pages", labelKey: "pages" as const },
  { href: "/admin/events", labelKey: "events" as const },
  { href: "/admin/flags", labelKey: "flags" as const },
];

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[#c7deec] pb-px text-sm scrollbar-none dark:border-neutral-700">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 border-b-2 px-3 py-2 font-medium transition-colors ${
              active
                ? "border-[#3a00ff] text-[#3a00ff] dark:border-white dark:text-white"
                : "border-transparent text-gray-600 hover:border-[#c7deec] hover:text-[#3a00ff] dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
