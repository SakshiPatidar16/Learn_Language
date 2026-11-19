import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { unitsCollection } from "../config/db.js";
import { ROOT_DIR } from "../config/constants.js";
import { readUnitsFromFile, writeUnitsToFile } from "./fileStorage.js";
import { programService } from "./programService.js";

export const unitService = {
  async getByLanguageId(languageId) {
    if (!unitsCollection) {
      return (await readUnitsFromFile())
        .filter((unit) => unit.languageId === languageId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return unitsCollection
      .find({ languageId }, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();
  },

  async create({ languageId, name, notes, pdfPath, wordPath, email }) {
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
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      units.push(unit);
      await writeUnitsToFile(units);
      return unit;
    }
    await unitsCollection.insertOne(unit);
    return unit;
  },

  async updateById(unitId, { name, notes, files }) {
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      const index = units.findIndex((unit) => unit.id === unitId);
      if (index === -1) return null;
      const updated = {
        ...units[index],
        name: name !== undefined ? name : units[index].name,
        notes: notes !== undefined ? notes : units[index].notes,
        files: files !== undefined ? files : units[index].files,
        updatedAt: new Date().toISOString()
      };
      units[index] = updated;
      await writeUnitsToFile(units);
      return updated;
    }
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
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      const index = units.findIndex((unit) => unit.id === unitId);
      if (index === -1) return null;
      const newFile = { id: randomUUID(), name, description, path: filePath, type };
      units[index] = {
        ...units[index],
        files: [...(units[index].files || []), newFile],
        updatedAt: new Date().toISOString()
      };
      await writeUnitsToFile(units);
      return newFile;
    }
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
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      const index = units.findIndex((unit) => unit.id === unitId);
      if (index === -1) return null;
      const unit = units[index];
      const fileToDelete = (unit.files || []).find((file) => file.id === fileId);
      units[index] = {
        ...unit,
        files: (unit.files || []).filter((file) => file.id !== fileId),
        updatedAt: new Date().toISOString()
      };
      await writeUnitsToFile(units);
      if (fileToDelete?.path) {
        await fs.unlink(path.resolve(ROOT_DIR, fileToDelete.path)).catch(() => {});
      }
      return true;
    }
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
    let existing;
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      const index = units.findIndex((unit) => unit.id === unitId);
      if (index === -1) return null;
      [existing] = units.splice(index, 1);
      await writeUnitsToFile(units);
    } else {
      existing = await unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
    }
    if (!existing) return null;
    for (const file of existing.files || []) {
      if (file.path) await fs.unlink(path.resolve(ROOT_DIR, file.path)).catch(() => {});
    }
    if (unitsCollection) await unitsCollection.deleteOne({ id: unitId });
    await programService.deleteByUnitId(unitId);
    return existing;
  },

  async deleteByLanguageId(languageId) {
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      const removed = units.filter((unit) => unit.languageId === languageId);
      for (const unit of removed) {
        for (const file of unit.files || []) {
          if (file.path) await fs.unlink(path.resolve(ROOT_DIR, file.path)).catch(() => {});
        }
      }
      const remaining = units.filter((unit) => unit.languageId !== languageId);
      if (remaining.length !== units.length) await writeUnitsToFile(remaining);
      return;
    }
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
    if (!unitsCollection) {
      const units = await readUnitsFromFile();
      return units.find((unit) => unit.id === unitId) || null;
    }
    return unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
  }
};
