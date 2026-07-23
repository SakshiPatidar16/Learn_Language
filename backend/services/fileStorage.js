import fs from "node:fs/promises";
import { DATA_FILE, USERS_FILE } from "../config/constants.js";

export async function readLanguagesFromFile() {
  const text = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(text);
}

export async function writeLanguagesToFile(items) {
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2) + "\n", "utf-8");
}

export async function readUsersFromFile() {
  const text = await fs.readFile(USERS_FILE, "utf-8");
  return JSON.parse(text);
}

export async function writeUsersToFile(items) {
  await fs.writeFile(USERS_FILE, JSON.stringify(items, null, 2) + "\n", "utf-8");
}
