import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

import { PORT } from "./config/constants.js";
import { initStorage } from "./config/db.js";
import { userService } from "./services/userService.js";
import { codeRunnerService } from "./services/codeRunnerService.js";

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

const corsOptions = {
  origin: [
    "https://learn-language-frontend.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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

function setupCodeRunnerSocket(server) {
  const wss = new WebSocketServer({ server, path: "/api/run-code/live" });

  wss.on("connection", (socket) => {
    let session = null;

    socket.on("message", async (rawMessage) => {
      let message;

      try {
        message = JSON.parse(rawMessage.toString());
      } catch {
        socket.send(JSON.stringify({ type: "error", data: "Invalid runner message." }));
        return;
      }

      if (message.type === "start") {
        if (session) session.kill();

        const { compiler, code } = message;
        if (!compiler || !code) {
          socket.send(JSON.stringify({ type: "error", data: "Compiler and code are required." }));
          socket.send(JSON.stringify({ type: "exit", code: 1 }));
          return;
        }

        session = await codeRunnerService.runInteractive({
          code,
          language: compiler,
          onOutput(data) {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: "output", data }));
            }
          },
          onError(data) {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: "error", data }));
            }
          },
          onExit(code) {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: "exit", code }));
            }
            session = null;
          }
        });
        return;
      }

      if (message.type === "input" && session) {
        session.write(message.data || "");
        return;
      }

      if (message.type === "stop" && session) {
        session.kill();
        session = null;
      }
    });

    socket.on("close", () => {
      if (session) session.kill();
    });
  });
}

if (!process.env.VERCEL) {
  ready.finally(() => {
    const server = app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
    setupCodeRunnerSocket(server);
  });
}

export default app;
