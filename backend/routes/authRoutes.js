import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authController } from "../controllers/authController.js";
import {
  loginRules,
  passwordResetRequestRules,
  passwordResetRules,
  signupRules
} from "../middleware/validationRules.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many password reset requests. Try again later." }
});

router.post("/signup", signupRules, validate, authController.signup);
router.post("/login", loginRules, validate, authController.login);
router.post("/forgot-password", passwordResetLimiter, passwordResetRequestRules, validate, authController.requestPasswordReset);
router.post("/reset-password", passwordResetLimiter, passwordResetRules, validate, authController.resetPassword);

export default router;
