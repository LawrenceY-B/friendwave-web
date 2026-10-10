import { ImageResponse } from "next/og";

// The Friendwave app icon, drawn in code (no image files to keep in sync): the app's
// blue → violet gradient with a white double wave.
//   rounded:  rounded corners (browser tabs, Android "any" icons); iOS rounds its own
//   maskable: the mark shrinks into the middle ~60% so any mask shape (circle, squircle) keeps it whole
export function appIcon(size: number, { rounded = false, maskable = false } = {}) {
  const mark = Math.round(size * (maskable ? 0.5 : 0.66));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)",
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 64 64" fill="none">
        <path
          d="M6 26c6.5-8 13-8 19.5 0s13 8 19.5 0 9.5-7 13-4"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 44c6.5-8 13-8 19.5 0s13 8 19.5 0 9.5-7 13-4"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { width: size, height: size }
  );
}
