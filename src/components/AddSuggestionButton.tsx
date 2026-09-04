"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

export function FloatingAddButton({
  issuesEnabled = false,
  eventsEnabled = false,
  suggestionsEnabled = false,
}: {
  issuesEnabled?: boolean;
  eventsEnabled?: boolean;
  suggestionsEnabled?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const suggestionsT = useTranslations("suggestions");
  const issuesT = useTranslations("issues");
  const eventsT = useTranslations("events");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const target = getFabTarget(
    pathname,
    user?.role === "admin",
    issuesEnabled,
    eventsEnabled,
    suggestionsEnabled,
    suggestionsT("add"),
    issuesT("addTitle"),
    eventsT("create")
  );

  if (!mounted || !target) return null;

  const href = user ? target.href : `/login?next=${encodeURIComponent(target.href)}`;

  return createPortal(
    <Link href={href} aria-label={target.label} className="fab-add">
      +
    </Link>,
    document.body
  );
}

function getFabTarget(
  pathname: string,
  isAdmin: boolean,
  issuesEnabled: boolean,
  eventsEnabled: boolean,
  suggestionsEnabled: boolean,
  suggestionLabel: string,
  issueLabel: string,
  eventLabel: string
) {
  if (suggestionsEnabled && pathname === "/suggestions") {
    return { href: "/suggestions/new" as const, label: suggestionLabel };
  }
  if (issuesEnabled && pathname === "/issues") {
    return { href: "/issues/new" as const, label: issueLabel };
  }
  if (eventsEnabled && pathname === "/events" && isAdmin) {
    return { href: "/events/new" as const, label: eventLabel };
  }
  return null;
}
