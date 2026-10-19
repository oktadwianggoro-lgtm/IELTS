import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/info-ielts",
  "/privasi",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/icon-192",
  "/icon-512",
  "/sw.js",
  "/offline",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // manifest.webmanifest/icon-192/icon-512/sw.js are excluded here, not just
  // via PUBLIC_PATHS above — same reasoning as favicon.ico: the browser
  // fetches these automatically in the background on EVERY page load (Next
  // auto-injects the manifest <link> site-wide the moment app/manifest.ts
  // exists), so leaving them matched would invoke NextAuth's auth() wrapper
  // — which touches the session cookie just by being invoked — on every
  // single navigation. That measurably widened D-036's known sign-out race
  // window (~25% -> ~85% in repeated local runs) until this was excluded.
  // See D-042.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192|icon-512|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
