// Compresses an image in the browser before upload — resizes to a max
// dimension and re-encodes as JPEG at a reasonable quality. This cuts
// upload size drastically (especially for phone camera photos, which are
// often 3-5MB) without a visible quality loss for a social feed image.
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  // Skip compression for already-small files or non-standard types (e.g. GIF)
  if (file.size < 300 * 1024 || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // If compression fails for any reason (unsupported browser, corrupt
    // file, etc.), fall back to the original — the server still validates
    // size/type, so this stays safe either way.
    return file;
  }
}
