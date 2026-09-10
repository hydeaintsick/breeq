import { createHash } from "node:crypto";

export const STORY_BACKGROUND_FOLDER = "breeq/story-backgrounds";
export const MAX_STORY_IMAGE_BYTES = 10 * 1024 * 1024;

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export async function uploadStoryBackground(file: File): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !secret) {
    throw new Error("Cloudinary is not configured.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Upload an image file.");
  }

  if (file.size > MAX_STORY_IMAGE_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const eager = "q_auto,f_auto,c_limit,w_2560";
  const signature = createHash("sha1")
    .update(`eager=${eager}&folder=${STORY_BACKGROUND_FOLDER}&timestamp=${timestamp}${secret}`)
    .digest("hex");

  const body = new FormData();
  body.set("file", file);
  body.set("api_key", apiKey);
  body.set("timestamp", String(timestamp));
  body.set("folder", STORY_BACKGROUND_FOLDER);
  body.set("eager", eager);
  body.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error("Could not upload the image.");
  }

  const payload = (await response.json()) as { secure_url?: string; url?: string };
  const url = payload.secure_url ?? payload.url;
  if (!url) {
    throw new Error("Could not upload the image.");
  }
  return url;
}
