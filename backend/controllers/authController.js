import { userService } from "../services/userService.js";
import { makeToken } from "../services/tokenService.js";
import { ADMIN_EMAIL } from "../config/constants.js";

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
  }
};
