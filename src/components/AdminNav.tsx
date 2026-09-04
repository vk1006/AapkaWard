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
    <nav className="flex gap-1 overflow-x-auto border-b border-orange-200 pb-px text-sm scrollbar-none dark:border-stone-700">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 border-b-2 px-3 py-2 font-medium transition-colors ${
              active
                ? "border-orange-600 text-orange-700 dark:border-orange-400 dark:text-orange-300"
                : "border-transparent text-gray-600 hover:border-orange-200 hover:text-orange-600 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-orange-400"
            }`}
          >
            {link.labelKey === "dashboard" ? "Dashboard" : t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
