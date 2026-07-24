import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PORT } from "./config/constants.js";
import { initStorage } from "./config/db.js";
import { userService } from "./services/userService.js";

import authRoutes from "./routes/authRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import programRoutes from "./routes/programRoutes.js";
import codeRunnerRoutes from "./routes/codeRunnerRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ready = initStorage()
  .catch((err) => {
    console.error("MongoDB connection failed, using JSON file storage.", err.message);
  })
  .then(() => userService.ensureAdmin())
  .catch((err) => {
    console.error("Failed to ensure admin user.", err.message);
  });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(async (_req, _res, next) => {
  await ready;
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

// Force-download any uploaded file (path traversal protected)
app.get("/api/download", (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ message: "Missing path" });

  const uploadsDir = path.resolve(__dirname, "uploads");
  const resolved = path.resolve(__dirname, decodeURIComponent(filePath));
  if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const filename = path.basename(resolved);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.sendFile(resolved, (err) => {
    if (err) res.status(404).json({ message: "File not found" });
  });
});

// API routes
app.use("/api", authRoutes);
app.use("/api", languageRoutes);
app.use("/api", unitRoutes);
app.use("/api", programRoutes);
app.use("/api", codeRunnerRoutes);

if (!process.env.VERCEL) {
  ready.finally(() => {
    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  });
}

export default app;
