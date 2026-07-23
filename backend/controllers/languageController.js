import { languageService } from "../services/languageService.js";
import { ADMIN_EMAIL } from "../config/constants.js";

export const languageController = {
  async getAll(_req, res) {
    try {
      const items = await languageService.getAll();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to load languages. Database is required." });
    }
  },

  async create(req, res) {
    const name = req.body.name.trim();
    const description = req.body.description.trim();

    try {
      const item = await languageService.create({ name, description, email: ADMIN_EMAIL });
      res.status(201).json(item);
    } catch {
      res.status(500).json({ message: "Failed to create language. Database is required." });
    }
  },

  async update(req, res) {
    const name = req.body.name.trim();
    const description = req.body.description.trim();

    try {
      const updated = await languageService.updateById(req.params.id, { name, description });
      if (!updated) return res.status(404).json({ message: "Language not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update language. Database is required." });
    }
  },

  async remove(req, res) {
    try {
      const deleted = await languageService.deleteById(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Language not found" });
      res.json({ message: "Deleted successfully", deleted });
    } catch {
      res.status(500).json({ message: "Failed to delete language. Database is required." });
    }
  }
};
