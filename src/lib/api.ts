import "server-only";

import { AccessTokenError } from "@auth0/nextjs-auth0/errors";
import { redirect } from "next/navigation";
import { auth0 } from "./auth0";

// Calls the Friendwave API from the server (Server Components, Server Actions).
// The access token never reaches the browser.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  nextCursor?: string | null;
  message?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  let token: string;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (error) {
    // Not logged in, or the session expired
    if (error instanceof AccessTokenError) redirect("/auth/login");
    throw error;
  }

  const isForm = init.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    // Connection refused, DNS failure, etc. Say what's wrong instead of a raw ECONNREFUSED
    throw new ApiError(
      503,
      `Can't reach the Friendwave API at ${process.env.API_URL}. Is it running? (npm run dev in BackendProjects/Friendwave)`
    );
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success) {
    throw new ApiError(res.status, body?.message ?? `API request failed (${res.status})`);
  }
  return body;
}

// Single objects: const me = await api<Profile>("/api/users/me")
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request<T>(path, init)).data;
}

// Lists: const { items, nextCursor } = await apiPage<Post>("/api/feed")
export async function apiPage<T>(path: string): Promise<{ items: T[]; nextCursor: string | null }> {
  const body = await request<T[]>(path);
  return { items: body.data, nextCursor: body.nextCursor ?? null };
}
