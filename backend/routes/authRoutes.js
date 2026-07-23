import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { signupRules, loginRules } from "../middleware/validationRules.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/signup", signupRules, validate, authController.signup);
router.post("/login", loginRules, validate, authController.login);

export default router;
