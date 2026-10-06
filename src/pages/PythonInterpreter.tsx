import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  ArrowLeft,
  Loader2,
  Clock,
  Trash2,
  Plus,
  FileCode,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Save,
  Columns,
  Rows,
  ExternalLink,
  RefreshCw,
  HardDrive,
  Search,
  RotateCcw,
} from "lucide-react";
import { sfxClick, sfxSuccess } from "../lib/sound";
import {
  getAllProjectNodes,
  createProjectFolder,
  createProjectFile,
  updateProjectFileContent,
  type ProjectNode,
} from "../lib/projectFileSystem";
import { highlightPythonCode } from "../lib/pythonSyntax";

export type ProgramItem = {
  id: string;
  name: string;
  desc: string;
  code: string;
  projectNodeId?: string;
  projectPath?: string;
};

const INITIAL_PROGRAM: ProgramItem = {
  id: "main_program",
  name: "main.py",
  desc: "Interactive Python Module",
  code: `# Python Interactive Environment
# Write code here, then run or test interactively in the shell below

def greet(name="Explorer"):
    return f"👋 Welcome to Python Interactive IDLE, {name}!"

# Demonstration
print(greet())

numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print("Numbers:", numbers)
print("Squares:", squares)

# Try typing 'greet("YourName")' or 'numbers' directly in the >>> prompt on the right!
`,
};

type InteractiveEntry = {
  id: string;
  type: "system" | "run" | "cmd";
  title?: string;
  cmd?: string;
  output?: string;
  error?: string;
  timeMs?: number;
};

// Global Pyodide loader
let globalPyodidePromise: Promise<any> | null = null;

async function loadPyodideEngine() {
  if (globalPyodidePromise) return globalPyodidePromise;

  globalPyodidePromise = (async () => {
    try {
      if (!(window as any).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.getElementById("pyodide-wasm-script");
          if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", (e) => reject(e));
            return;
          }
          const script = document.createElement("script");
          script.id = "pyodide-wasm-script";
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (e) => reject(new Error("Failed to load Pyodide WASM from CDN: " + String(e)));
          document.head.appendChild(script);
        });
      }

      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        stdin: () => null,
      });

      if (typeof pyodide.setStdin === "function") {
        try {
          pyodide.setStdin({
            stdin: () => null,
            error: false,
          });
        } catch {
          // Ignore
        }
      }

      // Initialize persistent interactive execution namespace with safe non-blocking standard streams
      await pyodide.runPythonAsync(`
import sys as _sys, io as _io, traceback as _traceback, builtins as _builtins, json as _json

class _SafeNullStdin(_io.StringIO):
    def readline(self, size=-1):
        return ""
    def read(self, size=-1):
        return ""
    def isatty(self):
        return False

_sys.stdin = _SafeNullStdin()

def _safe_input_fn(prompt=""):
    if prompt:
        _sys.stdout.write(str(prompt))
        _sys.stdout.flush()
    return ""

_builtins.input = _safe_input_fn

if "_idle_env" not in globals():
    _idle_env = {
        "__name__": "__main__",
        "__doc__": None,
        "__builtins__": _builtins,
        "input": _safe_input_fn,
    }
else:
    _idle_env["input"] = _safe_input_fn
    _idle_env["__builtins__"] = _builtins
`);

      return pyodide;
    } catch (err) {
      globalPyodidePromise = null;
      throw err;
    }
  })();

  return globalPyodidePromise;
}

export function PythonInterpreter() {
  const location = useLocation();

  // Active Code & Program State
  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("vk_python_active_code");
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return INITIAL_PROGRAM.code;
  });
  const [activeProgramName, setActiveProgramName] = useState<string>("main.py");
  const [activeProjectNode, setActiveProjectNode] = useState<ProjectNode | null>(null);

  // GitHub-style Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "/": true,
    "/Python-Interpreter": true,
    "/CBSE-Class-12-CS": true,
    "/8Ball-Pool": true,
  });

  // Projects Filesystem State
  const [projectNodes, setProjectNodes] = useState<ProjectNode[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Layout State (Split vs Stacked)
  const [layoutMode, setLayoutMode] = useState<"split" | "stacked">("split");

  // Pyodide State
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

  // Interactive Console History & Input
  const [history, setHistory] = useState<InteractiveEntry[]>([
    {
      id: "welcome",
      type: "system",
      title: "Python 3.12 (CPython WASM) Interactive Shell",
      output:
        "Type Python code or run modules. Variables and functions persist interactively across runs.\nUse >>> prompt below to execute expressions (e.g. dir(), 2**10, help()).",
    },
  ]);
  const [replInput, setReplInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newTargetFolder, setNewTargetFolder] = useState("/");
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Feedback
  const [copied, setCopied] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  // DOM Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Pyodide
  useEffect(() => {
    let isMounted = true;
    loadPyodideEngine()
      .then((py) => {
        if (!isMounted) return;
        pyodideRef.current = py;
        setPyodideReady(true);
        setPyodideLoading(false);
      })
      .catch((err) => {
        console.warn("Pyodide error:", err);
        if (isMounted) setPyodideLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Projects Filesystem Nodes
  const loadProjectsData = async () => {
    setIsLoadingProjects(true);
    try {
      const nodes = await getAllProjectNodes();
      setProjectNodes(nodes);
    } catch {
      // Ignore
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjectsData();
  }, []);

  // 3. Handle Navigation state (e.g., from Projects page "Run" button)
  useEffect(() => {
    if (location.state && typeof location.state === "object") {
      const st = location.state as {
        loadCode?: string;
        fileName?: string;
        autoRun?: boolean;
        projectNodeId?: string;
        projectPath?: string;
      };
      if (typeof st.loadCode === "string") {
        setCode(st.loadCode);
        if (st.fileName) setActiveProgramName(st.fileName);
        if (st.projectNodeId) {
          setActiveProjectNode({
            id: st.projectNodeId,
            name: st.fileName || "script.py",
            path: st.projectPath || "/" + (st.fileName || "script.py"),
            parent_path: "/",
            type: "file",
            content: st.loadCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        if (st.autoRun) {
          setTimeout(() => {
            executePython(st.loadCode!, st.fileName || "script.py");
          }, 350);
        }
      }
    }
  }, [location.state]);

  // Code change & local persistence
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    try {
      localStorage.setItem("vk_python_active_code", newCode);
    } catch {
      // Ignore
    }
  };

  // Synchronize textarea scrolling with syntax highlight and line numbers gutter
  const handleEditorScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (gutterRef.current) gutterRef.current.scrollTop = top;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = top;
        highlightRef.current.scrollLeft = left;
      }
    }
  };

  // Colorful code highlight HTML
  const highlightedCodeHtml = useMemo(() => {
    return highlightPythonCode(code);
  }, [code]);

  const codeLineCount = useMemo(() => Math.max(1, code.split("\n").length), [code]);

  // Execute full Python module into the interactive environment
  const executePython = async (scriptToRun: string, scriptTitle?: string) => {
    if (isRunning) return;
    sfxClick();
    setIsRunning(true);
    const title = scriptTitle || activeProgramName || "main.py";
    const startTime = performance.now();

    try {
      let py = pyodideRef.current;
      if (!py) {
        py = await loadPyodideEngine();
        pyodideRef.current = py;
        setPyodideReady(true);
        setPyodideLoading(false);
      }

      py.globals.set("__user_source__", scriptToRun);
      py.globals.set("__user_filename__", title);

      const runnerCode = `
import sys as _sys, io as _io, traceback as _traceback, builtins as _builtins, json as _json, gc as _gc

# 1. Enforce safe recursion limit to prevent WASM call stack overflow
_sys.setrecursionlimit(500)

# 2. Reclaim memory before execution
_gc.collect()

# 3. Memory-capped output buffer (prevents OOM from large or infinite print loops)
class _CappedStringIO(_io.StringIO):
    def __init__(self, max_chars=80000):
        super().__init__()
        self._max = max_chars
        self._truncated = False

    def write(self, s):
        if self._truncated:
            return len(s)
        curr_len = self.tell()
        if curr_len + len(s) > self._max:
            allowed = max(0, self._max - curr_len)
            if allowed > 0:
                super().write(s[:allowed])
            super().write("\\n⚠️ [Output truncated: 80KB limit reached to prevent memory exhaustion]\\n")
            self._truncated = True
            return len(s)
        return super().write(s)

_out = _CappedStringIO()
_err = _CappedStringIO()
_old_out = _sys.stdout
_old_err = _sys.stderr
_old_in = _sys.stdin

_sys.stdout = _out
_sys.stderr = _err

class _RunnerSafeStdin(_io.StringIO):
    def readline(self, size=-1):
        return ""
    def read(self, size=-1):
        return ""
    def isatty(self):
        return False

_sys.stdin = _RunnerSafeStdin()

def _safe_input_runner(prompt=""):
    if prompt:
        _out.write(str(prompt))
    return ""

_orig_input = _builtins.input
_builtins.input = _safe_input_runner

# 4. Clean module restart: reset _idle_env for the new module execution to prevent memory accumulation
_idle_env.clear()
_idle_env.update({
    "__name__": "__main__",
    "__doc__": None,
    "__builtins__": _builtins,
    "__file__": __user_filename__,
    "input": _safe_input_runner,
})

_has_error = False

try:
    _compiled = compile(__user_source__, __user_filename__, "exec")
    exec(_compiled, _idle_env)
except SystemExit:
    pass
except MemoryError:
    _has_error = True
    _err.write("MemoryError: Python memory limit exceeded. Try reducing array sizes or loop depth.\\n")
    _gc.collect()
except RecursionError:
    _has_error = True
    _err.write("RecursionError: Maximum recursion depth (500) exceeded.\\n")
except BaseException:
    _has_error = True
    _traceback.print_exc(file=_err)
finally:
    _sys.stdout = _old_out
    _sys.stderr = _old_err
    _sys.stdin = _old_in
    _builtins.input = _orig_input
    _idle_env["input"] = _safe_input_runner
    _gc.collect()

_json.dumps({
    "out": _out.getvalue(),
    "err": _err.getvalue() if _has_error else "",
    "has_error": _has_error
})
`;

      const rawJson = await py.runPythonAsync(runnerCode);
      let capturedOut = "";
      let capturedErr = "";
      let hasError = false;

      try {
        const parsed = JSON.parse(rawJson);
        capturedOut = String(parsed.out || "");
        capturedErr = String(parsed.err || "");
        hasError = Boolean(parsed.has_error);
      } catch {
        capturedOut = String(rawJson || "");
      }

      const elapsed = Math.round(performance.now() - startTime);

      setHistory((prev) => [
        ...prev,
        {
          id: `run_${Date.now()}`,
          type: "run",
          title,
          output: capturedOut || (!hasError ? ">>> Program completed with return code 0." : ""),
          error: capturedErr,
          timeMs: elapsed,
        },
      ]);
      sfxSuccess();
    } catch (err: any) {
      const errStr = String(err);
      const isMemErr =
        errStr.includes("out of memory") ||
        errStr.includes("MemoryError") ||
        errStr.includes("memory access out of bounds") ||
        errStr.includes("call stack size exceeded");

      if (isMemErr) {
        // Recycle the Pyodide instance to cleanly restore WASM memory
        pyodideRef.current = null;
        globalPyodidePromise = null;
        setPyodideReady(false);
        setPyodideLoading(true);

        setHistory((prev) => [
          ...prev,
          {
            id: `run_err_${Date.now()}`,
            type: "run",
            title,
            error:
              "⚠️ Memory Limit Exceeded: WebAssembly heap was exhausted during execution.\n" +
              "The Python execution engine has been automatically recycled to free memory for your next run.\n\n" +
              "Traceback (most recent call last):\nMemoryError: Out of memory",
          },
        ]);

        // Re-initialize a clean Pyodide engine in background
        loadPyodideEngine()
          .then((py) => {
            pyodideRef.current = py;
            setPyodideReady(true);
            setPyodideLoading(false);
          })
          .catch(() => {
            setPyodideLoading(false);
          });
      } else {
        setHistory((prev) => [
          ...prev,
          {
            id: `run_err_${Date.now()}`,
            type: "run",
            title,
            error: `Traceback (most recent call last):\n${err instanceof Error ? err.message : errStr}`,
          },
        ]);
      }
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        if (consoleScrollRef.current) {
          consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
        }
      }, 60);
    }
  };

  // Execute interactive statement or expression in >>> prompt
  const handleReplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = replInput.trim();
    if (!cmd) return;

    setReplInput("");
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const startTime = performance.now();

    try {
      let py = pyodideRef.current;
      if (!py) {
        py = await loadPyodideEngine();
        pyodideRef.current = py;
        setPyodideReady(true);
        setPyodideLoading(false);
      }

      py.globals.set("__repl_cmd__", cmd);

      const replScript = `
import sys as _sys, io as _io, traceback as _traceback, builtins as _builtins, json as _json, gc as _gc

class _CappedReplStringIO(_io.StringIO):
    def __init__(self, max_chars=40000):
        super().__init__()
        self._max = max_chars
        self._truncated = False

    def write(self, s):
        if self._truncated:
            return len(s)
        curr_len = self.tell()
        if curr_len + len(s) > self._max:
            allowed = max(0, self._max - curr_len)
            if allowed > 0:
                super().write(s[:allowed])
            super().write("\\n⚠️ [Output truncated to prevent memory exhaustion]\\n")
            self._truncated = True
            return len(s)
        return super().write(s)

_out = _CappedReplStringIO()
_err = _CappedReplStringIO()
_old_out = _sys.stdout
_old_err = _sys.stderr
_old_in = _sys.stdin

_sys.stdout = _out
_sys.stderr = _err

class _ReplSafeStdin(_io.StringIO):
    def readline(self, size=-1):
        return ""
    def read(self, size=-1):
        return ""
    def isatty(self):
        return False

_sys.stdin = _ReplSafeStdin()

def _safe_input_repl(prompt=""):
    if prompt:
        _out.write(str(prompt))
    return ""

_orig_input = _builtins.input
_builtins.input = _safe_input_repl
_idle_env["input"] = _safe_input_repl
_idle_env["__builtins__"] = _builtins

_res_str = ""
_is_err = False

try:
    try:
        _compiled = compile(__repl_cmd__, "<stdin>", "eval")
        _eval_val = eval(_compiled, _idle_env)
        if _eval_val is not None:
            _res_str = repr(_eval_val)
    except SyntaxError:
        _compiled = compile(__repl_cmd__, "<stdin>", "exec")
        exec(_compiled, _idle_env)
except MemoryError:
    _is_err = True
    _err.write("MemoryError: Python memory limit exceeded.\\n")
    _gc.collect()
except BaseException:
    _is_err = True
    _traceback.print_exc(file=_err)
finally:
    _sys.stdout = _old_out
    _sys.stderr = _old_err
    _sys.stdin = _old_in
    _builtins.input = _orig_input
    _idle_env["input"] = _safe_input_repl
    _gc.collect()

_json.dumps({
    "out": _out.getvalue(),
    "res": _res_str,
    "err": _err.getvalue() if _is_err else "",
    "is_err": _is_err
})
`;

      const rawJson = await py.runPythonAsync(replScript);
      let outText = "";
      let resText = "";
      let errText = "";
      let isErr = false;

      try {
        const parsed = JSON.parse(rawJson);
        outText = String(parsed.out || "");
        resText = String(parsed.res || "");
        errText = String(parsed.err || "");
        isErr = Boolean(parsed.is_err);
      } catch {
        resText = String(rawJson || "");
      }

      let combinedOutput = "";
      if (outText) combinedOutput += outText;
      if (resText) combinedOutput += (combinedOutput ? "\n" : "") + resText;

      const elapsed = Math.round(performance.now() - startTime);

      setHistory((prev) => [
        ...prev,
        {
          id: `cmd_${Date.now()}`,
          type: "cmd",
          cmd,
          output: combinedOutput,
          error: errText,
          timeMs: elapsed,
        },
      ]);
    } catch (err: any) {
      const errStr = String(err);
      const isMemErr =
        errStr.includes("out of memory") ||
        errStr.includes("MemoryError") ||
        errStr.includes("memory access out of bounds");

      if (isMemErr) {
        pyodideRef.current = null;
        globalPyodidePromise = null;
        setPyodideReady(false);
        setPyodideLoading(true);
        loadPyodideEngine()
          .then((py) => {
            pyodideRef.current = py;
            setPyodideReady(true);
            setPyodideLoading(false);
          })
          .catch(() => setPyodideLoading(false));
      }

      setHistory((prev) => [
        ...prev,
        {
          id: `cmd_err_${Date.now()}`,
          type: "cmd",
          cmd,
          error: isMemErr
            ? "⚠️ Memory Limit Exceeded. Python engine automatically recycled."
            : String(err instanceof Error ? err.message : err),
        },
      ]);
    } finally {
      setTimeout(() => {
        if (consoleScrollRef.current) {
          consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Up/Down arrows for command history in REPL
  const handleReplKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setReplInput(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setReplInput(cmdHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setReplInput("");
      }
    }
  };

  // Clear Interactive Console
  const handleClearConsole = () => {
    sfxClick();
    setHistory([]);
  };

  // Restart Python interactive session (resets variables)
  const handleRestartSession = async () => {
    sfxClick();
    try {
      if (pyodideRef.current) {
        await pyodideRef.current.runPythonAsync(`
import builtins as _builtins, sys as _sys, io as _io

class _SafeResetStdin(_io.StringIO):
    def readline(self, size=-1):
        return ""
    def read(self, size=-1):
        return ""
    def isatty(self):
        return False

_sys.stdin = _SafeResetStdin()

def _safe_input_reset(prompt=""):
    if prompt:
        _sys.stdout.write(str(prompt))
        _sys.stdout.flush()
    return ""

_builtins.input = _safe_input_reset

_idle_env = {
    "__name__": "__main__",
    "__doc__": None,
    "__builtins__": _builtins,
    "input": _safe_input_reset,
}
`);
      }
      setHistory([
        {
          id: `restart_${Date.now()}`,
          type: "system",
          title: "Session Restarted",
          output: "Memory and globals have been reset. Ready for interactive execution.",
        },
      ]);
      sfxSuccess();
    } catch {
      // Ignore
    }
  };

  // Editor Keyboard shortcuts: F5 / ⌘+Enter to run, ⌘+S to save, Tab 4 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "F5" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
      e.preventDefault();
      executePython(code, activeProgramName);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSaveActiveFile();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      handleCodeChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Save changes to active Project node
  const handleSaveActiveFile = async () => {
    sfxClick();
    if (activeProjectNode) {
      const res = await updateProjectFileContent(activeProjectNode.id, code);
      if (res.success && res.node) {
        setActiveProjectNode(res.node);
        setProjectNodes((prev) => prev.map((n) => (n.id === res.node!.id ? res.node! : n)));
        setSavedBadge(true);
        sfxSuccess();
        setTimeout(() => setSavedBadge(false), 2000);
      }
    } else {
      // Download or prompt
      handleDownloadCode();
    }
  };

  // Load a file from Project tree into editor
  const handleOpenFile = (node: ProjectNode) => {
    sfxClick();
    setActiveProjectNode(node);
    setActiveProgramName(node.name);
    setCode(node.content || "");
  };

  // Run a project file directly in the Interactive Console
  const handleRunProjectFileDirectly = (node: ProjectNode) => {
    sfxClick();
    setActiveProjectNode(node);
    setActiveProgramName(node.name);
    setCode(node.content || "");
    executePython(node.content || "", node.name);
  };

  // Create new file in project
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim().endsWith(".py") ? newFileName.trim() : `${newFileName.trim()}.py`;
    const res = await createProjectFile({
      parentPath: newTargetFolder,
      fileName: cleanName,
      content: "# " + cleanName + "\n\nprint('Hello from " + cleanName + "')\n",
      mimeType: "text/x-python",
    });
    if (res.success && res.node) {
      sfxSuccess();
      setProjectNodes((prev) => [...prev, res.node!]);
      setActiveProjectNode(res.node);
      setActiveProgramName(res.node.name);
      setCode(res.node.content || "");
      setShowNewFileModal(false);
      setNewFileName("");
    }
  };

  // Create new folder in project
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await createProjectFolder("/", newFolderName.trim());
    if (res.success && res.node) {
      sfxSuccess();
      setProjectNodes((prev) => [...prev, res.node!]);
      setExpandedFolders((prev) => ({ ...prev, [res.node!.path]: true }));
      setShowNewFolderModal(false);
      setNewFolderName("");
    }
  };

  // Download code to disk
  const handleDownloadCode = () => {
    sfxClick();
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeProgramName || "script.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    sfxClick();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered files & folders for sidebar
  const projectFolders = useMemo(() => {
    return projectNodes.filter((n) => n.type === "folder");
  }, [projectNodes]);

  const projectFiles = useMemo(() => {
    return projectNodes.filter((n) => n.type === "file");
  }, [projectNodes]);

  const filteredNodes = useMemo(() => {
    if (!sidebarSearch.trim()) return projectNodes;
    const q = sidebarSearch.toLowerCase();
    return projectNodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [projectNodes, sidebarSearch]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Top Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] pb-3">
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/apps"
            onClick={sfxClick}
            className="icon-btn rounded-xl"
            style={{ width: 36, height: 36 }}
            title="Back to Apps"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐍</span>
              <h1 className="text-lg sm:text-xl font-black text-[var(--ink)] tracking-tight">
                Python IDLE
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#306998]/15 text-[#306998] dark:text-[#ffd43b] border border-[#306998]/20">
                Python 3.12 • CPython WASM
              </span>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Toggle, Layout Buttons & Run Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Indicator */}
          {pyodideLoading ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface-2)] text-xs text-[var(--muted)] border border-[var(--hairline)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
              <span className="hidden sm:inline">Starting IDLE...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Interactive Shell Ready</span>
            </div>
          )}

          {/* GitHub-style Files Sidebar Toggle */}
          <button
            onClick={() => {
              sfxClick();
              setSidebarOpen((v) => !v);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              sidebarOpen
                ? "bg-[var(--surface-2)] text-[var(--accent)] border-[var(--hairline)] shadow-xs"
                : "bg-[var(--surface)] text-[var(--ink)] border-[var(--hairline)] hover:bg-[var(--surface-2)]"
            }`}
            title={sidebarOpen ? "Hide File Tree Sidebar" : "Show File Tree Sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
            <span>{sidebarOpen ? "Hide Files" : "Files"}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
              {projectFiles.length}
            </span>
          </button>

          {/* Functional Layout Toggle (Split vs Stacked) */}
          <div className="flex items-center bg-[var(--surface-2)] p-0.5 rounded-xl border border-[var(--hairline)]">
            <button
              onClick={() => {
                sfxClick();
                setLayoutMode("split");
              }}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                layoutMode === "split"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--hairline)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              title="Split View (Side by Side)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Split</span>
            </button>
            <button
              onClick={() => {
                sfxClick();
                setLayoutMode("stacked");
              }}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                layoutMode === "stacked"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--hairline)] font-bold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              title="Stacked View (Top and Bottom)"
            >
              <Rows className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Stacked</span>
            </button>
          </div>

          {/* Primary Run Module Button */}
          <button
            onClick={() => executePython(code, activeProgramName)}
            disabled={isRunning}
            className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Run Module in Interactive Shell (F5 or ⌘↵)"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run Module</span>
            <span className="hidden sm:inline-block text-[10px] opacity-80 font-mono px-1 py-0.5 rounded bg-black/20">
              F5
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Collapsible Sidebar + Editor & Interactive Shell */}
      <div className="flex gap-4 items-start">
        {/* GitHub-style Closable File Tree Sidebar */}
        {sidebarOpen && (
          <aside className="w-full sm:w-64 md:w-72 lg:w-80 shrink-0 surface-elevated rounded-2xl border border-[var(--hairline)] shadow-sm flex flex-col h-[600px] overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-3 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--surface-2)]/50">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-[var(--ink)]">Files & Folders</h3>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--surface-2)] text-[var(--muted)] font-mono">
                  {projectFiles.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={loadProjectsData}
                  className="icon-btn rounded-lg"
                  style={{ width: 26, height: 26 }}
                  title="Refresh project files"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingProjects ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setShowNewFileModal(true)}
                  className="icon-btn rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                  style={{ width: 26, height: 26 }}
                  title="New File in Projects"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="icon-btn rounded-lg text-amber-500 hover:bg-amber-500/10"
                  style={{ width: 26, height: 26 }}
                  title="New Folder in Projects"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="icon-btn rounded-lg ml-0.5"
                  style={{ width: 26, height: 26 }}
                  title="Close Sidebar"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Sidebar Search Filter */}
            <div className="p-2 border-b border-[var(--hairline)] bg-[var(--surface)]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-hidden"
                />
              </div>
            </div>

            {/* GitHub-style File Tree Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
              {filteredNodes.length === 0 ? (
                <div className="p-6 text-center text-[var(--muted)] space-y-1">
                  <p className="font-semibold">No files found</p>
                  <p className="text-[11px]">Create a file or folder above</p>
                </div>
              ) : (
                <>
                  {/* Folders & Their Children */}
                  {projectFolders.map((folder) => {
                    const isExpanded = expandedFolders[folder.path] ?? false;
                    const folderChildren = filteredNodes.filter(
                      (n) => n.type === "file" && n.parent_path === folder.path
                    );

                    return (
                      <div key={folder.id} className="space-y-0.5">
                        {/* Folder Row */}
                        <div
                          onClick={() => toggleFolder(folder.path)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer select-none text-[var(--ink)] font-medium transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
                            )}
                            {isExpanded ? (
                              <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                            )}
                            <span className="font-bold truncate text-[11px]">{folder.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              {folderChildren.length}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewTargetFolder(folder.path);
                                setShowNewFileModal(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-emerald-500 p-0.5 transition-opacity"
                              title={`Create file inside ${folder.name}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Files inside folder */}
                        {isExpanded && (
                          <div className="pl-4 space-y-0.5 border-l border-[var(--hairline)] ml-3 my-0.5">
                            {folderChildren.length === 0 ? (
                              <div className="py-1 px-2 text-[10px] text-[var(--muted)] italic">
                                Empty folder
                              </div>
                            ) : (
                              folderChildren.map((file) => {
                                const isActive = activeProjectNode?.id === file.id;
                                const isPy = file.name.endsWith(".py") || file.mime_type === "text/x-python";

                                return (
                                  <div
                                    key={file.id}
                                    onClick={() => handleOpenFile(file)}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${
                                      isActive
                                        ? "bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/30"
                                        : "hover:bg-[var(--surface-2)] text-[var(--ink)]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileCode
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          isPy ? "text-emerald-500" : "text-blue-400"
                                        }`}
                                      />
                                      <span className="truncate text-[11px] font-mono">{file.name}</span>
                                    </div>

                                    {/* Direct Run Button on file item */}
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleRunProjectFileDirectly(file)}
                                        className="btn bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs transition-transform active:scale-90"
                                        title={`Run ${file.name} in Python Interactive Shell`}
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        <span className="text-[10px]">Run</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Root Level Files */}
                  {filteredNodes
                    .filter((n) => n.type === "file" && (n.parent_path === "/" || !n.parent_path))
                    .map((file) => {
                      const isActive = activeProjectNode?.id === file.id;
                      const isPy = file.name.endsWith(".py") || file.mime_type === "text/x-python";

                      return (
                        <div
                          key={file.id}
                          onClick={() => handleOpenFile(file)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${
                            isActive
                              ? "bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/30"
                              : "hover:bg-[var(--surface-2)] text-[var(--ink)]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileCode
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isPy ? "text-emerald-500" : "text-blue-400"
                              }`}
                            />
                            <span className="truncate text-[11px] font-mono">{file.name}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleRunProjectFileDirectly(file)}
                              className="btn bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs transition-transform active:scale-90"
                              title={`Run ${file.name} in Python Interactive Shell`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span className="text-[10px]">Run</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </div>

            {/* Sidebar Footer: Link to full Projects manager */}
            <div className="p-2 border-t border-[var(--hairline)] bg-[var(--surface-2)]/40 flex items-center justify-between text-[11px]">
              <Link
                to="/projects"
                onClick={sfxClick}
                className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Full Projects Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </aside>
        )}

        {/* Main Editor & Interactive Shell Area */}
        <div className="flex-1 min-w-0">
          <div
            className={
              layoutMode === "split"
                ? "grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]"
                : "flex flex-col gap-4"
            }
          >
            {/* PANE 1: Colorful Code Editor */}
            <div
              className={`surface-elevated rounded-2xl border border-[var(--hairline)] overflow-hidden flex flex-col shadow-sm ${
                layoutMode === "stacked" ? "h-[380px]" : "h-full"
              }`}
            >
              {/* Editor Header Toolbar */}
              <div className="px-3.5 py-2 bg-[var(--surface-2)]/70 border-b border-[var(--hairline)] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-mono font-bold text-[var(--ink)] truncate">
                    {activeProgramName}
                  </span>
                  {activeProjectNode && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold truncate">
                      {activeProjectNode.parent_path}
                    </span>
                  )}
                  {savedBadge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-bold">
                      Saved ✓
                    </span>
                  )}
                </div>

                {/* Editor Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleSaveActiveFile}
                    className="icon-btn rounded-lg"
                    style={{ width: 28, height: 28 }}
                    title="Save File (⌘S)"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="icon-btn rounded-lg"
                    style={{ width: 28, height: 28 }}
                    title="Copy code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="icon-btn rounded-lg"
                    style={{ width: 28, height: 28 }}
                    title="Download .py file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Colorful Editor Body with Syntax Highlight Overlay */}
              <div className="relative flex-1 min-h-0 flex bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 overflow-hidden">
                {/* Line Numbers Gutter */}
                <div
                  ref={gutterRef}
                  className="w-10 py-3.5 select-none text-right pr-2 text-zinc-600 bg-zinc-950 border-r border-zinc-800 text-[11px] leading-relaxed font-mono shrink-0 overflow-hidden"
                >
                  {Array.from({ length: codeLineCount }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code Body Container */}
                <div className="relative flex-1 h-full overflow-hidden">
                  {/* Colorful Syntax Highlight Layer (Pre) */}
                  <pre
                    ref={highlightRef}
                    aria-hidden="true"
                    className="absolute inset-0 p-3.5 m-0 font-mono text-xs sm:text-sm leading-relaxed pointer-events-none select-none overflow-hidden whitespace-pre font-normal text-zinc-100"
                    style={{ tabSize: 4 }}
                    dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }}
                  />

                  {/* Native Textarea Input Layer (Synchronized Scroll) */}
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onScroll={handleEditorScroll}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="# Type or paste Python code here..."
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-3.5 bg-transparent text-transparent caret-white outline-none resize-none leading-relaxed font-mono text-xs sm:text-sm overflow-auto whitespace-pre font-normal selection:bg-[#306998]/50 selection:text-transparent"
                    style={{ tabSize: 4 }}
                  />
                </div>
              </div>

              {/* Editor Footer */}
              <div className="px-3.5 py-1.5 bg-[var(--surface-2)]/40 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono shrink-0">
                <span>Tab: 4 spaces indent</span>
                <span>F5 / ⌘↵: Run module</span>
              </div>
            </div>

            {/* PANE 2: Unified Interactive Shell (Console + REPL) */}
            <div
              className={`surface-elevated rounded-2xl border border-[var(--hairline)] overflow-hidden flex flex-col shadow-sm ${
                layoutMode === "stacked" ? "h-[380px]" : "h-full"
              }`}
            >
              {/* Shell Header */}
              <div className="px-3.5 py-2 bg-[var(--surface-2)]/70 border-b border-[var(--hairline)] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-[var(--ink)]">
                    Python Interactive Shell
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRestartSession}
                    className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors px-2 py-1 rounded flex items-center gap-1"
                    title="Reset Interactive Memory & Variables"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restart</span>
                  </button>
                  <button
                    onClick={handleClearConsole}
                    className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors px-2 py-1 rounded"
                    title="Clear Console Output"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Shell Stream History Body */}
              <div
                ref={consoleScrollRef}
                className="flex-1 min-h-0 p-3.5 bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 overflow-y-auto space-y-3 leading-relaxed select-text"
              >
                {history.map((item) => {
                  if (item.type === "system") {
                    return (
                      <div key={item.id} className="text-zinc-500 text-xs pb-2 border-b border-zinc-900 space-y-1">
                        <p className="font-bold text-zinc-400">{item.title}</p>
                        <p className="whitespace-pre-wrap">{item.output}</p>
                      </div>
                    );
                  }

                  if (item.type === "run") {
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 border-b border-zinc-900 pb-1">
                          <span className="text-[#ffd43b]">
                            &gt;&gt;&gt; ================= RESTART: {item.title} =================
                          </span>
                          {item.timeMs !== undefined && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{item.timeMs}ms</span>
                            </span>
                          )}
                        </div>
                        {item.output && (
                          <div className="text-zinc-200 whitespace-pre-wrap pl-1">{item.output}</div>
                        )}
                        {item.error && (
                          <div className="text-rose-400 whitespace-pre-wrap pl-1">{item.error}</div>
                        )}
                      </div>
                    );
                  }

                  if (item.type === "cmd") {
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span className="text-[#ffd43b] font-bold">&gt;&gt;&gt;</span>
                          <span className="text-zinc-100">{item.cmd}</span>
                          {item.timeMs !== undefined && (
                            <span className="text-[10px] text-zinc-600 ml-auto">{item.timeMs}ms</span>
                          )}
                        </div>
                        {item.output && (
                          <div className="pl-5 text-emerald-400 whitespace-pre-wrap">{item.output}</div>
                        )}
                        {item.error && (
                          <div className="pl-5 text-rose-400 whitespace-pre-wrap">{item.error}</div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Docked Interactive Command Input Bar (>>> prompt) */}
              <form
                onSubmit={handleReplSubmit}
                className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 shrink-0"
              >
                <span className="text-[#ffd43b] font-mono font-bold text-sm shrink-0">&gt;&gt;&gt;</span>
                <input
                  type="text"
                  value={replInput}
                  onChange={(e) => setReplInput(e.target.value)}
                  onKeyDown={handleReplKeyDown}
                  placeholder="Type Python command (e.g. dir(), 2**10, help())..."
                  className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!replInput.trim()}
                  className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#306998] hover:bg-[#3d83be] text-white disabled:opacity-40 transition-opacity"
                >
                  Enter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create New Project File */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="surface-elevated rounded-2xl p-5 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
              <h3 className="font-bold text-sm text-[var(--ink)]">Create New Python File</h3>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewFile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">Target Directory</label>
                <select
                  value={newTargetFolder}
                  onChange={(e) => setNewTargetFolder(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)]"
                >
                  <option value="/">/ (Root Folder)</option>
                  {projectFolders.map((f) => (
                    <option key={f.id} value={f.path}>
                      {f.path} ({f.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">File Name</label>
                <div className="flex items-center gap-2 surface px-3 py-2 rounded-xl border border-[var(--hairline)]">
                  <FileCode className="w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="e.g. calculator.py"
                    autoFocus
                    className="flex-1 bg-transparent text-xs font-mono outline-none text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="btn btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 py-2 rounded-xl text-xs font-bold">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Project Folder */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="surface-elevated rounded-2xl p-5 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-2.5">
              <h3 className="font-bold text-sm text-[var(--ink)]">Create New Project Folder</h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewFolder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">Folder Name</label>
                <div className="flex items-center gap-2 surface px-3 py-2 rounded-xl border border-[var(--hairline)]">
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Data-Structures"
                    autoFocus
                    className="flex-1 bg-transparent text-xs font-mono outline-none text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="btn btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 py-2 rounded-xl text-xs font-bold">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
