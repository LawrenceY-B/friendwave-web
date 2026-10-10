import { appIcon } from "@/lib/app-icon";

// Icons for the web app manifest (app/manifest.ts), built once at build time:
// /pwa-icon/192, /pwa-icon/512 and /pwa-icon/maskable-512
const ICONS = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  "maskable-512": { px: 512, maskable: true },
} as const;

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: RouteContext<"/pwa-icon/[size]">) {
  const icon = ICONS[(await params).size as keyof typeof ICONS];
  if (!icon) return new Response("Not found", { status: 404 });
  return appIcon(icon.px, { rounded: !icon.maskable, maskable: icon.maskable });
}
