import { HeaderTitle } from "@/components/header-title";
import { MotionEffects } from "@/components/motion-effects";
import { NavigationTracker } from "@/components/navigation-tracker";
import { RealtimeProvider } from "@/components/realtime-provider";
import { ServiceWorker } from "@/components/service-worker";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeWatcher } from "@/components/theme-watcher";
import { MobileNav, UserMenu } from "@/components/user-menu";
import { THEME_SCRIPT } from "@/lib/theme";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  applicationName: "Friendwave",
  // Installed on an iPhone home screen: full screen, named "Friendwave"
  appleWebApp: { capable: true, title: "Friendwave", statusBarStyle: "default" },
};

// The browser/phone status bar matches the header; "cover" lets the installed app use the
// whole screen (the header, bottom bar and chat pad themselves with the safe-area insets)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

// `modal` is the slot app/@modal renders into: a post opened on top of the current page
export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets <html>'s class before React loads
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies your theme (System / Light / Dark) before the first paint: no flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-neutral-50 dark:bg-black">
        <ThemeWatcher />
        {/* One live connection for the whole tab (chat, live counts, notifications, presence) */}
        <RealtimeProvider>
          <SmoothScroll>
            {/* Reads the URL, so it needs a boundary; renders nothing */}
            <Suspense fallback={null}>
              <NavigationTracker />
              <MotionEffects />
            </Suspense>
            <header
              data-app-header
              className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-neutral-800 dark:bg-black/80"
            >
              <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
                <HeaderTitle />
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
            <ServiceWorker />
          </SmoothScroll>
        </RealtimeProvider>
      </body>
    </html>
  );
}
