import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const RUNNER_SOCKET_URL = getRunnerSocketUrl();

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

function getRunnerSocketUrl() {
  const apiUrl = new URL(API_BASE, window.location.origin);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}/run-code/live`;
  apiUrl.search = "";
  return apiUrl.toString();
}

export default function LanguageTerminal({ languageName, program }) {
  const terminalElementRef = useRef(null);
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const inputLineRef = useRef("");
  const [code, setCode] = useState(program.code);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const runtime = useMemo(() => resolveLanguage(languageName), [languageName]);
  const compiler = COMPILERS[runtime];

  useEffect(() => {
    setCode(program.code);
  }, [program.id, program.code]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      disableStdin: false,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 14,
      rows: 20,
      theme: { background: "#020617", foreground: "#e2e8f0" }
    });

    terminal.open(terminalElementRef.current);
    terminal.writeln(`Ready to run ${languageName || "program"}.`);
    terminal.writeln("Click Run, then type input when the program asks.");
    terminalRef.current = terminal;

    const disposable = terminal.onData((data) => {
      if (!isRunningRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      for (const char of data.replace(/\r\n/g, "\n").replace(/\r/g, "\n")) {
        if (char === "\n") {
          socketRef.current.send(JSON.stringify({ type: "input", data: `${inputLineRef.current}\n` }));
          inputLineRef.current = "";
          terminal.write("\r\n");
          continue;
        }

        if (char === "\u007F") {
          if (inputLineRef.current.length > 0) {
            inputLineRef.current = inputLineRef.current.slice(0, -1);
            terminal.write("\b \b");
          }
          continue;
        }

        if (char === "\u0003") {
          inputLineRef.current = "";
          socketRef.current.send(JSON.stringify({ type: "stop" }));
          terminal.write("^C\r\n");
          continue;
        }

        if (char >= " " && char !== "\u007F") {
          inputLineRef.current += char;
          terminal.write(char);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      disposable.dispose();
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
    inputLineRef.current = "";

    try {
      const socket = new WebSocket(RUNNER_SOCKET_URL);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "start", compiler, code }));
        terminal.focus();
      });

      socket.addEventListener("message", (event) => {
        let message;

        try {
          message = JSON.parse(event.data);
        } catch {
          terminal.writeln("\x1b[31mRunner sent an invalid response.\x1b[0m");
          return;
        }

        if (message.type === "output") {
          terminal.write(String(message.data).replace(/\n/g, "\r\n"));
          return;
        }

        if (message.type === "error") {
          terminal.write(`\x1b[31m${String(message.data).replace(/\n/g, "\r\n")}\x1b[0m`);
          return;
        }

        if (message.type === "exit") {
          if (message.code !== 0) {
            terminal.writeln(`\r\n\x1b[33mProcess exited with code ${message.code}.\x1b[0m`);
          }
          socket.close();
        }
      });

      socket.addEventListener("close", () => {
        socketRef.current = null;
        inputLineRef.current = "";
        setIsRunning(false);
      });

      socket.addEventListener("error", () => {
        terminal.writeln("\x1b[31mUnable to connect to the live code runner.\x1b[0m");
        socket.close();
      });
    } catch (error) {
      const message = error.message || "Unable to run this program.";
      terminal.writeln(`\x1b[31m${message}\x1b[0m`);
      terminal.writeln("\x1b[33mTroubleshooting:\x1b[0m");
      terminal.writeln("• Check the runner URL and network connection");
      terminal.writeln("• Verify the language name is correct");
      terminal.writeln("• Try again - the service may be temporarily unavailable");
      setIsRunning(false);
    }
  }

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <div>
          <p className="font-semibold text-white">{languageName} workspace</p>
          <p className="text-xs text-slate-400">Runtime: {compiler || runtime || "unknown"} (Server)</p>
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
            height="420px"
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
        </div>
        <div className="min-h-[420px] bg-slate-950 p-3">
          <div ref={terminalElementRef} className="h-[396px]" aria-label={`${languageName} terminal output`} />
        </div>
      </div>
    </div>
  );
}
