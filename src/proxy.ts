import { auth0 } from "./lib/auth0";

// Mounts /auth/login, /auth/logout and /auth/callback, and keeps the session cookie fresh.
// (Next.js 16 calls this file proxy.ts; it used to be middleware.ts.)
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
