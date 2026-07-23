import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";

export function makeToken(email, role) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function decodeToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.email || !payload.role) return null;
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
