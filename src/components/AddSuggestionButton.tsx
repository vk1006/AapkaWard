"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/AuthProvider";

export function FloatingAddButton({ issuesEnabled = false }: { issuesEnabled?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const target = getFabTarget(pathname, user?.role === "admin", issuesEnabled);

  if (!mounted || !target) return null;

  const href = user ? target.href : `/login?next=${encodeURIComponent(target.href)}`;

  return createPortal(
    <Link href={href} aria-label={target.label} className="fab-add">
      +
    </Link>,
    document.body
  );
}

function getFabTarget(pathname: string, isAdmin: boolean, issuesEnabled: boolean) {
  if (pathname === "/suggestions") {
    return { href: "/suggestions/new" as const, label: "Add suggestion" };
  }
  if (issuesEnabled && pathname === "/issues") {
    return { href: "/issues/new" as const, label: "Add issue" };
  }
  if (pathname === "/events" && isAdmin) {
    return { href: "/events/new" as const, label: "Add event" };
  }
  return null;
}
