import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin123@yopmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const MONGODB_DB_NAME = (process.env.MONGODB_DB_NAME || "study_program").trim();
const MONGODB_COLLECTION = (process.env.MONGODB_COLLECTION || "languages").trim();
const MONGODB_USERS_COLLECTION = (process.env.MONGODB_USERS_COLLECTION || "users").trim();
const MONGODB_PROGRAMS_COLLECTION = (process.env.MONGODB_PROGRAMS_COLLECTION || "programs").trim();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "languages.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

let mongoClient = null;
let languagesCollection = null;
let usersCollection = null;
let programsCollection = null;

app.use(cors());
app.use(express.json());

function makeToken(email, role) {
  return Buffer.from(`${email}|${role}`).toString("base64url");
}

function decodeToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [email, role] = decoded.split("|");
    if (!email || !role) return null;
    return { email, role };
  } catch {
    return null;
  }
}

async function readLanguagesFromFile() {
  const text = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(text);
}

async function writeLanguagesToFile(items) {
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2) + "\n", "utf-8");
}

async function readUsersFromFile() {
  const text = await fs.readFile(USERS_FILE, "utf-8");
  return JSON.parse(text);
}

async function writeUsersToFile(items) {
  await fs.writeFile(USERS_FILE, JSON.stringify(items, null, 2) + "\n", "utf-8");
}

async function ensureAdminUser() {
  const adminUser = {
    id: "admin-1",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    updatedAt: new Date().toISOString()
  };

  if (usersCollection) {
    await usersCollection.updateOne(
      { email: ADMIN_EMAIL },
      { $set: adminUser },
      { upsert: true }
    );
    return;
  }

  let users = [];
  try {
    users = await readUsersFromFile();
  } catch {
    users = [];
  }

  const index = users.findIndex((it) => it.email === ADMIN_EMAIL);
  if (index === -1) {
    users.push(adminUser);
  } else {
    users[index] = {
      ...users[index],
      ...adminUser,
      updatedAt: new Date().toISOString()
    };
  }

  await writeUsersToFile(users);
}

async function findUserByEmail(email) {
  if (usersCollection) {
    const user = await usersCollection.findOne({ email });
    if (!user) return null;
    const { _id: _ignoredId, ...sanitized } = user;
    return sanitized;
  }

  const users = await readUsersFromFile();
  return users.find((it) => it.email === email) || null;
}

async function createUser({ name, email, phone, password, role = "user" }) {
  const user = {
    id: randomUUID(),
    name,
    email,
    phone,
    password,
    role,
    updatedAt: new Date().toISOString()
  };

  if (usersCollection) {
    await usersCollection.insertOne(user);
    const { _id: _ignoredId, ...sanitized } = user;
    return sanitized;
  }

  const users = await readUsersFromFile();
  users.push(user);
  await writeUsersToFile(users);
  return user;
}

async function initStorage() {
  if (!MONGODB_URI) {
    console.log("MONGODB_URI not found in .env, using JSON file storage.");
    return;
  }

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();

  const db = mongoClient.db(MONGODB_DB_NAME);
  languagesCollection = db.collection(MONGODB_COLLECTION);
  usersCollection = db.collection(MONGODB_USERS_COLLECTION);
  programsCollection = db.collection(MONGODB_PROGRAMS_COLLECTION);

  const count = await languagesCollection.countDocuments();
  if (count === 0) {
    const seedItems = await readLanguagesFromFile();
    if (seedItems.length > 0) {
      await languagesCollection.insertMany(seedItems);
    }
  }

  await ensureAdminUser();

  console.log(`Connected to MongoDB database: ${MONGODB_DB_NAME}`);
}

async function getLanguages() {
  if (!languagesCollection) {
    throw new Error("Database not connected");
  }

  return languagesCollection.find({}, { projection: { _id: 0 } }).toArray();
}

async function createLanguage({ name, description, email }) {
  if (!languagesCollection) {
    throw new Error("Database not connected");
  }

  const item = {
    id: randomUUID(),
    name,
    description,
    createdBy: email,
    updatedAt: new Date().toISOString()
  };

  await languagesCollection.insertOne(item);
  return item;
}

async function updateLanguageById(id, { name, description }) {
  if (!languagesCollection) {
    throw new Error("Database not connected");
  }

  const existing = await languagesCollection.findOne({ id });
  if (!existing) return null;

  const updated = {
    ...existing,
    name,
    description,
    updatedAt: new Date().toISOString()
  };

  await languagesCollection.replaceOne({ id }, updated);
  const { _id: _ignoredId, ...sanitized } = updated;
  return sanitized;
}

async function deleteLanguageById(id) {
  if (!languagesCollection) {
    throw new Error("Database not connected");
  }

  const existing = await languagesCollection.findOne({ id }, { projection: { _id: 0 } });
  if (!existing) return null;

  await languagesCollection.deleteOne({ id });

  if (programsCollection) {
    await programsCollection.deleteMany({ languageId: id });
  }

  return existing;
}

async function getProgramsByLanguageId(languageId) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

  return programsCollection
    .find({ languageId }, { projection: { _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
}

async function createProgram({ languageId, question, code, output, email }) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

  const program = {
    id: randomUUID(),
    languageId,
    question,
    code,
    output,
    createdBy: email,
    updatedAt: new Date().toISOString()
  };

  await programsCollection.insertOne(program);
  return program;
}

async function updateProgramById(programId, { question, code, output }) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

  const existing = await programsCollection.findOne({ id: programId });
  if (!existing) return null;

  const updated = {
    ...existing,
    question,
    code,
    output,
    updatedAt: new Date().toISOString()
  };

  await programsCollection.replaceOne({ id: programId }, updated);
  const { _id: _ignoredId, ...sanitized } = updated;
  return sanitized;
}

async function deleteProgramById(programId) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

  const existing = await programsCollection.findOne({ id: programId }, { projection: { _id: 0 } });
  if (!existing) return null;

  await programsCollection.deleteOne({ id: programId });
  return existing;
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = decodeToken(token);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
    storage: languagesCollection ? "mongodb" : "not-connected"
  });
});

app.get("/api/public/languages", async (_req, res) => {
  try {
    const items = await getLanguages();
    res.json(items);
  } catch {
    res.status(500).json({ message: "Failed to load languages. Database is required." });
  }
});

app.get("/api/public/languages/:languageId/programs", async (req, res) => {
  try {
    const languageId = (req.params.languageId || "").trim();
    if (!languageId) {
      return res.status(400).json({ message: "Language id is required" });
    }

    const programs = await getProgramsByLanguageId(languageId);
    res.json(programs);
  } catch {
    res.status(500).json({ message: "Failed to load programs. Database is required." });
  }
});

app.post("/api/signup", async (req, res) => {
  const name = (req.body?.name || "").trim();
  const email = (req.body?.email || "").trim().toLowerCase();
  const phone = (req.body?.phone || "").trim();
  const password = req.body?.password || "";

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (email === ADMIN_EMAIL) {
    return res.status(403).json({ message: "This email is reserved for admin" });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await createUser({ name, email, phone, password, role: "user" });
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch {
    return res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/login", (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  findUserByEmail(email)
    .then(async (dbUser) => {
      if (!dbUser && email === ADMIN_EMAIL) {
        await ensureAdminUser();
      }

      const user = dbUser || (await findUserByEmail(email));

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const role = user.role || "user";
      const token = makeToken(email, role);

      return res.json({
        token,
        email,
        role,
        adminEmail: ADMIN_EMAIL
      });
    })
    .catch(() => {
      res.status(500).json({ message: "Login failed" });
    });
});

app.get("/api/languages", auth, async (_req, res) => {
  try {
    const items = await getLanguages();
    res.json(items);
  } catch {
    res.status(500).json({ message: "Failed to load languages. Database is required." });
  }
});

app.post("/api/languages", auth, adminOnly, async (req, res) => {
  const name = (req.body?.name || "").trim();
  const description = (req.body?.description || "").trim();

  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }

  try {
    const item = await createLanguage({
      name,
      description,
      email: ADMIN_EMAIL
    });

    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: "Failed to create language. Database is required." });
  }
});

app.post("/api/languages/:languageId/programs", auth, adminOnly, async (req, res) => {
  const languageId = (req.params.languageId || "").trim();
  const question = (req.body?.question || "").trim();
  const code = (req.body?.code || "").trim();
  const output = (req.body?.output || "").trim();

  if (!languageId) {
    return res.status(400).json({ message: "Language id is required" });
  }

  if (!question || !code || !output) {
    return res.status(400).json({ message: "Question, code and output are required" });
  }

  try {
    const language = await languagesCollection.findOne({ id: languageId }, { projection: { _id: 0 } });
    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    const program = await createProgram({
      languageId,
      question,
      code,
      output,
      email: ADMIN_EMAIL
    });

    res.status(201).json(program);
  } catch {
    res.status(500).json({ message: "Failed to create program. Database is required." });
  }
});

app.put("/api/programs/:programId", auth, adminOnly, async (req, res) => {
  const programId = (req.params.programId || "").trim();
  const question = (req.body?.question || "").trim();
  const code = (req.body?.code || "").trim();
  const output = (req.body?.output || "").trim();

  if (!programId) {
    return res.status(400).json({ message: "Program id is required" });
  }

  if (!question || !code || !output) {
    return res.status(400).json({ message: "Question, code and output are required" });
  }

  try {
    const updated = await updateProgramById(programId, { question, code, output });
    if (!updated) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update program. Database is required." });
  }
});

app.delete("/api/programs/:programId", auth, adminOnly, async (req, res) => {
  const programId = (req.params.programId || "").trim();

  if (!programId) {
    return res.status(400).json({ message: "Program id is required" });
  }

  try {
    const deleted = await deleteProgramById(programId);
    if (!deleted) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.json({ message: "Deleted successfully", deleted });
  } catch {
    res.status(500).json({ message: "Failed to delete program. Database is required." });
  }
});

app.put("/api/languages/:id", auth, adminOnly, async (req, res) => {
  const name = (req.body?.name || "").trim();
  const description = (req.body?.description || "").trim();

  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }

  try {
    const updated = await updateLanguageById(req.params.id, { name, description });

    if (!updated) {
      return res.status(404).json({ message: "Language not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update language. Database is required." });
  }
});

app.delete("/api/languages/:id", auth, adminOnly, async (req, res) => {
  try {
    const deleted = await deleteLanguageById(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Language not found" });
    }

    res.json({ message: "Deleted successfully", deleted });
  } catch {
    res.status(500).json({ message: "Failed to delete language. Database is required." });
  }
});

initStorage()
  .catch((err) => {
    console.error("MongoDB connection failed, using JSON file storage.", err.message);
    languagesCollection = null;
    usersCollection = null;
    programsCollection = null;
  })
  .finally(() => {
    ensureAdminUser().catch((err) => {
      console.error("Failed to ensure admin user.", err.message);
    });

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
      console.log(`Admin email: ${ADMIN_EMAIL}`);
    });
  });
