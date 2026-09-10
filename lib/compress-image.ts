const MAX_STORY_IMAGE_BYTES = 10 * 1024 * 1024;

/** Shrink a photo in the browser until it fits Cloudinary's 10 MB cap. */
export async function compressImageFile(
  file: File,
  maxBytes = MAX_STORY_IMAGE_BYTES,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= Math.min(maxBytes, 2_500_000)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 2560;
  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  let quality = 0.86;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (blob && blob.size <= maxBytes) {
      break;
    }
    if (quality > 0.45) {
      quality -= 0.12;
    } else {
      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
      quality = 0.72;
    }
  }

  if (!blob || blob.size > maxBytes) {
    throw new Error("Could not compress this image under 10 MB.");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}
