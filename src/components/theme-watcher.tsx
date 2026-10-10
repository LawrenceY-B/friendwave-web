"use client";

import { applyTheme, readTheme } from "@/lib/theme";
import { useEffect } from "react";

// On "System", follow the device when it switches between light and dark
export function ThemeWatcher() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return null;
}
