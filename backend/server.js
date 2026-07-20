import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import multer from "multer";

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin123@yopmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const MONGODB_DB_NAME = (process.env.MONGODB_DB_NAME || "study_program").trim();
const MONGODB_COLLECTION = (process.env.MONGODB_COLLECTION || "languages").trim();
const MONGODB_USERS_COLLECTION = (process.env.MONGODB_USERS_COLLECTION || "users").trim();
const MONGODB_PROGRAMS_COLLECTION = (process.env.MONGODB_PROGRAMS_COLLECTION || "programs").trim();
const MONGODB_UNITS_COLLECTION = (process.env.MONGODB_UNITS_COLLECTION || "units").trim();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "languages.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

let mongoClient = null;
let languagesCollection = null;
let usersCollection = null;
let programsCollection = null;
let unitsCollection = null;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
  unitsCollection = db.collection(MONGODB_UNITS_COLLECTION);

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

  if (unitsCollection) {
    await unitsCollection.deleteMany({ languageId: id });
  }

  return existing;
}

async function getUnitsByLanguageId(languageId) {
  if (!unitsCollection) {
    throw new Error("Database not connected");
  }

  return unitsCollection
    .find({ languageId }, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .toArray();
}

async function createUnit({ languageId, name, notes, pdfPath, wordPath, email }) {
  if (!unitsCollection) {
    throw new Error("Database not connected");
  }

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
}

async function updateUnitById(unitId, { name, notes, files }) {
  if (!unitsCollection) {
    throw new Error("Database not connected");
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
}

async function addFileToUnit(unitId, { name, description, path, type }) {
  if (!unitsCollection) {
    throw new Error("Database not connected");
  }

  const existing = await unitsCollection.findOne({ id: unitId });
  if (!existing) return null;

  const files = existing.files || [];
  const newFile = { id: randomUUID(), name, description, path, type };
  files.push(newFile);

  await unitsCollection.updateOne(
    { id: unitId },
    { $set: { files, updatedAt: new Date().toISOString() } }
  );

  return newFile;
}

async function deleteUnitById(unitId) {
  if (!unitsCollection) {
    throw new Error("Database not connected");
  }

  const existing = await unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
  if (!existing) return null;

  await unitsCollection.deleteOne({ id: unitId });

  if (programsCollection) {
    await programsCollection.deleteMany({ unitId });
  }

  return existing;
}

async function getProgramsByUnitId(unitId) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

  return programsCollection
    .find({ unitId }, { projection: { _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
}

async function createProgram({ languageId, unitId, question, code, output, email }) {
  if (!programsCollection) {
    throw new Error("Database not connected");
  }

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

app.get("/api/public/languages/:languageId/units", async (req, res) => {
  try {
    const languageId = (req.params.languageId || "").trim();
    if (!languageId) {
      return res.status(400).json({ message: "Language id is required" });
    }

    const units = await getUnitsByLanguageId(languageId);
    res.json(units);
  } catch {
    res.status(500).json({ message: "Failed to load units. Database is required." });
  }
});

app.get("/api/public/units/:unitId/programs", async (req, res) => {
  try {
    const unitId = (req.params.unitId || "").trim();
    if (!unitId) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    const programs = await getProgramsByUnitId(unitId);
    res.json(programs);
  } catch {
    res.status(500).json({ message: "Failed to load programs. Database is required." });
  }
});

app.post("/api/languages/:languageId/units", auth, adminOnly, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'word', maxCount: 1 }]), async (req, res) => {
  const languageId = (req.params.languageId || "").trim();
  const name = (req.body?.name || "").trim();
  const notes = (req.body?.notes || "").trim();

  if (!languageId) {
    return res.status(400).json({ message: "Language id is required" });
  }

  if (!name) {
    return res.status(400).json({ message: "Unit name is required" });
  }

  const pdfPath = req.files?.["pdf"]?.[0]?.path;
  const wordPath = req.files?.["word"]?.[0]?.path;

  try {
    const unit = await createUnit({
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
});

app.put("/api/units/:unitId", auth, adminOnly, async (req, res) => {
  const unitId = (req.params.unitId || "").trim();
  const name = (req.body?.name || "").trim();
  const notes = (req.body?.notes || "").trim();

  if (!unitId) {
    return res.status(400).json({ message: "Unit id is required" });
  }

  if (!name) {
    return res.status(400).json({ message: "Unit name is required" });
  }

  try {
    const updated = await updateUnitById(unitId, {
      name,
      notes
    });

    if (!updated) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update unit. Database is required." });
  }
});

app.post("/api/units/:unitId/files", auth, adminOnly, upload.single("file"), async (req, res) => {
  const unitId = (req.params.unitId || "").trim();
  if (!unitId) return res.status(400).json({ message: "Unit id is required" });
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const type = req.file.mimetype === "application/pdf" ? "pdf" : "word";
  const name = req.body?.name || req.file.originalname;
  const description = req.body?.description || "";

  try {
    const newFile = await addFileToUnit(unitId, {
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
});

app.delete("/api/units/:unitId/files/:fileId", auth, adminOnly, async (req, res) => {
  const { unitId, fileId } = req.params;

  try {
    if (!unitsCollection) return res.status(500).json({ message: "Database not connected" });
    
    const unit = await unitsCollection.findOne({ id: unitId });
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const files = (unit.files || []).filter(f => f.id !== fileId);
    await unitsCollection.updateOne({ id: unitId }, { $set: { files } });
    
    res.json({ message: "File removed successfully" });
  } catch {
    res.status(500).json({ message: "Failed to remove file" });
  }
});

app.delete("/api/units/:unitId", auth, adminOnly, async (req, res) => {
  const unitId = (req.params.unitId || "").trim();

  if (!unitId) {
    return res.status(400).json({ message: "Unit id is required" });
  }

  try {
    const deleted = await deleteUnitById(unitId);
    if (!deleted) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json({ message: "Unit and its programs deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete unit. Database is required." });
  }
});

app.delete("/api/cleanup/programs", auth, adminOnly, async (_req, res) => {
  try {
    if (!programsCollection) {
      return res.status(500).json({ message: "Database not connected" });
    }
    await programsCollection.deleteMany({});
    res.json({ message: "All programs deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to clear programs" });
  }
});

app.post("/api/units/:unitId/programs", auth, adminOnly, async (req, res) => {
  const unitId = (req.params.unitId || "").trim();
  const question = (req.body?.question || "").trim();
  const code = (req.body?.code || "").trim();
  const output = (req.body?.output || "").trim();

  if (!unitId) {
    return res.status(400).json({ message: "Unit id is required" });
  }

  if (!question || !code || !output) {
    return res.status(400).json({ message: "Question, code and output are required" });
  }

  try {
    const unit = await unitsCollection.findOne({ id: unitId }, { projection: { _id: 0 } });
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = await createProgram({
      languageId: unit.languageId,
      unitId,
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
    });
  });
