/**
 * Right-sized variants of a story photo. Uploads land on Cloudinary at up to
 * 2560px; nothing on the site needs that, and phones pay for every decoded
 * pixel. Non-Cloudinary URLs pass through untouched.
 */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

function transformed(url: string, transform: string): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  return match ? `${match[1]}${transform}/${match[2]}` : url;
}

/** The photo behind a card-sized board: at most a phone's width at 2×. */
export function boardPhoto(url: string): string {
  return transformed(url, "w_900,c_limit,q_auto:good,f_auto");
}

/** Full-screen surfaces: the episode sheet's backdrop and the play board. */
export function screenPhoto(url: string): string {
  return transformed(url, "w_1400,c_limit,q_auto:good,f_auto");
}

/**
 * The bloom behind the shelf: a thumbnail blurred on the server, upscaled by
 * the browser. Replaces a 56px CSS blur over a full-screen image, which is the
 * single most expensive thing a phone GPU was asked to do on this page.
 */
export function ambientPhoto(url: string): string {
  return transformed(url, "w_64,c_limit,e_blur:600,q_auto:low,f_auto");
}
