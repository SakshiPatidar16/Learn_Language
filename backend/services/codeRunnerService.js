import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { exec, spawn } from "node:child_process";

const SUPPORTED_LANGUAGES = new Set([
  "java", "python", "javascript", "cpp", "c", "ruby"
]);

async function prepareRun(code, language) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error(`Language "${language}" is not supported for local execution.`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coderun-"));

  let compileCmd = null;
  let runArgs;

  if (language === "java") {
    const match = code.match(/(?:public\s+)?class\s+(\w+)/);
    const className = match ? match[1] : "Main";
    const srcFile = path.join(tmpDir, `${className}.java`);
    await fs.writeFile(srcFile, code);
    compileCmd = `javac "${srcFile}" -d "${tmpDir}"`;
    runArgs = ["java", ["-cp", tmpDir, className]];
  } else if (language === "python") {
    const srcFile = path.join(tmpDir, "main.py");
    await fs.writeFile(srcFile, code);
    runArgs = ["python3", ["-u", srcFile]];
  } else if (language === "javascript") {
    const srcFile = path.join(tmpDir, "main.js");
    await fs.writeFile(srcFile, code);
    runArgs = ["node", [srcFile]];
  } else if (language === "cpp") {
    const srcFile = path.join(tmpDir, "main.cpp");
    const outFile = path.join(tmpDir, "main");
    await fs.writeFile(srcFile, code);
    compileCmd = `g++ -o "${outFile}" "${srcFile}"`;
    runArgs = [outFile, []];
  } else if (language === "c") {
    const srcFile = path.join(tmpDir, "main.c");
    const outFile = path.join(tmpDir, "main");
    await fs.writeFile(srcFile, code);
    compileCmd = `gcc -o "${outFile}" "${srcFile}"`;
    runArgs = [outFile, []];
  } else if (language === "ruby") {
    const srcFile = path.join(tmpDir, "main.rb");
    await fs.writeFile(srcFile, code);
    runArgs = ["ruby", [srcFile]];
  }

  return { tmpDir, compileCmd, runArgs };
}

function compileSource(compileCmd) {
  if (!compileCmd) return Promise.resolve({ error: null, stdout: "", stderr: "" });

  return new Promise((res) => {
    exec(compileCmd, { timeout: 15000 }, (error, stdout, stderr) => {
      res({ error, stdout, stderr });
    });
  });
}

async function runLocally(code, language, stdin = "") {
  return new Promise(async (resolve) => {
    let tmpDir;
    const cleanup = () => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    try {
      const prepared = await prepareRun(code, language);
      tmpDir = prepared.tmpDir;

      const compileResult = await compileSource(prepared.compileCmd);
      if (compileResult.error) {
        await cleanup();
        return resolve({
          program_output: "",
          compiler_error: compileResult.stderr || compileResult.error.message,
          exit_code: compileResult.error.code ?? 1
        });
      }

      const child = spawn(prepared.runArgs[0], prepared.runArgs[1], { timeout: 15000 });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

      child.on("close", async (code) => {
        await cleanup();
        resolve({
          program_output: stdout || "",
          program_error: stderr && stdout ? stderr : "",
          compiler_error: stderr && !stdout ? stderr : "",
          exit_code: code ?? 0
        });
      });

      child.on("error", async (err) => {
        await cleanup();
        resolve({ program_output: "", compiler_error: err.message });
      });

      if (stdin) child.stdin.write(stdin);
      child.stdin.end();
    } catch (err) {
      if (tmpDir) await cleanup();
      resolve({ program_output: "", compiler_error: err.message });
    }
  });
}

async function runInteractive({ code, language, onOutput, onError, onExit }) {
  let tmpDir;
  let child = null;
  let timeout = null;
  const cleanup = () => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  try {
    const prepared = await prepareRun(code, language);
    tmpDir = prepared.tmpDir;

    const compileResult = await compileSource(prepared.compileCmd);
    if (compileResult.stdout) onOutput(compileResult.stdout);
    if (compileResult.error) {
      onError(compileResult.stderr || compileResult.error.message);
      await cleanup();
      onExit(compileResult.error.code ?? 1);
      return { write() {}, kill() {} };
    }

    child = spawn(prepared.runArgs[0], prepared.runArgs[1], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1"
      }
    });

    timeout = setTimeout(() => {
      if (!child.killed) child.kill("SIGKILL");
    }, 30000);

    child.stdout.on("data", (chunk) => onOutput(chunk.toString()));
    child.stderr.on("data", (chunk) => onError(chunk.toString()));
    child.on("error", async (err) => {
      clearTimeout(timeout);
      await cleanup();
      onError(err.message);
      onExit(1);
    });
    child.on("close", async (code) => {
      clearTimeout(timeout);
      await cleanup();
      onExit(code ?? 0);
    });

    return {
      write(input) {
        if (child && !child.killed && child.stdin.writable) {
          child.stdin.write(input);
        }
      },
      kill() {
        if (child && !child.killed) child.kill("SIGKILL");
      }
    };
  } catch (err) {
    if (timeout) clearTimeout(timeout);
    if (tmpDir) await cleanup();
    onError(err.message);
    onExit(1);
    return { write() {}, kill() {} };
  }
}

export const codeRunnerService = { runLocally, runInteractive };
