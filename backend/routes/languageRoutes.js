import { Router } from "express";
import { languageController } from "../controllers/languageController.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { languageRules } from "../middleware/validationRules.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Public
router.get("/public/languages", languageController.getAll);

// Authenticated
router.get("/languages", auth, languageController.getAll);

// Admin only
router.post("/languages", auth, adminOnly, languageRules, validate, languageController.create);
router.put("/languages/:id", auth, adminOnly, languageRules, validate, languageController.update);
router.delete("/languages/:id", auth, adminOnly, languageController.remove);

export default router;
