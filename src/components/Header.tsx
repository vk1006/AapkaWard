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
import { SiteLogo } from "@/components/SiteLogo";

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
        ? "block rounded-xl bg-[#e7e1ff] px-3 py-3 text-base font-semibold text-[#3b14f5] dark:bg-white dark:text-black"
        : "block rounded-xl px-3 py-3 text-base font-medium text-slate-800 transition-colors hover:bg-[#eef7fc] dark:text-neutral-200 dark:hover:bg-neutral-800";
    }
    return active ? navLinkActiveClass : navLinkClass;
  }

  function AuthControls({ mobile = false }: { mobile?: boolean }) {
    if (loading) {
      return (
        <span
          className={`inline-block animate-pulse rounded-full bg-[#e7e1ff] ${
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
            ? "flex min-h-11 w-full items-center justify-center rounded-full bg-[#3b14f5] px-4 py-2 font-bold text-white transition-colors hover:bg-[#2510bd]"
            : "rounded-full bg-[#3b14f5] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2510bd] focus:outline-none focus:ring-2 focus:ring-[#3b14f5] focus:ring-offset-2"
        }
      >
        {t("login")}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#c7deec] bg-[#eef7fc]/90 backdrop-blur-md dark:border-neutral-700 dark:bg-black/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-full py-1 pr-3 text-[#25115d] transition-colors hover:text-[#3b14f5] focus:outline-none focus:ring-2 focus:ring-[#3b14f5]/20 dark:text-white dark:hover:text-neutral-300"
        >
          <SiteLogo className="h-9 w-9 shrink-0 text-[#3a00ff] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
          <span className="text-left leading-none">
            <span className="block text-base font-extrabold tracking-tight sm:text-lg">{site("brand")}</span>
            <span className="mt-1 hidden text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#3a00ff]/70 sm:block dark:text-neutral-400">
              {site("tagline")}
            </span>
          </span>
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7deec] bg-white text-[#3b14f5] transition-colors hover:bg-[#e7e1ff] focus:outline-none focus:ring-2 focus:ring-[#3b14f5]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
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
              className="animate-drawer-in fixed right-0 top-0 z-[110] flex h-[100dvh] w-[min(100%,18rem)] flex-col border-l border-[#c7deec] bg-[#f8fcff] shadow-xl dark:border-neutral-700 dark:bg-neutral-900 lg:hidden"
              aria-label="Mobile"
            >
              <div className="flex items-center justify-between border-b border-[#d9e9f2] px-4 py-3 dark:border-neutral-700">
                <span className="font-semibold text-[#25115d] dark:text-white">{t("home")}</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-[#e7e1ff] dark:text-neutral-300 dark:hover:bg-neutral-800"
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
              <div className="border-t border-[#d9e9f2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-neutral-700">
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
    <div className="flex min-h-screen w-full flex-col bg-[#eef7fc] text-slate-900 dark:bg-black dark:text-white">
      {children}
      <footer className="mt-auto border-t border-[#c7deec] bg-white px-4 py-7 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2 text-[#25115d] dark:text-white">
            <SiteLogo className="h-8 w-8 text-[#3a00ff]" />
            <span className="font-bold">{site("brand")}</span>
          </div>
          <p className="max-w-md text-sm text-slate-500 dark:text-neutral-300">{site("footer")}</p>
        </div>
      </footer>
    </div>
  );
}
