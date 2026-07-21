import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const RUNNER_URL = `${API_BASE}/run-code`;

const LANGUAGE_ALIASES = {
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  "c#": "csharp",
  csharp: "csharp",
  go: "go",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  kotlin: "kotlin",
  php: "php",
  python: "python",
  python3: "python",
  ruby: "ruby",
  rust: "rust",
  swift: "swift",
  typescript: "typescript",
  ts: "typescript"
};

const COMPILERS = {
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  java: "java",
  javascript: "javascript",
  kotlin: "kotlin",
  php: "php",
  python: "python",
  ruby: "ruby",
  rust: "rust",
  swift: "swift",
  typescript: "typescript"
};

function resolveLanguage(name = "") {
  return LANGUAGE_ALIASES[name.trim().toLowerCase()] || name.trim().toLowerCase();
}

function prepareCodeForRunner(source, runtime) {
  if (runtime !== "java") return source;

  // Wandbox stores the submitted source as prog.java. Java requires a public
  // top-level type to have the same filename, so keep the learner's class name
  // and make that type package-private only in the submitted copy.
  return source.replace(
    /\bpublic\s+(?=(?:(?:abstract|final|sealed|non-sealed|strictfp)\s+)*(?:class|interface|enum|record)\s+)/,
    ""
  );
}

export default function LanguageTerminal({ languageName, program }) {
  const terminalElementRef = useRef(null);
  const terminalRef = useRef(null);
  const [code, setCode] = useState(program.code);
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const runtime = useMemo(() => resolveLanguage(languageName), [languageName]);
  const compiler = COMPILERS[runtime];

  useEffect(() => {
    setCode(program.code);
  }, [program.id, program.code]);

  useEffect(() => {
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      disableStdin: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 14,
      rows: 20,
      theme: { background: "#020617", foreground: "#e2e8f0" }
    });

    terminal.open(terminalElementRef.current);
    terminal.writeln(`Ready to run ${languageName || "program"}.`);
    terminalRef.current = terminal;

    return () => {
      terminalRef.current = null;
      terminal.dispose();
    };
  }, [languageName]);

  async function runCode() {
    const terminal = terminalRef.current;
    if (!terminal || isRunning) return;

    terminal.clear();
    terminal.writeln(`\x1b[36m$ Running ${languageName}...\x1b[0m`);

    if (!compiler) {
      terminal.writeln(`\x1b[31mNo runner is configured for “${languageName}”.\x1b[0m`);
      terminal.writeln("Add its Wandbox compiler ID to COMPILERS in LanguageTerminal.jsx.");
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch(RUNNER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler,
          code,
          stdin
        })
      });

      let result;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        terminal.writeln(`\x1b[31mRunner returned non-JSON response:\x1b[0m`);
        terminal.write(text.replace(/\n/g, "\r\n"));
        setIsRunning(false);
        return;
      }

      if (!response.ok) {
        const errorMsg = result.message || result.error || "The code runner rejected this request.";
        const hint = result.hint || result.details || "";
        throw new Error(`${errorMsg}${hint ? "\n" + hint : ""}`);
      }

      if (result.compiler_error && !result.program_output && !result.program_error && !result.compiler_message) {
        terminal.writeln(`\x1b[31m${result.compiler_error}\x1b[0m`);
        setIsRunning(false);
        return;
      }

      const output = [...new Set([
        result.compiler_error,
        result.compiler_message,
        result.program_error,
        result.program_output
      ].filter(Boolean))]
        .join("\n") || "Program finished with no output.";
      terminal.write(output.replace(/\n/g, "\r\n"));

      if (!output.endsWith("\n")) {
        terminal.writeln("");
      }
    } catch (error) {
      const message = error.message || "Unable to run this program.";
      terminal.writeln(`\x1b[31m${message}\x1b[0m`);
      terminal.writeln("\x1b[33mTroubleshooting:\x1b[0m");
      terminal.writeln("• Check the runner URL and network connection");
      terminal.writeln("• Verify the language name is correct");
      terminal.writeln("• Try again - the service may be temporarily unavailable");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <div>
          <p className="font-semibold text-white">{languageName} workspace</p>
          <p className="text-xs text-slate-400">Runtime: {compiler || runtime || "unknown"} (Piston)</p>
        </div>
        <button
          type="button"
          onClick={runCode}
          disabled={isRunning}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isRunning ? "Running..." : `Run ${languageName || "Program"}`}
        </button>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="flex min-h-[420px] flex-col border-b border-slate-700 lg:border-b-0 lg:border-r">
          <Editor
            height="300px"
            language={runtime}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
          <div className="border-t border-slate-700 bg-slate-900 p-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Standard Input (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Provide program input here (one value per line)..."
              rows={4}
              className="w-full resize-none rounded bg-slate-950 p-2 font-mono text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="min-h-[420px] bg-slate-950 p-3">
          <div ref={terminalElementRef} className="h-[396px]" aria-label={`${languageName} terminal output`} />
        </div>
      </div>
    </div>
  );
}
