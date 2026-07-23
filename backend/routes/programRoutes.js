import { Router } from "express";
import { programController } from "../controllers/programController.js";
import { auth, adminOnly } from "../middleware/auth.js";
import { programRules } from "../middleware/validationRules.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Public
router.get("/public/units/:unitId/programs", programController.getByUnit);

// Admin only
router.post("/units/:unitId/programs", auth, adminOnly, programRules, validate, programController.create);
router.put("/programs/:programId", auth, adminOnly, programController.update);
router.delete("/programs/:programId", auth, adminOnly, programController.remove);
router.delete("/cleanup/programs", auth, adminOnly, programController.deleteAll);

export default router;
