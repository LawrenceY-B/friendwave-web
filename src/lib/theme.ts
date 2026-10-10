"use client";

import { useSyncExternalStore } from "react";

// Light, dark, or whatever the device uses ("system"). Remembered on this device.
// The no-flash script in layout.tsx applies it before the page first paints; this keeps it
// up to date afterwards (your choice, or the device switching while on "system").
export type Theme = "system" | "light" | "dark";
const KEY = "friendwave:theme";
const listeners = new Set<() => void>();

export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme = readTheme()) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const html = document.documentElement;
  html.classList.toggle("dark", dark);
  html.style.colorScheme = dark ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked: still switch for this visit
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useTheme = () => useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

// Runs before the first paint (inlined in <head>), so a dark-mode user never sees a white flash
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var h=document.documentElement;h.classList.toggle("dark",d);h.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
