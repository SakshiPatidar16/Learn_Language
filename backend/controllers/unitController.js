import { unitService } from "../services/unitService.js";
import { ADMIN_EMAIL } from "../config/constants.js";

export const unitController = {
  async getByLanguage(req, res) {
    const languageId = (req.params.languageId || "").trim();
    if (!languageId) return res.status(400).json({ message: "Language id is required" });
    try {
      const units = await unitService.getByLanguageId(languageId);
      res.json(units);
    } catch {
      res.status(500).json({ message: "Failed to load units. Database is required." });
    }
  },

  async create(req, res) {
    const languageId = (req.params.languageId || "").trim();
    const name = (req.body?.name || "").trim();
    const notes = (req.body?.notes || "").trim();

    if (!languageId) return res.status(400).json({ message: "Language id is required" });
    if (!name) return res.status(400).json({ message: "Unit name is required" });

    const pdfPath = req.files?.["pdf"]?.[0]?.path;
    const wordPath = req.files?.["word"]?.[0]?.path;

    try {
      const unit = await unitService.create({
        languageId,
        name,
        notes,
        pdfPath,
        wordPath,
        email: ADMIN_EMAIL
      });
      res.status(201).json(unit);
    } catch {
      res.status(500).json({ message: "Failed to create unit. Database is required." });
    }
  },

  async update(req, res) {
    const unitId = (req.params.unitId || "").trim();
    const name = (req.body?.name || "").trim();
    const notes = (req.body?.notes || "").trim();

    if (!unitId) return res.status(400).json({ message: "Unit id is required" });
    if (!name) return res.status(400).json({ message: "Unit name is required" });

    try {
      const updated = await unitService.updateById(unitId, { name, notes });
      if (!updated) return res.status(404).json({ message: "Unit not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update unit. Database is required." });
    }
  },

  async remove(req, res) {
    const unitId = (req.params.unitId || "").trim();
    if (!unitId) return res.status(400).json({ message: "Unit id is required" });
    try {
      const deleted = await unitService.deleteById(unitId);
      if (!deleted) return res.status(404).json({ message: "Unit not found" });
      res.json({ message: "Unit and its programs deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete unit. Database is required." });
    }
  },

  async addFile(req, res) {
    const unitId = (req.params.unitId || "").trim();
    if (!unitId) return res.status(400).json({ message: "Unit id is required" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const type = req.file.mimetype === "application/pdf" ? "pdf" : "word";
    const name = req.body?.name || req.file.originalname;
    const description = req.body?.description || "";

    try {
      const newFile = await unitService.addFile(unitId, {
        name,
        description,
        path: req.file.path,
        type
      });
      if (!newFile) return res.status(404).json({ message: "Unit not found" });
      res.status(201).json(newFile);
    } catch {
      res.status(500).json({ message: "Failed to upload file" });
    }
  },

  async removeFile(req, res) {
    const { unitId, fileId } = req.params;
    try {
      const result = await unitService.removeFile(unitId, fileId);
      if (!result) return res.status(404).json({ message: "Unit not found" });
      res.json({ message: "File removed successfully" });
    } catch {
      res.status(500).json({ message: "Failed to remove file" });
    }
  }
};
