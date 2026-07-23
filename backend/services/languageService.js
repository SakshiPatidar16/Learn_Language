import { randomUUID } from "node:crypto";
import { languagesCollection } from "../config/db.js";
import { readLanguagesFromFile } from "./fileStorage.js";
import { programService } from "./programService.js";
import { unitService } from "./unitService.js";

export const languageService = {
  async getAll() {
    if (!languagesCollection) throw new Error("Database not connected");
    return languagesCollection.find({}, { projection: { _id: 0 } }).toArray();
  },

  async create({ name, description, email }) {
    if (!languagesCollection) throw new Error("Database not connected");
    const item = {
      id: randomUUID(),
      name,
      description,
      createdBy: email,
      updatedAt: new Date().toISOString()
    };
    await languagesCollection.insertOne(item);
    return item;
  },

  async updateById(id, { name, description }) {
    if (!languagesCollection) throw new Error("Database not connected");
    const existing = await languagesCollection.findOne({ id });
    if (!existing) return null;
    const updated = { ...existing, name, description, updatedAt: new Date().toISOString() };
    await languagesCollection.replaceOne({ id }, updated);
    const { _id: _ignoredId, ...sanitized } = updated;
    return sanitized;
  },

  async deleteById(id) {
    if (!languagesCollection) throw new Error("Database not connected");
    const existing = await languagesCollection.findOne({ id }, { projection: { _id: 0 } });
    if (!existing) return null;
    await languagesCollection.deleteOne({ id });
    await programService.deleteByLanguageId(id);
    await unitService.deleteByLanguageId(id);
    return existing;
  }
};
