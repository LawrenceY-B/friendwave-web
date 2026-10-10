import { MobileNav, UserMenu } from "@/components/user-menu";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Friendwave",
  description: "Connect with friends and share moments.",
};

// `modal` is the slot app/@modal renders into: a post opened on top of the current page
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-neutral-50 dark:bg-black">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Friendwave
            </Link>
            {/* The menu reads the session, so it streams in; the rest of the header is static */}
            <Suspense
              fallback={<div className="h-8 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />}
            >
              <UserMenu />
            </Suspense>
          </div>
        </header>
        {/* Extra bottom padding on phones so the bottom bar never covers content */}
        <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-28 sm:pb-6">{children}</main>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        {modal}
      </body>
    </html>
  );
}
