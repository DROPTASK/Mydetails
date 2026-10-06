/**
 * High-performance, zero-dependency Python Syntax Highlighter for Web Editor
 * Formats tokens with vivid Tailwind classes matching VS Code Dark+ / Python IDLE.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const KEYWORDS = new Set([
  "def", "class", "return", "if", "elif", "else", "for", "while",
  "try", "except", "finally", "with", "as", "import", "from",
  "pass", "break", "continue", "in", "is", "not", "and", "or",
  "lambda", "yield", "async", "await", "global", "nonlocal",
  "raise", "del", "assert", "match", "case"
]);

const BUILTINS = new Set([
  "print", "len", "range", "input", "str", "int", "float", "bool",
  "list", "dict", "set", "tuple", "sum", "max", "min", "abs",
  "round", "enumerate", "zip", "map", "filter", "all", "any",
  "open", "type", "isinstance", "issubclass", "super", "help",
  "dir", "id", "iter", "next", "sorted", "reversed", "pow", "chr", "ord"
]);

const CONSTANTS = new Set(["True", "False", "None"]);

export function highlightPythonCode(rawCode: string): string {
  if (!rawCode) return "<br />";

  const lines = rawCode.split("\n");
  let inDocstring: false | '"""' | "'''" = false;

  const highlightedLines = lines.map((line) => {
    // If inside triple-quoted string
    if (inDocstring) {
      const closeIdx = line.indexOf(inDocstring);
      if (closeIdx !== -1) {
        const docPart = line.slice(0, closeIdx + 3);
        const rest = line.slice(closeIdx + 3);
        inDocstring = false;
        return (
          `<span class="text-emerald-400 font-medium">${escapeHtml(docPart)}</span>` +
          tokenizePythonLine(rest)
        );
      } else {
        return `<span class="text-emerald-400 font-medium">${escapeHtml(line)}</span>`;
      }
    }

    // Check for start of docstring
    const d3Double = line.indexOf('"""');
    const d3Single = line.indexOf("'''");
    let docIdx = -1;
    let docMarker: '"""' | "'''" = '"""';

    if (d3Double !== -1 && (d3Single === -1 || d3Double < d3Single)) {
      docIdx = d3Double;
      docMarker = '"""';
    } else if (d3Single !== -1) {
      docIdx = d3Single;
      docMarker = "'''";
    }

    // Check if docstring is within a comment or regular string
    if (docIdx !== -1) {
      // Check if closing in the same line
      const afterStart = line.slice(docIdx + 3);
      const closeIdx = afterStart.indexOf(docMarker);
      if (closeIdx !== -1) {
        // Closed on same line
        const before = line.slice(0, docIdx);
        const docText = line.slice(docIdx, docIdx + 3 + closeIdx + 3);
        const after = line.slice(docIdx + 3 + closeIdx + 3);
        return (
          tokenizePythonLine(before) +
          `<span class="text-emerald-400 font-medium">${escapeHtml(docText)}</span>` +
          tokenizePythonLine(after)
        );
      } else {
        // Multiline start
        const before = line.slice(0, docIdx);
        const docText = line.slice(docIdx);
        inDocstring = docMarker;
        return (
          tokenizePythonLine(before) +
          `<span class="text-emerald-400 font-medium">${escapeHtml(docText)}</span>`
        );
      }
    }

    return tokenizePythonLine(line);
  });

  return highlightedLines.join("\n");
}

function tokenizePythonLine(line: string): string {
  if (!line) return "";

  let result = "";
  let i = 0;
  const len = line.length;

  while (i < len) {
    const char = line[i];

    // 1. Comments
    if (char === "#") {
      result += `<span class="text-zinc-500 italic">${escapeHtml(line.slice(i))}</span>`;
      break;
    }

    // 2. Strings ('...' or "...")
    // Support prefixes: f, r, b, u, fr, rf
    const isPrefix =
      (char === "f" || char === "r" || char === "b" || char === "u" || char === "F" || char === "R") &&
      (line[i + 1] === '"' || line[i + 1] === "'" ||
       ((char === "f" || char === "r") && (line[i + 1] === "r" || line[i + 1] === "f") && (line[i + 2] === '"' || line[i + 2] === "'")));

    if (char === '"' || char === "'" || isPrefix) {
      let prefixLen = 0;
      let q = char;
      if (isPrefix) {
        if (line[i + 1] === '"' || line[i + 1] === "'") {
          prefixLen = 1;
          q = line[i + 1];
        } else {
          prefixLen = 2;
          q = line[i + 2];
        }
      }

      let j = i + prefixLen + 1;
      let escaped = false;
      while (j < len) {
        if (!escaped && line[j] === q) {
          j++;
          break;
        }
        if (line[j] === "\\") escaped = !escaped;
        else escaped = false;
        j++;
      }

      const strText = line.slice(i, j);
      result += `<span class="text-emerald-400 font-medium">${escapeHtml(strText)}</span>`;
      i = j;
      continue;
    }

    // 3. Decorators
    if (char === "@" && /[a-zA-Z_]/.test(line[i + 1] || "")) {
      let j = i + 1;
      while (j < len && /[a-zA-Z0-9_.]/.test(line[j])) j++;
      result += `<span class="text-rose-400 font-semibold">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // 4. Identifiers, Keywords, Builtins, Functions
    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);

      // Check if followed by ( for function call
      let k = j;
      while (k < len && line[k] === " ") k++;
      const isCall = line[k] === "(";

      // Check if preceded by def or class
      const beforeWord = line.slice(0, i).trim();
      const isDef = beforeWord.endsWith("def");
      const isClass = beforeWord.endsWith("class");

      if (isDef) {
        result += `<span class="text-sky-400 font-bold">${escapeHtml(word)}</span>`;
      } else if (isClass) {
        result += `<span class="text-teal-300 font-bold">${escapeHtml(word)}</span>`;
      } else if (KEYWORDS.has(word)) {
        result += `<span class="text-purple-400 font-bold">${escapeHtml(word)}</span>`;
      } else if (CONSTANTS.has(word)) {
        result += `<span class="text-amber-400 font-semibold">${escapeHtml(word)}</span>`;
      } else if (word === "self" || word === "cls") {
        result += `<span class="text-orange-400 italic">${escapeHtml(word)}</span>`;
      } else if (BUILTINS.has(word)) {
        result += `<span class="text-yellow-300 font-medium">${escapeHtml(word)}</span>`;
      } else if (isCall) {
        result += `<span class="text-blue-300">${escapeHtml(word)}</span>`;
      } else {
        result += `<span class="text-zinc-100">${escapeHtml(word)}</span>`;
      }

      i = j;
      continue;
    }

    // 5. Numbers
    if (/[0-9]/.test(char)) {
      let j = i;
      while (j < len && /[0-9.a-fA-FxXoObBeE+-]/.test(line[j])) {
        if ((line[j] === "+" || line[j] === "-") && !/[eE]/.test(line[j - 1])) {
          break;
        }
        j++;
      }
      result += `<span class="text-cyan-300">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // 6. Operators & Punctuation
    if (/[=+\-*/%&|^~<>!:,;.]/.test(char)) {
      result += `<span class="text-pink-400 font-mono">${escapeHtml(char)}</span>`;
      i++;
      continue;
    }

    // 7. Brackets
    if (/[(){}[\]]/.test(char)) {
      result += `<span class="text-amber-200">${escapeHtml(char)}</span>`;
      i++;
      continue;
    }

    // 8. Other characters / whitespace
    result += escapeHtml(char);
    i++;
  }

  return result;
}
