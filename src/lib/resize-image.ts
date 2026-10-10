"use client";

// Shrinks a photo in the browser before upload: longest side at most `maxSide`
// pixels, re-encoded as JPEG. A 12 MB phone photo typically becomes 200-400 KB, so
// uploads are fast and stay far below server limits (Vercel caps requests at 4.5 MB).
// Note: animated GIFs become a still image.
export async function shrinkImage(file: File, maxSide: number, quality = 0.85): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the camera's rotation (EXIF), so photos aren't sideways
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // the browser can't decode it (e.g. HEIC in some browsers): send as-is
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  // JPEG has no transparency: give transparent PNGs a white background instead of black
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  // An already-small JPEG can come out bigger after re-encoding: keep the original then
  if (scale === 1 && file.type === "image/jpeg" && blob.size >= file.size) return file;

  const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
