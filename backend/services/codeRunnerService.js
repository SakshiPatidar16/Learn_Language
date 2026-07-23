import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";

const SUPPORTED_LANGUAGES = new Set([
  "java", "python", "javascript", "cpp", "c", "ruby"
]);

async function runLocally(code, language, stdin = "") {
  return new Promise(async (resolve) => {
    if (!SUPPORTED_LANGUAGES.has(language)) {
      return resolve({
        program_output: "",
        compiler_error: `Language "${language}" is not supported for local execution.`
      });
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coderun-"));
    const cleanup = () => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    try {
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
        runArgs = ["python3", [srcFile]];
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

      if (compileCmd) {
        const compileResult = await new Promise((res) => {
          exec(compileCmd, { timeout: 15000 }, (error, stdout, stderr) => {
            res({ error, stdout, stderr });
          });
        });
        if (compileResult.error) {
          await cleanup();
          return resolve({
            program_output: "",
            compiler_error: compileResult.stderr || compileResult.error.message,
            exit_code: compileResult.error.code ?? 1
          });
        }
      }

      const { spawn } = await import("node:child_process");
      const child = spawn(runArgs[0], runArgs[1], { timeout: 15000 });

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
      await cleanup();
      resolve({ program_output: "", compiler_error: err.message });
    }
  });
}

export const codeRunnerService = { runLocally };
