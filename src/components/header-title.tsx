"use client";

import { usePageTitleState } from "@/lib/page-title";
import Link from "next/link";
import { BackButton } from "./back-button";

// The left side of the header. Phones: the page's title (and Back) when it has one, so
// each page feels full-screen like an app. From `sm:` up, always "Friendwave".
export function HeaderTitle() {
  const page = usePageTitleState();
  return (
    <>
      <Link href="/" className={`text-lg font-bold tracking-tight ${page ? "hidden sm:block" : ""}`}>
        Friendwave
      </Link>
      {page && (
        <div className="flex min-w-0 items-center gap-2 sm:hidden" data-testid="header-title">
          {page.back && <BackButton fallback={page.fallback} />}
          <h1 className="truncate text-lg font-semibold">{page.title}</h1>
        </div>
      )}
    </>
  );
}
