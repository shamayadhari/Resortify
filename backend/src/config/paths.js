import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./env.js";

export const BACKEND_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const UPLOAD_DIR = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(BACKEND_ROOT, env.UPLOAD_DIR);
export const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars");
