import { randomUUID } from "node:crypto";
import { languagesCollection } from "../config/db.js";
import { readLanguagesFromFile, writeLanguagesToFile } from "./fileStorage.js";
import { programService } from "./programService.js";
import { unitService } from "./unitService.js";

export const languageService = {
  async getAll() {
    if (!languagesCollection) return readLanguagesFromFile();
    return languagesCollection.find({}, { projection: { _id: 0 } }).toArray();
  },

  async create({ name, description, email }) {
    const item = {
      id: randomUUID(),
      name,
      description,
      createdBy: email,
      updatedAt: new Date().toISOString()
    };
    if (!languagesCollection) {
      const items = await readLanguagesFromFile();
      items.push(item);
      await writeLanguagesToFile(items);
      return item;
    }
    await languagesCollection.insertOne(item);
    return item;
  },

  async updateById(id, { name, description }) {
    if (!languagesCollection) {
      const items = await readLanguagesFromFile();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const updated = { ...items[index], name, description, updatedAt: new Date().toISOString() };
      items[index] = updated;
      await writeLanguagesToFile(items);
      return updated;
    }
    const existing = await languagesCollection.findOne({ id });
    if (!existing) return null;
    const updated = { ...existing, name, description, updatedAt: new Date().toISOString() };
    await languagesCollection.replaceOne({ id }, updated);
    const { _id: _ignoredId, ...sanitized } = updated;
    return sanitized;
  },

  async deleteById(id) {
    let existing;
    if (!languagesCollection) {
      const items = await readLanguagesFromFile();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return null;
      [existing] = items.splice(index, 1);
      await writeLanguagesToFile(items);
    } else {
      existing = await languagesCollection.findOne({ id }, { projection: { _id: 0 } });
    }
    if (!existing) return null;
    if (languagesCollection) await languagesCollection.deleteOne({ id });
    await programService.deleteByLanguageId(id);
    await unitService.deleteByLanguageId(id);
    return existing;
  }
};
