import { programService } from "../services/programService.js";
import { unitService } from "../services/unitService.js";
import { ADMIN_EMAIL } from "../config/constants.js";

export const programController = {
  async getByUnit(req, res) {
    const unitId = (req.params.unitId || "").trim();
    if (!unitId) return res.status(400).json({ message: "Unit id is required" });
    try {
      const programs = await programService.getByUnitId(unitId);
      res.json(programs);
    } catch {
      res.status(500).json({ message: "Failed to load programs. Database is required." });
    }
  },

  async create(req, res) {
    const unitId = (req.params.unitId || "").trim();
    const question = (req.body?.question || "").trim();
    const code = (req.body?.code || "").trim();
    const output = (req.body?.output || "").trim();

    if (!unitId) return res.status(400).json({ message: "Unit id is required" });
    if (!question || !code || !output) {
      return res.status(400).json({ message: "Question, code and output are required" });
    }

    try {
      const unit = await unitService.findById(unitId);
      if (!unit) return res.status(404).json({ message: "Unit not found" });

      const program = await programService.create({
        languageId: unit.languageId,
        unitId,
        question,
        code,
        output,
        email: ADMIN_EMAIL
      });
      res.status(201).json(program);
    } catch {
      res.status(500).json({ message: "Failed to create program. Database is required." });
    }
  },

  async update(req, res) {
    const programId = (req.params.programId || "").trim();
    const question = (req.body?.question || "").trim();
    const code = (req.body?.code || "").trim();
    const output = (req.body?.output || "").trim();

    if (!programId) return res.status(400).json({ message: "Program id is required" });

    try {
      const updated = await programService.updateById(programId, { question, code, output });
      if (!updated) return res.status(404).json({ message: "Program not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update program. Database is required." });
    }
  },

  async remove(req, res) {
    const programId = (req.params.programId || "").trim();
    if (!programId) return res.status(400).json({ message: "Program id is required" });
    try {
      const deleted = await programService.deleteById(programId);
      if (!deleted) return res.status(404).json({ message: "Program not found" });
      res.json({ message: "Program deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete program. Database is required." });
    }
  },

  async deleteAll(_req, res) {
    try {
      await programService.deleteAll();
      res.json({ message: "All programs deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to clear programs" });
    }
  }
};
