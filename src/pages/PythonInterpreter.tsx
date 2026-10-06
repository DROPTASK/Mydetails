import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Upload,
  Terminal,
  Code2,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Trash2,
  Plus,
  FileCode,
  FolderCode,
  Layers,
  ChevronDown,
  Save,
  Edit2,
  FileText,
  Zap,
  LayoutGrid,
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
} from "lucide-react";
import { sfxClick, sfxSuccess } from "../lib/sound";

export type ProgramItem = {
  id: string;
  name: string;
  desc: string;
  category?: string;
  code: string;
  isAuthor?: boolean; // Vansh's programs
};

export const VANSH_PROGRAMS: ProgramItem[] = [
  {
    id: "vansh_tour",
    name: "01_welcome_tour.py",
    desc: "Strings, f-strings, lists, and formatted portfolio tour",
    category: "Portfolio & Tour",
    isAuthor: true,
    code: `# ========================================================
# Vansh Kumar's Portfolio — Python IDLE Tour
# Class 12 CBSE Computer Science & Web Developer
# ========================================================

def introduce():
    profile = {
        "name": "Vansh Kumar",
        "education": "Class 12 • Computer Science (CBSE)",
        "languages": ["Python", "TypeScript", "SQL"],
        "curiosity": "Physics, Decentralization, & Systems"
    }

    print(f"👋 Welcome to Python IDLE in {profile['name']}'s Portfolio!")
    print("=" * 60)
    for key, val in profile.items():
        if isinstance(val, list):
            print(f"  • {key.capitalize()}: {', '.join(val)}")
        else:
            print(f"  • {key.capitalize()}: {val}")
    print("=" * 60)

    # List comprehension demonstration
    powers_of_two = [2**i for i in range(1, 9)]
    print(f"🚀 Powers of 2: {powers_of_two}")

introduce()
`,
  },
  {
    id: "vansh_stack",
    name: "02_cbse_stack_adt.py",
    desc: "CBSE Class 12 CS Stack ADT with push, pop, peek & underflow",
    category: "CBSE Class 12 CS",
    isAuthor: true,
    code: `# ========================================================
# CBSE Class 12 Computer Science: Stack ADT (LIFO)
# ========================================================

class LinearStack:
    def __init__(self, capacity=5):
        self.items = []
        self.capacity = capacity

    def push(self, val):
        if len(self.items) >= self.capacity:
            print(f"⚠️  Overflow! Stack reached capacity of {self.capacity}.")
            return False
        self.items.append(val)
        print(f"📥 PUSH -> {val}")
        return True

    def pop(self):
        if self.is_empty():
            print("⚠️  Underflow! Cannot pop from an empty stack.")
            return None
        val = self.items.pop()
        print(f"📤 POP  <- {val}")
        return val

    def peek(self):
        return self.items[-1] if not self.is_empty() else None

    def is_empty(self):
        return len(self.items) == 0

    def display(self):
        if self.is_empty():
            print("[Empty Stack]")
            return
        print("\\n--- Current Stack State ---")
        for i, item in enumerate(reversed(self.items)):
            pointer = " <-- TOP" if i == 0 else ""
            print(f"  | {item:>4} |{pointer}")
        print("  ---------\\n")

# Demonstration
stack = LinearStack(capacity=4)
for num in [101, 202, 303, 404]:
    stack.push(num)

stack.display()
print(f"Inspecting Top (Peek): {stack.peek()}")

stack.pop()
stack.display()
`,
  },
  {
    id: "vansh_primes",
    name: "03_sieve_of_eratosthenes.py",
    desc: "Fast prime generator algorithm and factorization",
    category: "Algorithms",
    isAuthor: true,
    code: `# ========================================================
# Sieve of Eratosthenes & Prime Factorization
# ========================================================

def sieve_primes(limit):
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    
    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, limit + 1, i):
                is_prime[j] = False
                
    return [num for num, prime in enumerate(is_prime) if prime]

def prime_factors(n):
    factors = []
    d = 2
    temp = n
    while d * d <= temp:
        while temp % d == 0:
            factors.append(d)
            temp //= d
        d += 1
    if temp > 1:
        factors.append(temp)
    return factors

limit = 100
primes_up_to_100 = sieve_primes(limit)
print(f"🔢 Primes up to {limit} ({len(primes_up_to_100)} primes):")
print(primes_up_to_100)

sample_num = 1260
print(f"\\n🔍 Prime factorization of {sample_num}:")
print(f"  {sample_num} = {' × '.join(map(str, prime_factors(sample_num)))}")
`,
  },
  {
    id: "vansh_quicksort",
    name: "04_quicksort_search.py",
    desc: "Divide-and-conquer Quicksort & Binary Search algorithm trace",
    category: "Algorithms",
    isAuthor: true,
    code: `# ========================================================
# Quicksort Partitioning & Binary Search Trace
# ========================================================

def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    steps = 0
    while low <= high:
        steps += 1
        mid = (low + high) // 2
        print(f"  Step {steps}: checking index {mid} -> value {arr[mid]}")
        if arr[mid] == target:
            return mid, steps
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1, steps

raw_data = [84, 12, 91, 45, 23, 67, 3, 56, 38]
print(f"Raw Array:      {raw_data}")
sorted_data = quicksort(raw_data)
print(f"Quicksort:      {sorted_data}\\n")

target = 45
print(f"Searching for {target} with Binary Search:")
idx, steps = binary_search(sorted_data, target)
print(f"Result: found at index {idx} in {steps} steps!")
`,
  },
  {
    id: "vansh_matrix",
    name: "05_matrix_multiply.py",
    desc: "2D Array & Linear Algebra matrix product calculation",
    category: "Mathematics",
    isAuthor: true,
    code: `# ========================================================
# Matrix Multiplication & Transpose
# ========================================================

def matrix_multiply(A, B):
    rows_A, cols_A = len(A), len(A[0])
    rows_B, cols_B = len(B), len(B[0])
    
    if cols_A != rows_B:
        raise ValueError("Cannot multiply: columns of A must match rows of B.")
        
    result = [[0 for _ in range(cols_B)] for _ in range(rows_A)]
    
    for i in range(rows_A):
        for j in range(cols_B):
            for k in range(cols_A):
                result[i][j] += A[i][k] * B[k][j]
    return result

def print_matrix(name, M):
    print(f"Matrix {name}:")
    for row in M:
        print("  [" + ", ".join(f"{x:>3}" for x in row) + " ]")
    print()

A = [
    [1, 2, 3],
    [4, 5, 6]
]

B = [
    [7, 8],
    [9, 1],
    [2, 3]
]

print_matrix("A (2x3)", A)
print_matrix("B (3x2)", B)

C = matrix_multiply(A, B)
print_matrix("A × B (2x2)", C)
`,
  },
  {
    id: "vansh_physics",
    name: "06_projectile_simulation.py",
    desc: "2D Classical Mechanics Kinematics & Trajectory Range",
    category: "Physics Simulation",
    isAuthor: true,
    code: `# ========================================================
# 2D Kinematics Projectile Motion Simulator
# ========================================================
import math

def simulate_projectile(v0, angle_deg, g=9.81):
    theta = math.radians(angle_deg)
    vx = v0 * math.cos(theta)
    vy = v0 * math.sin(theta)
    
    # Time of flight: t = 2 * vy / g
    t_flight = 2 * vy / g
    # Maximum height: H = vy^2 / (2 * g)
    h_max = (vy ** 2) / (2 * g)
    # Total range: R = vx * t_flight
    r_total = vx * t_flight
    
    print(f"🚀 Launch Parameters: v0 = {v0} m/s, θ = {angle_deg}°")
    print(f"  • Initial Vx:        {vx:.2f} m/s")
    print(f"  • Initial Vy:        {vy:.2f} m/s")
    print(f"  • Time of Flight:    {t_flight:.2f} s")
    print(f"  • Peak Apex Height:  {h_max:.2f} m")
    print(f"  • Maximum Range:     {r_total:.2f} m\\n")
    
    print("Trajectory Sample Points (Time -> (X, Y)):")
    steps = 6
    for i in range(steps + 1):
        t = (t_flight / steps) * i
        x = vx * t
        y = vy * t - 0.5 * g * (t ** 2)
        print(f"  t = {t:5.2f}s  |  x = {x:6.2f}m , y = {max(0.0, y):6.2f}m")

simulate_projectile(v0=45.0, angle_deg=45.0)
`,
  },
  {
    id: "vansh_monte_carlo",
    name: "07_monte_carlo_pi.py",
    desc: "Monte Carlo random sampling to approximate value of Pi",
    category: "Mathematics",
    isAuthor: true,
    code: `# ========================================================
# Monte Carlo Pi Approximation via Stochastic Simulation
# ========================================================
import random
import math

def simulate_pi(samples=25000):
    inside_circle = 0
    for _ in range(samples):
        x = random.random()
        y = random.random()
        if (x * x + y * y) <= 1.0:
            inside_circle += 1
            
    approx = (4 * inside_circle) / samples
    return approx

print("🎲 Simulating 25,000 random dart throws in quadrant...")
pi_calc = simulate_pi(25000)
abs_error = abs(math.pi - pi_calc)
percentage_err = (abs_error / math.pi) * 100

print(f"  • Estimated π:  {pi_calc:.6f}")
print(f"  • True π:       {math.pi:.6f}")
print(f"  • Absolute Err: {abs_error:.6f} ({percentage_err:.2f}%)")
`,
  },
];

const LOCAL_STORAGE_USER_PROGRAMS = "vk_python_user_programs";

const INITIAL_USER_PROGRAM: ProgramItem = {
  id: "my_main",
  name: "my_program.py",
  desc: "My custom program in IDLE",
  isAuthor: false,
  code: `# Write your own Python code here!
# Press 'Run Module' or F5 / ⌘↵ to execute.

def greet_user(name):
    print(f"Hello, {name}! Welcome to your Python IDLE.")

user = "Developer"
greet_user(user)

# Try computing something:
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
even_squares = [n**2 for n in numbers if n % 2 == 0]
print(f"Even squares: {even_squares}")
`,
};

function getUserPrograms(): ProgramItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_PROGRAMS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore
  }
  return [INITIAL_USER_PROGRAM];
}

function saveUserPrograms(programs: ProgramItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_PROGRAMS, JSON.stringify(programs));
  } catch {
    // Ignore
  }
}

// Lightweight fallback runner if WASM CDN is temporarily unreachable
function runFallbackPython(code: string): string {
  const output: string[] = [];
  const lines = code.split("\n");
  const env: Record<string, unknown> = {
    range: (start: number, stop?: number, step = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const arr = [];
      for (let i = start; i < stop; i += step) arr.push(i);
      return arr;
    },
    len: (obj: unknown) => (Array.isArray(obj) || typeof obj === "string" ? obj.length : 0),
    sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),
    max: (...args: number[]) => Math.max(...args),
    min: (...args: number[]) => Math.min(...args),
  };

  try {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      if (line.startsWith("print(") && line.endsWith(")")) {
        const inner = line.slice(6, -1);
        try {
          if (inner.startsWith('f"') || inner.startsWith("f'")) {
            const template = inner.slice(2, -1).replace(/{([^}]+)}/g, (_, exp) => {
              try {
                return String(eval(`with(env) { ${exp} }`));
              } catch {
                return `{${exp}}`;
              }
            });
            output.push(template);
          } else {
            const val = eval(`with(env) { ${inner} }`);
            output.push(typeof val === "object" ? JSON.stringify(val) : String(val));
          }
        } catch {
          output.push(inner.replace(/['"]/g, ""));
        }
      }
    }
  } catch (err) {
    output.push(`Python Execution Error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return output.length > 0 ? output.join("\n") : "Program executed with code 0 (no output produced).";
}

export function PythonInterpreter() {
  const [userPrograms, setUserPrograms] = useState<ProgramItem[]>(getUserPrograms);
  const [activeProgramId, setActiveProgramId] = useState<string>(() => userPrograms[0]?.id || "my_main");
  const [code, setCode] = useState<string>(() => userPrograms[0]?.code || INITIAL_USER_PROGRAM.code);
  const [activeProgramName, setActiveProgramName] = useState<string>(() => userPrograms[0]?.name || "my_program.py");

  // Output Shell
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"shell" | "repl">("shell");
  const [layoutMode, setLayoutMode] = useState<"split" | "stacked">("split");

  // REPL Shell
  const [replInput, setReplInput] = useState("");
  const [replHistory, setReplHistory] = useState<Array<{ cmd: string; res: string; isError?: boolean }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Pyodide State
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(true);

  // Modals / Dropdowns
  const [showVanshModal, setShowVanshModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramItem | null>(null);
  const [newProgName, setNewProgName] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replScrollRef = useRef<HTMLDivElement>(null);
  const shellScrollRef = useRef<HTMLDivElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodideRef = useRef<any>(null);

  // Initialize Pyodide WebAssembly CPython
  useEffect(() => {
    let isMounted = true;

    async function initPyodide() {
      try {
        setPyodideLoading(true);
        if (!(window as any).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Pyodide"));
            document.head.appendChild(script);
          });
        }

        if (!isMounted) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
        });

        if (!isMounted) return;
        pyodideRef.current = pyodide;
        setPyodideReady(true);
        setPyodideLoading(false);
      } catch (err) {
        console.warn("Pyodide WASM error, using fallback runner:", err);
        if (isMounted) {
          setPyodideLoading(false);
        }
      }
    }

    initPyodide();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync active program changes to user programs state & local storage
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setUserPrograms((prev) => {
      const updated = prev.map((p) => (p.id === activeProgramId ? { ...p, code: newCode } : p));
      saveUserPrograms(updated);
      return updated;
    });
  };

  // Run the given Python code (either active editor code, or a specific script directly)
  const executePython = async (scriptToRun: string, scriptTitle?: string) => {
    if (isRunning) return;
    sfxClick();
    setIsRunning(true);
    setActiveTab("shell");
    const startTime = performance.now();

    const banner = `Python 3.12.7 (CPython WASM) on linux\n================================ RESTART: ${scriptTitle || "Shell"} ================================\n`;
    setOutput(`${banner}>>> Executing...\n`);

    try {
      if (pyodideRef.current) {
        const pyodide = pyodideRef.current;
        await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
        await pyodide.runPythonAsync(scriptToRun);

        const capturedOut = await pyodide.runPythonAsync("sys.stdout.getvalue()");
        const capturedErr = await pyodide.runPythonAsync("sys.stderr.getvalue()");

        let finalResult = banner;
        if (capturedOut) finalResult += capturedOut;
        if (capturedErr) finalResult += (finalResult ? "\n" : "") + `Traceback / Stderr:\n${capturedErr}`;
        if (!capturedOut && !capturedErr) {
          finalResult += ">>> Program completed with return code 0 (no output produced).";
        }

        setOutput(finalResult);
      } else {
        const fallbackRes = runFallbackPython(scriptToRun);
        setOutput(`${banner}${fallbackRes}`);
      }
      sfxSuccess();
    } catch (err) {
      setOutput(`${banner}Traceback (most recent call last):\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      const elapsed = Math.round(performance.now() - startTime);
      setExecTime(elapsed);
      setIsRunning(false);
      setTimeout(() => {
        if (shellScrollRef.current) {
          shellScrollRef.current.scrollTop = shellScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Run active editor module
  const handleRunActiveModule = () => {
    executePython(code, activeProgramName);
  };

  // Run one of Vansh's programs DIRECTLY into the IDLE Shell
  const handleRunVanshDirectly = (prog: ProgramItem) => {
    sfxClick();
    setShowVanshModal(false);
    executePython(prog.code, prog.name);
  };

  // Load a program into the IDLE Editor
  const handleLoadIntoEditor = (prog: ProgramItem) => {
    sfxClick();
    setShowVanshModal(false);
    setActiveProgramId(prog.id);
    setActiveProgramName(prog.name);
    setCode(prog.code);
    setOutput("");
  };

  // Create a new user program
  const handleCreateNewProgram = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newProgName.trim().replace(/[/\\:*?"<>|]/g, "_") || `program_${userPrograms.length + 1}`;
    const filename = clean.endsWith(".py") ? clean : `${clean}.py`;

    sfxClick();
    const newProg: ProgramItem = {
      id: `user_${Date.now()}`,
      name: filename,
      desc: "User created script in IDLE",
      isAuthor: false,
      code: `# ${filename}\n# Created in Python IDLE\n\ndef main():\n    print("Hello from ${filename}!")\n\nif __name__ == "__main__":\n    main()\n`,
    };

    const updated = [...userPrograms, newProg];
    setUserPrograms(updated);
    saveUserPrograms(updated);

    setActiveProgramId(newProg.id);
    setActiveProgramName(newProg.name);
    setCode(newProg.code);
    setOutput("");
    setNewProgName("");
    setShowNewProgramModal(false);
    sfxSuccess();
  };

  // Confirm delete of a user program
  const confirmDeleteProgram = (prog: ProgramItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfxClick();
    setProgramToDelete(prog);
  };

  // Execute deletion of user program
  const handleDeleteUserProgram = (id: string) => {
    sfxClick();
    setProgramToDelete(null);
    const remaining = userPrograms.filter((p) => p.id !== id);

    if (remaining.length === 0) {
      // If user deletes their last program, reset with a fresh clean script
      const freshProg: ProgramItem = {
        id: `user_${Date.now()}`,
        name: "untitled.py",
        desc: "My new Python script in IDLE",
        isAuthor: false,
        code: `# untitled.py\n# Python IDLE script\n\nprint("Hello, Python IDLE!")\n`,
      };
      setUserPrograms([freshProg]);
      saveUserPrograms([freshProg]);
      setActiveProgramId(freshProg.id);
      setActiveProgramName(freshProg.name);
      setCode(freshProg.code);
    } else {
      setUserPrograms(remaining);
      saveUserPrograms(remaining);
      if (activeProgramId === id) {
        const next = remaining[0];
        setActiveProgramId(next.id);
        setActiveProgramName(next.name);
        setCode(next.code);
      }
    }
    sfxSuccess();
  };

  // Save badge indicator
  const handleManualSave = () => {
    sfxClick();
    setUserPrograms((prev) => {
      const updated = prev.map((p) => (p.id === activeProgramId ? { ...p, code } : p));
      saveUserPrograms(updated);
      return updated;
    });
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  // REPL execution
  const handleReplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = replInput.trim();
    if (!cmd) return;
    setReplInput("");
    setHistoryIndex(-1);
    sfxClick();

    let res = "";
    let isError = false;

    try {
      if (pyodideRef.current) {
        const pyodide = pyodideRef.current;
        await pyodide.runPythonAsync(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
        const evaluated = await pyodide.runPythonAsync(cmd);
        const std = await pyodide.runPythonAsync("sys.stdout.getvalue()");
        const err = await pyodide.runPythonAsync("sys.stderr.getvalue()");

        if (std) res += std;
        if (err) {
          res += (res ? "\n" : "") + err;
          isError = true;
        }
        if (!std && !err && evaluated !== undefined) {
          res = String(evaluated);
        }
      } else {
        res = runFallbackPython(cmd);
      }
    } catch (err) {
      res = err instanceof Error ? err.message : String(err);
      isError = true;
    }

    setReplHistory((prev) => [...prev, { cmd, res: res || "None", isError }]);

    setTimeout(() => {
      if (replScrollRef.current) {
        replScrollRef.current.scrollTop = replScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Keyboard shortcut: F5 or ⌘↵ to run module, ⌘S to save, Tab support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "F5" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
      e.preventDefault();
      handleRunActiveModule();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
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

  // REPL history navigation with Up/Down arrow keys
  const handleReplKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (replHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? replHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setReplInput(replHistory[nextIdx].cmd);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < replHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setReplInput(replHistory[nextIdx].cmd);
      } else {
        setHistoryIndex(-1);
        setReplInput("");
      }
    }
  };

  const codeLineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/apps"
            onClick={sfxClick}
            className="btn btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Apps</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐍</span>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
                Python IDLE
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#306998]/15 text-[#306998] dark:text-[#ffd43b] border border-[#306998]/20">
                Python 3.12 • CPython WASM
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Status, Layout Toggle & Primary Run Button */}
        <div className="flex items-center gap-2">
          {pyodideLoading ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-xs text-[var(--muted)] border border-[var(--hairline)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
              <span>Starting IDLE...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>IDLE Shell Ready</span>
            </div>
          )}

          {/* Layout Toggle */}
          <div className="hidden sm:flex items-center bg-[var(--surface-2)] p-0.5 rounded-xl border border-[var(--hairline)]">
            <button
              onClick={() => setLayoutMode("split")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                layoutMode === "split" ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs" : "text-[var(--muted)]"
              }`}
              title="Split View (Side by Side)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("stacked")}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                layoutMode === "stacked" ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs" : "text-[var(--muted)]"
              }`}
              title="Stacked View (Top / Bottom)"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRunActiveModule}
            disabled={isRunning}
            className="btn btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            title="Run Module (F5 or ⌘↵)"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run Module</span>
            <span className="hidden sm:inline-block text-[10px] opacity-75 font-mono px-1 py-0.5 rounded bg-black/20">
              F5
            </span>
          </button>
        </div>
      </div>

      {/* Direct One-Click Shelf: Run Vansh's Programs Directly */}
      <div className="surface-elevated rounded-2xl p-3 border border-[var(--hairline)] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
              ⚡
            </span>
            <h2 className="text-xs font-bold text-[var(--ink)]">
              Run Vansh&apos;s Programs Directly:
            </h2>
            <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
              Click &quot;Run&quot; to execute immediately in the IDLE shell, or &quot;Load&quot; to view/edit in the editor.
            </span>
          </div>

          <button
            onClick={() => setShowVanshModal(true)}
            className="text-xs text-[var(--accent)] hover:underline font-semibold flex items-center gap-1 shrink-0"
          >
            <span>View All ({VANSH_PROGRAMS.length})</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Execution Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {VANSH_PROGRAMS.map((prog) => (
            <div
              key={prog.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] hover:border-amber-500/40 transition-all shrink-0"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-mono font-medium text-[var(--ink)]">
                {prog.name}
              </span>

              {/* Direct Run Button */}
              <button
                onClick={() => handleRunVanshDirectly(prog)}
                className="ml-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
                title={`Run ${prog.name} directly in Python shell`}
              >
                <Zap className="w-2.5 h-2.5 fill-current" />
                <span>Run</span>
              </button>

              {/* Load in Editor Button */}
              <button
                onClick={() => handleLoadIntoEditor(prog)}
                className="px-1.5 py-0.5 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-medium border border-[var(--hairline)]"
                title="Load into Editor"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* IDLE File System Strip: User's Own Programs Tabs */}
      <div className="surface-elevated rounded-2xl p-2 border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* User's Created Programs List */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
          <span className="text-[11px] font-bold text-[var(--muted)] px-1 shrink-0 flex items-center gap-1">
            <FolderCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>My Programs:</span>
          </span>

          {userPrograms.map((prog) => {
            const isActive = activeProgramId === prog.id;
            return (
              <div
                key={prog.id}
                onClick={() => {
                  sfxClick();
                  setActiveProgramId(prog.id);
                  setActiveProgramName(prog.name);
                  setCode(prog.code);
                  setOutput("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 border group ${
                  isActive
                    ? "bg-[var(--surface)] text-[var(--accent)] border-[var(--accent)]/40 shadow-xs"
                    : "bg-[var(--surface-2)]/60 text-[var(--muted)] hover:text-[var(--ink)] border-[var(--hairline)]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>{prog.name}</span>

                {/* Delete Button on User Program - Always enabled and working */}
                <button
                  onClick={(e) => confirmDeleteProgram(prog, e)}
                  className="text-zinc-400 hover:text-rose-500 p-0.5 rounded transition-colors ml-0.5"
                  title={`Delete ${prog.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Create New Program Button */}
          <button
            onClick={() => setShowNewProgramModal(true)}
            className="btn btn-secondary px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
            title="Create new program"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>New Program</span>
          </button>
        </div>

        {/* Right Editor Actions (Save, Copy, Download, Open) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={handleManualSave}
            className="btn btn-secondary text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1"
            title="Save file (⌘S)"
          >
            {savedBadge ? <Check className="w-3 h-3 text-emerald-500" /> : <Save className="w-3 h-3" />}
            <span>{savedBadge ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn btn-secondary text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1"
            title="Copy Python code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              const blob = new Blob([code], { type: "text/x-python" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = activeProgramName;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn btn-secondary text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1"
            title="Download script as .py file"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>

          <button
            onClick={() => fileUploadRef.current?.click()}
            className="btn btn-secondary text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1"
            title="Open .py file from computer"
          >
            <Upload className="w-3 h-3" />
            <span>Open</span>
          </button>
          <input
            ref={fileUploadRef}
            type="file"
            accept=".py,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                  setCode(text);
                  setActiveProgramName(file.name);
                  sfxSuccess();
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Main IDLE Workspace: Code Editor & Python Shell */}
      <div className={layoutMode === "split" ? "grid lg:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        {/* Left / Top Pane: IDLE Code Editor */}
        <div className="surface-elevated rounded-3xl border border-[var(--hairline)] overflow-hidden flex flex-col shadow-sm">
          {/* Window Header */}
          <div className="px-4 py-2.5 bg-[var(--surface-2)]/70 border-b border-[var(--hairline)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono font-bold text-[var(--ink)]">
                {activeProgramName} — Python IDLE Editor
              </span>
            </div>

            <div className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-2">
              <span>{codeLineCount} lines</span>
              <span>•</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Text Editor with Line Numbers Gutter */}
          <div className="relative flex-1 min-h-[460px] flex bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 selection:bg-[#306998] selection:text-white">
            {/* Gutter */}
            <div className="w-10 py-4 select-none text-right pr-2 text-zinc-600 bg-zinc-950/80 border-r border-zinc-800 text-[11px] leading-relaxed font-mono">
              {Array.from({ length: Math.max(1, codeLineCount) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="# Type or paste your Python code here..."
              spellCheck={false}
              className="flex-1 w-full min-h-[460px] p-4 bg-transparent outline-none resize-none leading-relaxed font-mono overflow-y-auto"
            />
          </div>

          {/* Editor Footer */}
          <div className="px-4 py-2 bg-[var(--surface-2)]/40 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
            <span>Tab: 4 spaces indent</span>
            <span>Shortcut: Press F5 or ⌘↵ to run module</span>
          </div>
        </div>

        {/* Right / Bottom Pane: Python IDLE Interactive Shell & Output */}
        <div className="surface-elevated rounded-3xl border border-[var(--hairline)] overflow-hidden flex flex-col shadow-sm">
          {/* Shell Header & Mode Switcher */}
          <div className="px-4 py-2 bg-[var(--surface-2)]/70 border-b border-[var(--hairline)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[var(--surface-2)] p-0.5 rounded-xl border border-[var(--hairline)]">
              <button
                onClick={() => setActiveTab("shell")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "shell"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span>Python IDLE Shell</span>
              </button>
              <button
                onClick={() => setActiveTab("repl")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "repl"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffd43b]" />
                <span>Interactive REPL</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {execTime !== null && activeTab === "shell" && (
                <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{execTime}ms</span>
                </span>
              )}

              <button
                onClick={() => {
                  sfxClick();
                  if (activeTab === "shell") setOutput("");
                  else setReplHistory([]);
                }}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors px-2 py-1 rounded"
                title="Clear Shell"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Shell Body */}
          {activeTab === "shell" ? (
            <div
              ref={shellScrollRef}
              className="flex-1 min-h-[460px] p-4 bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text"
            >
              {output ? (
                output
              ) : (
                <div className="text-zinc-500 space-y-2">
                  <p className="text-zinc-400 font-bold">Python 3.12.7 Shell (Interactive IDLE Output)</p>
                  <p>&gt;&gt;&gt; Ready. Click &quot;Run Module&quot; or press F5 / ⌘↵ to execute your code.</p>
                  <p>&gt;&gt;&gt; Or click any of Vansh&apos;s programs above to run directly.</p>
                  <p>&gt;&gt;&gt; Output, print() statements, and traceback errors will stream here.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-[460px] p-4 bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 overflow-y-auto flex flex-col justify-between">
              {/* REPL History stream */}
              <div ref={replScrollRef} className="space-y-3 overflow-y-auto max-h-[390px] pr-1">
                <div className="text-zinc-500 text-xs pb-2 border-b border-zinc-800">
                  <p className="font-bold text-zinc-400">Python 3.12.7 Interactive Shell (REPL)</p>
                  <p>Type expressions or statements and press Enter. Use Up/Down arrows for history.</p>
                </div>

                {replHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-400 font-mono">
                      <span className="text-[#ffd43b]">&gt;&gt;&gt;</span>
                      <span className="text-zinc-200">{item.cmd}</span>
                    </div>
                    <div
                      className={`pl-5 font-mono text-xs whitespace-pre-wrap ${
                        item.isError ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {item.res}
                    </div>
                  </div>
                ))}
              </div>

              {/* REPL Input Bar */}
              <form onSubmit={handleReplSubmit} className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                <span className="text-[#ffd43b] font-mono font-bold">&gt;&gt;&gt;</span>
                <input
                  type="text"
                  value={replInput}
                  onChange={(e) => setReplInput(e.target.value)}
                  onKeyDown={handleReplKeyDown}
                  placeholder="e.g. 2**16, math.sqrt(144), [x for x in range(10)]"
                  className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!replInput.trim()}
                  className="px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-bold disabled:opacity-40"
                >
                  Enter
                </button>
              </form>
            </div>
          )}

          {/* Shell Footer */}
          <div className="px-4 py-2 bg-[var(--surface-2)]/40 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
            <span>Modules: math, random, json, sys, collections, statistics</span>
            <span>Standard IO Realtime Capture</span>
          </div>
        </div>
      </div>

      {/* Modal: Vansh's Programs Library (Run Directly OR Open in Editor) */}
      {showVanshModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="surface-elevated rounded-3xl p-6 max-w-2xl w-full border border-[var(--hairline)] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)]">
                    Vansh&apos;s Python Programs Library
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Click &quot;Run Directly&quot; to execute in the IDLE Shell, or &quot;Load into Editor&quot; to edit.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVanshModal(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-bold px-2 py-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {VANSH_PROGRAMS.map((prog) => (
                <div
                  key={prog.id}
                  className="surface p-4 rounded-2xl border border-[var(--hairline)] hover:border-amber-500/40 transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-mono text-sm font-bold text-[var(--ink)] group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-amber-500" />
                        <span>{prog.name}</span>
                        {prog.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                            {prog.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)]">{prog.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Run Directly Button */}
                      <button
                        onClick={() => handleRunVanshDirectly(prog)}
                        className="btn bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                        title="Run this program directly in the IDLE Shell"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Run Directly</span>
                      </button>

                      {/* Open in Editor Button */}
                      <button
                        onClick={() => handleLoadIntoEditor(prog)}
                        className="btn btn-secondary text-xs px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1"
                        title="Load code into editor"
                      >
                        <span>Open in Editor</span>
                      </button>
                    </div>
                  </div>

                  {/* Code preview snippet */}
                  <div className="p-2.5 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-24">
                    {prog.code.split("\n").slice(0, 5).join("\n")}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New User Program */}
      {showNewProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="surface-elevated rounded-3xl p-6 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <h3 className="font-bold text-sm text-[var(--ink)]">Create New Python Program</h3>
              <button
                onClick={() => setShowNewProgramModal(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewProgram} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">File Name</label>
                <div className="flex items-center gap-2 surface px-3 py-2 rounded-xl border border-[var(--hairline)]">
                  <FileCode className="w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={newProgName}
                    onChange={(e) => setNewProgName(e.target.value)}
                    placeholder="e.g. fibonacci.py"
                    autoFocus
                    className="flex-1 bg-transparent text-xs font-mono outline-none text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProgramModal(false)}
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

      {/* Modal: Delete User Program Confirmation */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="surface-elevated rounded-3xl p-6 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[var(--ink)]">Delete Program?</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Are you sure you want to delete <strong className="text-[var(--ink)] font-mono">{programToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
                className="btn btn-secondary flex-1 py-2 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUserProgram(programToDelete.id)}
                className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-xs"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
