import { auth0 } from "./lib/auth0";

// Mounts /auth/login, /auth/logout and /auth/callback, and keeps the session cookie fresh.
// (Next.js 16 calls this file proxy.ts; it used to be middleware.ts.)
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  // Static files and the installable-app files (manifest, service worker, icons, offline page)
  // don't need the session
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|sw.js|pwa-icon|icon|apple-icon|offline).*)",
  ],
};
