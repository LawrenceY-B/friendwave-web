"use client";

import { likeBurst } from "@/lib/like-burst";
import { gsap, reducedMotion, ScrollTrigger, useGSAP } from "@/lib/motion";
import { Bookmark, Heart, MessageCircle, Send, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { WaveScene } from "./wave-scene";

// The logged-out home page. Calm and in the app's own style (neutral, light/dark, one blue):
// a quiet field of dots swells behind the page (wave-scene.ts), words fade up, and phones
// showing the real app tilt gently into place as you scroll.

const LOGIN = "/auth/login";
const SIGNUP = "/auth/login?screen_hint=signup";
const primary =
  "inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700";
const secondary =
  "inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 font-semibold transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<WaveScene | null>(null);
  const [webgl, setWebgl] = useState(true);

  // ---- the dot sea (loaded only on this page) ----
  useEffect(() => {
    let disposed = false;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    import("./wave-scene")
      .then(({ createWaveScene }) => {
        if (disposed || !canvas.current) return;
        try {
          scene.current = createWaveScene(canvas.current, { mobile, reduced: reducedMotion() });
        } catch {
          setWebgl(false); // no WebGL: the page is just as readable without it
        }
      })
      .catch(() => setWebgl(false));
    const onResize = () => scene.current?.resize();
    const onPointer = (e: PointerEvent) =>
      scene.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => scene.current?.setScroll(self.progress),
      });
      if (reducedMotion()) return;

      // Hero: words fade up one after another, then the buttons
      gsap
        .timeline({ defaults: { ease: "power3.out" }, delay: 0.1 })
        // (explicit end values: these start hidden via .landing-start, so a plain from() would end hidden)
        .set("[data-intro=title], [data-intro=cta]", { opacity: 1 })
        .fromTo("[data-intro=nav]", { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .from("[data-hero] [data-word]", { yPercent: 60, opacity: 0, duration: 1, stagger: 0.06 }, 0.1)
        .fromTo("[data-intro=sub]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.55)
        .from("[data-intro=cta] > *", { y: 16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.7);

      // The sea steps back once you're past the hero, so it never sits behind text
      gsap.to(canvas.current, {
        opacity: 0.18,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom 30%", scrub: true },
      });

      // The hero eases away as you scroll on
      gsap.to("[data-hero-content]", {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      });

      // Phones rise at slightly different speeds and level out (a touch of depth, no spin)
      gsap.utils.toArray<HTMLElement>("[data-phone]").forEach((phone, i) => {
        gsap.fromTo(
          phone,
          { y: [90, 140, 90][i % 3], rotateX: 14, transformPerspective: 1200, transformOrigin: "50% 100%" },
          {
            y: 0,
            rotateX: 0,
            ease: "none",
            scrollTrigger: { trigger: "[data-showcase]", start: "top 95%", end: "center 55%", scrub: 0.8 },
          }
        );
      });

      // Everything else: a simple fade-up as it comes into view
      gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) =>
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        })
      );
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      data-landing
      className="relative -mt-6 -mb-28 overflow-x-clip bg-neutral-50 text-neutral-900 sm:-mb-6 dark:bg-black dark:text-neutral-100"
      // Full width, out of the app's narrow column
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
    >
      <canvas
        ref={canvas}
        aria-hidden
        data-testid="wave-canvas"
        className={`pointer-events-none fixed inset-0 h-svh w-full ${webgl ? "" : "hidden"}`}
      />

      {/* ---- top bar (same as the app's header) ---- */}
      <nav
        data-intro="nav"
        className="landing-start fixed inset-x-0 top-0 z-30 border-b border-neutral-200/70 bg-neutral-50/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-neutral-800/70 dark:bg-black/70"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Friendwave
          </Link>
          <a
            href={LOGIN}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Log in
          </a>
        </div>
      </nav>

      <div className="relative z-10">
        {/* ---- hero ---- */}
        <section
          data-hero
          className="flex min-h-svh flex-col items-center justify-center px-5 pt-14 pb-[22vh] text-center"
        >
          <div data-hero-content className="flex max-w-3xl flex-col items-center">
            <h1
              data-intro="title"
              className="landing-start text-[clamp(2.6rem,7.5vw,5.75rem)] leading-[1.02] font-bold tracking-tight"
            >
              <Words text="Stay close to" />
              <br />
              <Words text="your friends." className="text-neutral-400 dark:text-neutral-500" />
            </h1>
            <p
              data-intro="sub"
              className="landing-start mt-6 max-w-md text-lg text-neutral-600 sm:text-xl dark:text-neutral-400"
            >
              Share photos, watch stories and chat in real time. Just the people you care about.
            </p>
            <div data-intro="cta" className="landing-start mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={SIGNUP} className={primary}>
                Create account
              </a>
              <a href={LOGIN} className={secondary}>
                Log in
              </a>
            </div>
          </div>
        </section>

        {/* ---- the app itself ---- */}
        <section data-showcase className="mx-auto max-w-6xl px-5 pb-24">
          <div data-rise className="mx-auto mb-14 max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything happens live.</h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">
              Likes, comments and messages show up the moment they happen. No refreshing.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:items-end md:gap-8">
            <Phone>
              <FeedScreen />
            </Phone>
            <Phone raised>
              <ChatScreen />
            </Phone>
            <Phone>
              <StoriesScreen />
            </Phone>
          </div>
        </section>

        {/* ---- what you get ---- */}
        <section className="mx-auto grid max-w-5xl gap-10 px-5 py-20 sm:grid-cols-3">
          <Feature icon={<Heart className="size-5" />} title="Share moments">
            Post photos, double‑tap the ones you love, and keep the conversation going in the comments.
          </Feature>
          <Feature icon={<MessageCircle className="size-5" />} title="Chat in real time">
            See when friends are online, and never miss a message with unread badges.
          </Feature>
          <Feature icon={<Send className="size-5" />} title="Stories">
            Share a post to your story for 24 hours, and catch up on what your friends are doing.
          </Feature>
        </section>

        {/* ---- final call ---- */}
        <section className="flex min-h-[70svh] flex-col items-center justify-center gap-8 px-5 pb-16 text-center">
          <h2 data-rise className="text-[clamp(2.2rem,5.5vw,4rem)] leading-tight font-bold tracking-tight">
            Your friends are already here.
          </h2>
          <div data-rise className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={SIGNUP} className={primary}>
              Create account
            </a>
            <a href={LOGIN} className={secondary}>
              Log in
            </a>
          </div>
          <footer className="pt-16 text-xs text-neutral-500">© {new Date().getFullYear()} Friendwave</footer>
        </section>
      </div>
    </div>
  );
}

// Words wrapped for the fade-up; screen readers get the plain text
function Words({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span aria-label={text} role="text" className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span data-word className="inline-block">
            {word}
            {" "}
          </span>
        </span>
      ))}
    </span>
  );
}

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div data-rise className="space-y-3">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-neutral-200/70 dark:bg-neutral-800">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400">{children}</p>
    </div>
  );
}

// A phone frame around a screen drawn in the app's own styles
function Phone({ children, raised = false }: { children: ReactNode; raised?: boolean }) {
  return (
    <div
      data-phone
      className={`relative h-[31rem] w-[15.5rem] shrink-0 rounded-[2.6rem] bg-neutral-900 p-[9px] shadow-2xl ring-1 shadow-neutral-900/20 ring-neutral-900/10 dark:bg-neutral-800 dark:shadow-black dark:ring-white/10 ${
        raised ? "md:mb-10" : ""
      }`}
    >
      <div className="absolute top-[18px] left-1/2 z-20 h-[18px] w-16 -translate-x-1/2 rounded-full bg-black" />
      <div className="relative h-full overflow-hidden rounded-[2.1rem] bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
        {children}
      </div>
    </div>
  );
}

// A natural-looking "photo": soft evening light over the sea (muted, like a real picture)
const PHOTO = {
  background:
    "radial-gradient(120% 60% at 50% 62%, rgb(255 222 181 / 0.9), transparent 55%), linear-gradient(180deg, #9fb3c8 0%, #d9c3ad 48%, #6f8597 52%, #3f5566 100%)",
};

// The feed, with the app's double-tap heart every now and then
function FeedScreen() {
  const photo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion()) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.6 });
    if (photo.current) io.observe(photo.current);
    const id = setInterval(() => {
      const el = photo.current;
      if (el && visible) likeBurst(el, el.clientWidth / 2, el.clientHeight / 2);
    }, 4200);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, []);
  return (
    <div className="flex h-full flex-col pt-9 text-[13px]">
      <div className="border-b border-neutral-200 px-3 pb-2 font-bold tracking-tight dark:border-neutral-800">
        Friendwave
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold dark:bg-neutral-800">
          A
        </span>
        <span className="font-semibold">ama.k</span>
        <span className="ml-auto text-[11px] text-neutral-500">2h</span>
      </div>
      <div ref={photo} className="relative aspect-square overflow-hidden" style={PHOTO} />
      <div className="space-y-1.5 px-3 pt-2.5">
        <div className="flex items-center gap-3">
          <Heart className="size-5 fill-red-500 text-red-500" />
          <span>128</span>
          <MessageCircle className="size-5" />
          <span>14</span>
          <Bookmark className="ml-auto size-5" />
        </div>
        <p>
          <span className="font-semibold">ama.k</span> last light at the beach
        </p>
      </div>
    </div>
  );
}

// The chat, in its real look (light-blue bubbles for you, white/grey for them)
function ChatScreen() {
  return (
    <div className="flex h-full flex-col bg-neutral-100 pt-9 text-[13px] dark:bg-neutral-950">
      <div className="mx-auto rounded-full bg-white/90 px-4 py-1 text-center shadow-sm dark:bg-neutral-900">
        <span className="block font-semibold">kofi</span>
        <span className="block text-[10px] text-blue-600 dark:text-blue-400">online</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1 px-2.5 pb-3">
        <span className="mx-auto mb-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
          Today
        </span>
        <Bubble>are you coming tonight?</Bubble>
        <Bubble>bring the camera 📷</Bubble>
        <Bubble mine>on my way!</Bubble>
        <Bubble mine>saving you a seat</Bubble>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-8 flex-1 items-center rounded-full bg-white px-3 text-neutral-400 dark:bg-neutral-900">
            Message
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white">
            <SendHorizontal className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({ children, mine = false }: { children: ReactNode; mine?: boolean }) {
  return (
    <span
      className={`w-fit max-w-[80%] rounded-2xl px-2.5 py-1.5 shadow-sm ${
        mine
          ? "ml-auto rounded-br-md bg-blue-100 dark:bg-blue-600 dark:text-white"
          : "rounded-bl-md bg-white dark:bg-neutral-800"
      }`}
    >
      {children}
    </span>
  );
}

// The story viewer (black, as in the app): progress bars, the post as a card
function StoriesScreen() {
  return (
    <div className="flex h-full flex-col bg-black px-3 pt-9 pb-4 text-white">
      <div className="flex gap-1">
        {[1, 0.55, 0].map((fill, i) => (
          <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <span className="block h-full bg-white" style={{ width: `${fill * 100}%` }} />
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="flex size-6 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-semibold">
          E
        </span>
        <span className="font-semibold">esi</span>
        <span className="text-white/60">1h</span>
      </div>
      <div className="mt-auto mb-auto overflow-hidden rounded-xl shadow-2xl">
        <div className="aspect-[4/5]" style={PHOTO} />
      </div>
      <p className="text-center text-xs text-white/80">golden hour 🌅</p>
    </div>
  );
}
