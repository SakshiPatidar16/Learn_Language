import { Router } from "express";
import { codeRunnerController } from "../controllers/codeRunnerController.js";

const router = Router();

router.post("/run-code", codeRunnerController.run);

export default router;
