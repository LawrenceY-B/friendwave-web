import "server-only";

import { connection } from "next/server";
import { auth0 } from "./auth0";

// The logged-in session, for Server Components. Use this instead of auth0.getSession().
// `connection()` first marks the work as per-request: the Auth0 SDK reads the clock
// (`new Date()`) to check the session's expiry, and with Cache Components Next.js
// refuses clock reads while it prerenders ("encountered the unstable value new Date()").
export async function getSession() {
  await connection();
  return auth0.getSession();
}
