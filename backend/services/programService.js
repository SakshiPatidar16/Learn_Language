import { randomUUID } from "node:crypto";
import { programsCollection } from "../config/db.js";
import { readProgramsFromFile, writeProgramsToFile } from "./fileStorage.js";

export const programService = {
  async getByUnitId(unitId) {
    if (!programsCollection) {
      return (await readProgramsFromFile())
        .filter((program) => program.unitId === unitId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return programsCollection
      .find({ unitId }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
  },

  async create({ languageId, unitId, question, code, output, email }) {
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
    if (!programsCollection) {
      const programs = await readProgramsFromFile();
      programs.push(program);
      await writeProgramsToFile(programs);
      return program;
    }
    await programsCollection.insertOne(program);
    return program;
  },

  async updateById(programId, { question, code, output }) {
    if (!programsCollection) {
      const programs = await readProgramsFromFile();
      const index = programs.findIndex((program) => program.id === programId);
      if (index === -1) return null;
      const updated = {
        ...programs[index],
        question,
        code,
        output,
        updatedAt: new Date().toISOString()
      };
      programs[index] = updated;
      await writeProgramsToFile(programs);
      return updated;
    }
    const existing = await programsCollection.findOne({ id: programId });
    if (!existing) return null;
    const updated = { ...existing, question, code, output, updatedAt: new Date().toISOString() };
    await programsCollection.replaceOne({ id: programId }, updated);
    const { _id: _ignoredId, ...sanitized } = updated;
    return sanitized;
  },

  async deleteById(programId) {
    if (!programsCollection) {
      const programs = await readProgramsFromFile();
      const index = programs.findIndex((program) => program.id === programId);
      if (index === -1) return null;
      const [deleted] = programs.splice(index, 1);
      await writeProgramsToFile(programs);
      return deleted;
    }
    const existing = await programsCollection.findOne({ id: programId }, { projection: { _id: 0 } });
    if (!existing) return null;
    await programsCollection.deleteOne({ id: programId });
    return existing;
  },

  async deleteByLanguageId(languageId) {
    if (!programsCollection) {
      const programs = await readProgramsFromFile();
      const remaining = programs.filter((program) => program.languageId !== languageId);
      if (remaining.length !== programs.length) await writeProgramsToFile(remaining);
      return;
    }
    await programsCollection.deleteMany({ languageId });
  },

  async deleteByUnitId(unitId) {
    if (!programsCollection) {
      const programs = await readProgramsFromFile();
      const remaining = programs.filter((program) => program.unitId !== unitId);
      if (remaining.length !== programs.length) await writeProgramsToFile(remaining);
      return;
    }
    await programsCollection.deleteMany({ unitId });
  },

  async deleteAll() {
    if (!programsCollection) return writeProgramsToFile([]);
    await programsCollection.deleteMany({});
  }
};
