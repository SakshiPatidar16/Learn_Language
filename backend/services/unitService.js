import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { unitsCollection, programsCollection } from "../config/db.js";
import { ROOT_DIR } from "../config/constants.js";

export const unitService = {
  async getByLanguageId(languageId) {
    if (!unitsCollection) throw new Error("Database not connected");
    return unitsCollection
      .find({ languageId }, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();
  },

  async create({ languageId, name, notes, pdfPath, wordPath, email }) {
    if (!unitsCollection) throw new Error("Database not connected");
    const files = [];
    if (pdfPath) files.push({ id: randomUUID(), name: "Initial PDF", path: pdfPath, type: "pdf" });
    if (wordPath) files.push({ id: randomUUID(), name: "Initial Word", path: wordPath, type: "word" });

    const unit = {
      id: randomUUID(),
      languageId,
      name,
      notes,
      files,
      createdBy: email,
      updatedAt: new Date().toISOString()
    };
    await unitsCollection.insertOne(unit);
    return unit;
  },

  async updateById(unitId, { name, notes, files }) {
    if (!unitsCollection) throw new Error("Database not connected");
    const existing = await unitsCollection.findOne({ id: unitId });
    if (!existing) return null;
    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      notes: notes !== undefined ? notes : existing.notes,
      files: files !== undefined ? files : existing.files,
      updatedAt: new Date().toISOString()
    };
    await unitsCollection.replaceOne({ id: unitId }, updated);
    const { _id: _ignoredId, ...sanitized } = updated;
    return sanitized;
  },

  async addFile(unitId, { name, description, path: filePath, type }) {
    if (!unitsCollection) throw new Error("Database not connected");
    const existing = await unitsCollection.findOne({ id: unitId });
    if (!existing) return null;
    const newFile = { id: randomUUID(), name, description, path: filePath, type };
    const files = [...(existing.files || []), newFile];
    await unitsCollection.updateOne(
      { id: unitId },
      { $set: { files, updatedAt: new Date().toISOString() } }
    );
    return newFile;
  },

  async removeFile(unitId, fileId) {
    if (!unitsCollection) throw new Error("Database not connected");
    const unit = await unitsCollection.findOne({ id: unitId });
    if (!unit) return null;
    const fileToDelete = (unit.files || []).find((f) => f.id === fileId);
    const files = (unit.files || []).filter((f) => f.id !== fileId);
    await unitsCollection.updateOne({ id: unitId }, { $set: { files } });
    if (fileToDelete?.path) {
      await fs.unlink(path.resolve(ROOT_DIR, fileToDelete.path)).catch(() => {});
    }
    return true;
  },

  async deleteById(unitId) {
    if (!unitsCollection) throw new Error("Database not connected");
    const existing = await unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
    if (!existing) return null;
    for (const file of existing.files || []) {
      if (file.path) await fs.unlink(path.resolve(ROOT_DIR, file.path)).catch(() => {});
    }
    await unitsCollection.deleteOne({ id: unitId });
    if (programsCollection) {
      await programsCollection.deleteMany({ unitId });
    }
    return existing;
  },

  async deleteByLanguageId(languageId) {
    if (!unitsCollection) return;
    const units = await unitsCollection
      .find({ languageId }, { projection: { _id: 0 } })
      .toArray();
    for (const unit of units) {
      for (const file of unit.files || []) {
        if (file.path) await fs.unlink(path.resolve(ROOT_DIR, file.path)).catch(() => {});
      }
    }
    await unitsCollection.deleteMany({ languageId });
  },

  async findById(unitId) {
    if (!unitsCollection) throw new Error("Database not connected");
    return unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
  }
};
