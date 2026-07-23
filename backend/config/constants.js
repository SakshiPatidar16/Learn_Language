import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin123@yopmail.com").trim().toLowerCase();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
export const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
export const MONGODB_DB_NAME = (process.env.MONGODB_DB_NAME || "study_program").trim();
export const MONGODB_COLLECTION = (process.env.MONGODB_COLLECTION || "languages").trim();
export const MONGODB_USERS_COLLECTION = (process.env.MONGODB_USERS_COLLECTION || "users").trim();
export const MONGODB_PROGRAMS_COLLECTION = (process.env.MONGODB_PROGRAMS_COLLECTION || "programs").trim();
export const MONGODB_UNITS_COLLECTION = (process.env.MONGODB_UNITS_COLLECTION || "units").trim();

// Absolute path to the backend root (two levels up from config/)
export const ROOT_DIR = path.resolve(__dirname, "..");
export const DATA_FILE = path.join(ROOT_DIR, "data", "languages.json");
export const USERS_FILE = path.join(ROOT_DIR, "data", "users.json");
