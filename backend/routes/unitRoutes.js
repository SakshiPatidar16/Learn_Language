import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unitController } from "../controllers/unitController.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { unitRules } from "../middleware/validationRules.js";
import { validate } from "../middleware/validate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, "../uploads/"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const router = Router();

// Public
router.get("/public/languages/:languageId/units", unitController.getByLanguage);

// Admin only
router.post(
  "/languages/:languageId/units",
  auth,
  adminOnly,
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "word", maxCount: 1 }]),
  unitRules,
  validate,
  unitController.create
);
router.put("/units/:unitId", auth, adminOnly, unitController.update);
router.delete("/units/:unitId", auth, adminOnly, unitController.remove);
router.post("/units/:unitId/files", auth, adminOnly, upload.single("file"), unitController.addFile);
router.delete("/units/:unitId/files/:fileId", auth, adminOnly, unitController.removeFile);

export default router;
