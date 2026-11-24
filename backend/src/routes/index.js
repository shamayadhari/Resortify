import { Router } from "express";

import { dbState } from "../config/db.js";
import * as auth from "../controllers/authController.js";
import { sendContact } from "../controllers/contactController.js";
import * as users from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { sensitiveLimiter } from "../middleware/rateLimit.js";
import { avatarUpload } from "../middleware/upload.js";

const router = Router();

router.get("/health", (req, res) => {
  const db = dbState();
  res.status(db === "connected" ? 200 : 503).json({ ok: db === "connected", db });
});

// Auth. /auth/me is not rate limited because the interface calls it on every page load.
router.post("/auth/register", sensitiveLimiter, auth.register);
router.post("/auth/login", sensitiveLimiter, auth.login);
router.get("/auth/me", requireAuth, auth.me);

// Current user
router.patch("/users/me", requireAuth, users.updateMe);
router.post("/users/me/avatar", requireAuth, avatarUpload, users.uploadAvatar);
router.patch("/users/me/password", requireAuth, users.changePassword);

// Public contact form
router.post("/contact", sensitiveLimiter, sendContact);

export default router;
