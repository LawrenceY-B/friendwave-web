import type { MetadataRoute } from "next";

// Makes Friendwave installable ("Add to Home Screen" / "Install app"): it then opens
// full-screen with its own icon, like a native app. Served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Friendwave",
    short_name: "Friendwave",
    description: "Connect with friends and share moments.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#ffffff",
    categories: ["social"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New post", url: "/create", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
      { name: "Chats", url: "/chats", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
    ],
  };
}
