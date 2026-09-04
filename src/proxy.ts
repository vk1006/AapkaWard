import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE } from "@/shared/types";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PAGE =
  /^\/(hi|en)\/(suggestions\/new|issues\/new|events\/new|admin(?:\/.*)?)$/;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED_PAGE.test(pathname) && !hasSession) {
    const locale = pathname.startsWith("/en") ? "en" : "hi";
    const nextPath = pathname.replace(/^\/(hi|en)/, "") || "/";
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(hi|en)/:path*", "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)"],
};
