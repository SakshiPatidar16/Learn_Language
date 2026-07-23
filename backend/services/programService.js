import { randomUUID } from "node:crypto";
import { programsCollection } from "../config/db.js";

export const programService = {
  async getByUnitId(unitId) {
    if (!programsCollection) throw new Error("Database not connected");
    return programsCollection
      .find({ unitId }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
  },

  async create({ languageId, unitId, question, code, output, email }) {
    if (!programsCollection) throw new Error("Database not connected");
    const program = {
      id: randomUUID(),
      languageId,
      unitId,
      question,
      code,
      output,
      createdBy: email,
      updatedAt: new Date().toISOString()
    };
    await programsCollection.insertOne(program);
    return program;
  },

  async updateById(programId, { question, code, output }) {
    if (!programsCollection) throw new Error("Database not connected");
    const existing = await programsCollection.findOne({ id: programId });
    if (!existing) return null;
    const updated = { ...existing, question, code, output, updatedAt: new Date().toISOString() };
    await programsCollection.replaceOne({ id: programId }, updated);
    const { _id: _ignoredId, ...sanitized } = updated;
    return sanitized;
  },

  async deleteById(programId) {
    if (!programsCollection) throw new Error("Database not connected");
    const existing = await programsCollection.findOne({ id: programId }, { projection: { _id: 0 } });
    if (!existing) return null;
    await programsCollection.deleteOne({ id: programId });
    return existing;
  },

  async deleteByLanguageId(languageId) {
    if (!programsCollection) return;
    await programsCollection.deleteMany({ languageId });
  },

  async deleteAll() {
    if (!programsCollection) throw new Error("Database not connected");
    await programsCollection.deleteMany({});
  }
};
