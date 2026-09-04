"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@/components/AuthProvider";
import { navLinkActiveClass, navLinkClass } from "@/components/ui";

type NavItem = { href: "/manifesto" | "/suggestions" | "/issues" | "/events" | "/about"; label: string };

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ issuesEnabled = false }: { issuesEnabled?: boolean }) {
  const t = useTranslations("nav");
  const site = useTranslations("site");
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { href: "/manifesto", label: t("manifesto") },
    { href: "/suggestions", label: t("suggestions") },
    ...(issuesEnabled
      ? [{ href: "/issues" as const, label: t.has("issues") ? t("issues") : "Issues" }]
      : []),
    { href: "/events", label: t("events") },
    { href: "/about", label: t("about") },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function linkClass(href: string, mobile = false) {
    const active = isNavActive(pathname, href);
    if (mobile) {
      return active
        ? "block rounded-lg bg-orange-50 px-3 py-3 text-base font-semibold text-orange-700 dark:bg-stone-800 dark:text-orange-300"
        : "block rounded-lg px-3 py-3 text-base font-medium text-gray-800 transition-colors hover:bg-orange-50 dark:text-stone-200 dark:hover:bg-stone-800";
    }
    return active ? navLinkActiveClass : navLinkClass;
  }

  function AuthControls({ mobile = false }: { mobile?: boolean }) {
    if (loading) {
      return (
        <span
          className={`inline-block animate-pulse rounded-lg bg-orange-100 ${
            mobile ? "h-11 w-full" : "h-9 w-20"
          }`}
          aria-hidden
        />
      );
    }

    if (user) {
      return <LogoutButton className={mobile ? "w-full justify-center" : undefined} />;
    }

    return (
      <Link
        href="/login"
        onClick={() => setOpen(false)}
        className={
          mobile
            ? "flex min-h-11 w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
            : "rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        }
      >
        {t("login")}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-orange-200 bg-white/95 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded-md px-1 text-lg font-bold text-orange-700 transition-colors hover:text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-orange-300 dark:hover:text-orange-200"
        >
          {site("brand")}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={isNavActive(pathname, "/admin") ? navLinkActiveClass : navLinkClass}
            >
              {t("admin")}
            </Link>
          )}
          <ThemeToggle />
          <LanguageToggle />
          <AuthControls />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LanguageToggle />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-800 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-stone-600 dark:bg-stone-800 dark:text-orange-300 dark:hover:bg-stone-700"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mounted &&
        open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="animate-backdrop-in fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px] lg:hidden"
              onClick={() => setOpen(false)}
            />
            <nav
              className="animate-drawer-in fixed right-0 top-0 z-[110] flex h-[100dvh] w-[min(100%,18rem)] flex-col border-l border-orange-100 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900 lg:hidden"
              aria-label="Mobile"
            >
              <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3 dark:border-stone-700">
                <span className="font-semibold text-orange-800 dark:text-orange-300">{t("home")}</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-orange-50 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={linkClass(item.href, true)}
                  >
                    {item.label}
                  </Link>
                ))}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={linkClass("/admin", true)}
                  >
                    {t("admin")}
                  </Link>
                )}
              </div>
              <div className="border-t border-orange-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-stone-700">
                <AuthControls mobile />
              </div>
            </nav>
          </>,
          document.body
        )}
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const site = useTranslations("site");

  return (
    <div className="flex min-h-screen w-full flex-col bg-orange-50 text-gray-900 dark:bg-stone-950 dark:text-stone-100">
      {children}
      <footer className="mt-auto border-t border-orange-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
        {site("footer")}
      </footer>
    </div>
  );
}
