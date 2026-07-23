import { codeRunnerService } from "../services/codeRunnerService.js";

export const codeRunnerController = {
  async run(req, res) {
    const { compiler, code, stdin = "" } = req.body;

    if (!compiler || !code) {
      return res.status(400).json({ message: "Compiler and code are required" });
    }

    try {
      const result = await codeRunnerService.runLocally(code, compiler, stdin);
      res.json(result);
    } catch (error) {
      console.error(`[CODE_RUNNER] Error: ${error.message}`);
      res.status(500).json({ message: "Failed to run code", error: error.message });
    }
  }
};
