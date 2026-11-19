import { createHash, randomBytes } from "node:crypto";
import { userService } from "../services/userService.js";
import { mailService } from "../services/mailService.js";
import { makeToken } from "../services/tokenService.js";
import { ADMIN_EMAIL, FRONTEND_URL } from "../config/constants.js";

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_RESPONSE = {
  message: "If an account matches that email, password reset instructions will be sent."
};

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export const authController = {
  async signup(req, res) {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone.trim();
    const password = req.body.password;

    if (email === ADMIN_EMAIL) return res.status(403).json({ message: "This email is reserved for admin" });

    try {
      const existing = await userService.findByEmail(email);
      if (existing) return res.status(409).json({ message: "User already exists" });

      const user = await userService.create({ name, email, phone, password, role: "user" });
      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      });
    } catch {
      return res.status(500).json({ message: "Signup failed" });
    }
  },

  async login(req, res) {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    try {
      let user = await userService.findByEmail(email);
      if (!user && email === ADMIN_EMAIL) {
        await userService.ensureAdmin();
        user = await userService.findByEmail(email);
      }

      if (!user || !(await userService.comparePassword(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const role = user.role || "user";
      const token = makeToken(email, role);

      return res.json({ token, email, role, adminEmail: ADMIN_EMAIL });
    } catch {
      return res.status(500).json({ message: "Login failed" });
    }
  },

  async requestPasswordReset(req, res) {
    if (!mailService.isConfigured()) {
      return res.status(503).json({ message: "Password reset email is not configured. Contact support." });
    }

    const email = req.body.email.trim().toLowerCase();

    try {
      const user = await userService.findByEmail(email);
      if (user) {
        const token = randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(token);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
        const saved = await userService.setPasswordReset(email, tokenHash, expiresAt);

        if (saved) {
          const resetUrl = new URL("/reset-password", FRONTEND_URL);
          resetUrl.searchParams.set("token", token);
          try {
            await mailService.sendPasswordResetEmail(email, resetUrl.toString());
          } catch (error) {
            await userService.clearPasswordReset(email, tokenHash);
            console.error("Password reset email delivery failed.", error.message);
          }
        }
      }

      return res.status(202).json(PASSWORD_RESET_RESPONSE);
    } catch (error) {
      console.error("Password reset request failed.", error.message);
      return res.status(500).json({ message: "Unable to process the password reset request." });
    }
  },

  async resetPassword(req, res) {
    const tokenHash = hashResetToken(req.body.token.trim());

    try {
      const updated = await userService.resetPassword(tokenHash, req.body.password);
      if (!updated) {
        return res.status(400).json({ message: "This password reset link is invalid or has expired." });
      }
      return res.json({ message: "Password updated. You can now sign in." });
    } catch (error) {
      console.error("Password reset failed.", error.message);
      return res.status(500).json({ message: "Unable to reset the password right now." });
    }
  }
};
