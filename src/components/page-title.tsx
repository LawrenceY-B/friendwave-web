"use client";

import { usePageTitle } from "@/lib/page-title";

// Drop into a page to put its title in the phone header (with Back unless it's a
// bottom-tab page). Renders nothing itself; desktop keeps the page's own heading.
export function PageTitle({
  title,
  back = false,
  fallback = "/",
}: {
  title: string;
  back?: boolean;
  fallback?: string;
}) {
  usePageTitle({ title, back, fallback });
  return null;
}
