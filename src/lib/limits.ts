// Same limits as the API. Checked in the browser and in the Server Action too, so
// mistakes get a clear message before anything is uploaded.
export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CAPTION = 2200;

// Profile fields (match the API's PATCH /api/users/me validation)
export const MAX_NAME = 50;
export const MAX_BIO = 150;
export const USERNAME_PATTERN = "^[A-Za-z0-9._]{3,30}$";
export const USERNAME_HINT = "3-30 letters, numbers, dots or underscores";

// Photos are shrunk in the browser before upload (lib/resize-image.ts)
export const POST_IMAGE_MAX_SIDE = 1080;
export const AVATAR_MAX_SIDE = 640;
