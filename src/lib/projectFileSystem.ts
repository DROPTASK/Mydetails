import { supabase, isSupabaseConfigured } from "./supabase";

export type ProjectNodeType = "folder" | "file";

export type ProjectNode = {
  id: string;
  name: string;
  path: string; // e.g. "/web-apps/billiards"
  parent_path: string; // e.g. "/web-apps" or "/"
  type: ProjectNodeType;
  content?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  size_bytes?: number;
  created_at: string;
  updated_at: string;
};

const LOCAL_STORAGE_KEY = "vk_project_nodes_cache";

export const INITIAL_SEED_NODES: ProjectNode[] = [
  // 8-Ball Pool Project Folder
  {
    id: "folder_8ball",
    name: "8Ball-Pool",
    path: "/8Ball-Pool",
    parent_path: "/",
    type: "folder",
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "file_8ball_readme",
    name: "README.md",
    path: "/8Ball-Pool/README.md",
    parent_path: "/8Ball-Pool",
    type: "file",
    mime_type: "text/markdown",
    size_bytes: 684,
    content: `# 🎱 8-Ball Billiards Classic

An HTML5 Canvas billiards game featuring realistic ball collisions, cue spin dynamics, player-vs-AI, and local 2-player multiplayer.

### Features
- **Physics Engine**: 2D vector restitution and rotational friction.
- **Spin Control**: English spin (draw, follow, sidespin).
- **AI Opponents**: 3 difficulty levels with predictive trajectory raycasting.
- **Audio Effects**: Spatial ball-to-ball and cushion impact sound effects.

Integrated directly into Vansh Kumar's portfolio games lounge.
`,
    created_at: "2026-10-01T10:05:00.000Z",
    updated_at: "2026-10-01T10:05:00.000Z",
  },
  {
    id: "file_8ball_rules",
    name: "rules.json",
    path: "/8Ball-Pool/rules.json",
    parent_path: "/8Ball-Pool",
    type: "file",
    mime_type: "application/json",
    size_bytes: 312,
    content: `{
  "game": "8-Ball Pool",
  "balls": {
    "solids": [1, 2, 3, 4, 5, 6, 7],
    "black": 8,
    "stripes": [9, 10, 11, 12, 13, 14, 15],
    "cue": "white"
  },
  "foul_conditions": [
    "scratch_cue_ball",
    "wrong_ball_first_contact",
    "no_cushion_contact_after_hit"
  ]
}`,
    created_at: "2026-10-01T10:10:00.000Z",
    updated_at: "2026-10-01T10:10:00.000Z",
  },

  // Python Interpreter Project Folder
  {
    id: "folder_python",
    name: "Python-Interpreter",
    path: "/Python-Interpreter",
    parent_path: "/",
    type: "folder",
    created_at: "2026-10-02T12:00:00.000Z",
    updated_at: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "file_python_demo",
    name: "algorithms.py",
    path: "/Python-Interpreter/algorithms.py",
    parent_path: "/Python-Interpreter",
    type: "file",
    mime_type: "text/x-python",
    size_bytes: 720,
    content: `# Python Data Structures & Sorting
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [64, 34, 25, 12, 22, 11, 90]
print("Unsorted:", numbers)
sorted_nums = quicksort(numbers)
print("Sorted:  ", sorted_nums)
`,
    created_at: "2026-10-02T12:05:00.000Z",
    updated_at: "2026-10-02T12:05:00.000Z",
  },

  // CBSE Class 12 Computer Science Project Folder
  {
    id: "folder_class12",
    name: "CBSE-Class-12-CS",
    path: "/CBSE-Class-12-CS",
    parent_path: "/",
    type: "folder",
    created_at: "2026-10-03T09:00:00.000Z",
    updated_at: "2026-10-03T09:00:00.000Z",
  },
  {
    id: "file_stack_py",
    name: "linear_stack.py",
    path: "/CBSE-Class-12-CS/linear_stack.py",
    parent_path: "/CBSE-Class-12-CS",
    type: "file",
    mime_type: "text/x-python",
    size_bytes: 540,
    content: `# CBSE Class 12 CS - Stack Operations
stack = []

def push(item):
    stack.append(item)
    print(f"Pushed: {item}")

def pop():
    if not stack:
        print("Underflow! Stack is empty.")
        return None
    return stack.pop()

push(101)
push(202)
push(303)
print("Popped:", pop())
print("Remaining Stack:", stack)
`,
    created_at: "2026-10-03T09:10:00.000Z",
    updated_at: "2026-10-03T09:10:00.000Z",
  },
  {
    id: "file_sql_notes",
    name: "database_queries.sql",
    path: "/CBSE-Class-12-CS/database_queries.sql",
    parent_path: "/CBSE-Class-12-CS",
    type: "file",
    mime_type: "text/x-sql",
    size_bytes: 420,
    content: `-- SQL Table Creation & Queries
CREATE TABLE Student (
    RollNo INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Marks DECIMAL(5, 2),
    Grade CHAR(1)
);

INSERT INTO Student VALUES (1, 'Vansh Kumar', 96.5, 'A');
INSERT INTO Student VALUES (2, 'Arjun Singh', 92.0, 'A');

SELECT Name, Marks FROM Student WHERE Marks >= 90.0 ORDER BY Marks DESC;
`,
    created_at: "2026-10-03T09:15:00.000Z",
    updated_at: "2026-10-03T09:15:00.000Z",
  },
];

function getLocalNodes(): ProjectNode[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return INITIAL_SEED_NODES;
}

function saveLocalNodes(nodes: ProjectNode[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Normalizes directory/file paths, e.g. "/folder/sub"
 */
export function normalizePath(p: string): string {
  if (!p || p === "/") return "/";
  const cleaned = p.trim().replace(/\/+/g, "/").replace(/\/+$/, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

/**
 * Gets all nodes in the filesystem
 */
export async function getAllProjectNodes(): Promise<ProjectNode[]> {
  const local = getLocalNodes();

  if (!isSupabaseConfigured) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from("project_nodes")
      .select("*")
      .order("path", { ascending: true });

    if (!error && data && data.length > 0) {
      // Merge local and remote nodes so locally saved folders are never lost
      const mergedMap = new Map<string, ProjectNode>();
      data.forEach((n) => mergedMap.set(n.path, n));
      local.forEach((n) => {
        if (!mergedMap.has(n.path)) {
          mergedMap.set(n.path, n);
        }
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => a.path.localeCompare(b.path));
      saveLocalNodes(merged);
      return merged;
    }

    // If remote table is empty, seed it with initial projects
    if (!error && (!data || data.length === 0)) {
      try {
        await supabase.from("project_nodes").insert(local.length > 0 ? local : INITIAL_SEED_NODES);
      } catch {
        // Non-fatal
      }
    }
    return local;
  } catch {
    return local;
  }
}

function generateSafeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }
  // RFC4122 v4 compliant UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a folder at the specified parent path
 */
export async function createProjectFolder(
  parentPath: string,
  folderName: string
): Promise<{ success: boolean; node?: ProjectNode; error?: string }> {
  const cleanName = folderName.trim().replace(/[/\\:*?"<>|]/g, "-");
  if (!cleanName) return { success: false, error: "Please enter a valid folder name." };

  const normParent = normalizePath(parentPath);
  const fullPath = normParent === "/" ? `/${cleanName}` : `${normParent}/${cleanName}`;

  const local = getLocalNodes();
  if (local.some((n) => n.path === fullPath)) {
    return { success: false, error: `A folder or file already exists at "${fullPath}".` };
  }

  const now = new Date().toISOString();
  const newNode: ProjectNode = {
    id: generateSafeUUID(),
    name: cleanName,
    path: fullPath,
    parent_path: normParent,
    type: "folder",
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from("project_nodes").insert(newNode);
    } catch {
      // Ignore
    }
  }

  const updated = [...local, newNode];
  saveLocalNodes(updated);
  return { success: true, node: newNode };
}

/**
 * Creates a new text/code/markdown file at the specified parent path
 */
export async function createProjectFile({
  parentPath,
  fileName,
  content = "",
  mimeType,
}: {
  parentPath: string;
  fileName: string;
  content?: string;
  mimeType?: string;
}): Promise<{ success: boolean; node?: ProjectNode; error?: string }> {
  const cleanName = fileName.trim().replace(/[/\\:*?"<>|]/g, "-");
  if (!cleanName) return { success: false, error: "Please enter a valid file name." };

  const normParent = normalizePath(parentPath);
  const fullPath = normParent === "/" ? `/${cleanName}` : `${normParent}/${cleanName}`;

  const local = getLocalNodes();
  if (local.some((n) => n.path === fullPath)) {
    return { success: false, error: `A file or folder already exists at "${fullPath}".` };
  }

  let resolvedMime = mimeType;
  if (!resolvedMime) {
    if (cleanName.endsWith(".py")) resolvedMime = "text/x-python";
    else if (cleanName.endsWith(".js") || cleanName.endsWith(".ts") || cleanName.endsWith(".tsx")) resolvedMime = "text/javascript";
    else if (cleanName.endsWith(".html")) resolvedMime = "text/html";
    else if (cleanName.endsWith(".css")) resolvedMime = "text/css";
    else if (cleanName.endsWith(".json")) resolvedMime = "application/json";
    else if (cleanName.endsWith(".md")) resolvedMime = "text/markdown";
    else if (cleanName.endsWith(".sql")) resolvedMime = "text/x-sql";
    else resolvedMime = "text/plain";
  }

  const now = new Date().toISOString();
  const newNode: ProjectNode = {
    id: generateSafeUUID(),
    name: cleanName,
    path: fullPath,
    parent_path: normParent,
    type: "file",
    content,
    mime_type: resolvedMime,
    size_bytes: new Blob([content]).size,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from("project_nodes").insert(newNode);
    } catch {
      // Ignore
    }
  }

  const updated = [...local, newNode];
  saveLocalNodes(updated);
  return { success: true, node: newNode };
}

/**
 * Uploads a file (text, code, image, doc) to the specified parent path
 */
export async function uploadProjectFile(
  parentPath: string,
  file: File
): Promise<{ success: boolean; node?: ProjectNode; error?: string }> {
  const cleanName = file.name.trim().replace(/[/\\:*?"<>|]/g, "-");
  const normParent = normalizePath(parentPath);
  const fullPath = normParent === "/" ? `/${cleanName}` : `${normParent}/${cleanName}`;

  const isTextual =
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    /\.(py|js|ts|tsx|jsx|html|css|json|md|sql|txt|env|yml|yaml|xml|sh)$/i.test(cleanName);

  let fileContent: string | null = null;
  let fileUrl: string | null = null;

  try {
    if (isTextual) {
      fileContent = await file.text();
    } else {
      // Convert to base64 Data URL for standalone in-memory viewing / downloading
      fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      fileUrl = fileContent;
    }
  } catch (err) {
    return { success: false, error: `Could not process file: ${err instanceof Error ? err.message : String(err)}` };
  }

  const now = new Date().toISOString();
  const local = getLocalNodes();
  const existing = local.find((n) => n.path === fullPath);

  const newNode: ProjectNode = {
    id: existing ? existing.id : generateSafeUUID(),
    name: cleanName,
    path: fullPath,
    parent_path: normParent,
    type: "file",
    content: fileContent,
    file_url: fileUrl,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      if (existing) {
        await supabase.from("project_nodes").update(newNode).eq("id", newNode.id);
      } else {
        await supabase.from("project_nodes").insert(newNode);
      }
    } catch {
      // Ignore
    }
  }

  const updated = existing
    ? local.map((n) => (n.id === existing.id ? newNode : n))
    : [...local, newNode];

  saveLocalNodes(updated);
  return { success: true, node: newNode };
}

/**
 * Updates text content of an existing file
 */
export async function updateProjectFileContent(
  nodeId: string,
  newContent: string
): Promise<{ success: boolean; node?: ProjectNode; error?: string }> {
  const local = getLocalNodes();
  const node = local.find((n) => n.id === nodeId);
  if (!node || node.type !== "file") {
    return { success: false, error: "File not found" };
  }

  const now = new Date().toISOString();
  const updatedNode: ProjectNode = {
    ...node,
    content: newContent,
    size_bytes: new Blob([newContent]).size,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("project_nodes")
        .update({
          content: newContent,
          size_bytes: updatedNode.size_bytes,
          updated_at: now,
        })
        .eq("id", nodeId);
    } catch {
      // Ignore
    }
  }

  const updated = local.map((n) => (n.id === nodeId ? updatedNode : n));
  saveLocalNodes(updated);
  return { success: true, node: updatedNode };
}

/**
 * Deletes a file or directory recursively
 */
export async function deleteProjectNode(nodeId: string, nodePath?: string): Promise<boolean> {
  const local = getLocalNodes();
  const target = local.find((n) => n.id === nodeId || (nodePath && n.path === nodePath));
  if (!target) return false;

  const targetPath = target.path;
  // If folder, find all descendant paths starting with target.path + "/"
  const isDescendant = (n: ProjectNode) =>
    n.id === target.id || n.path === targetPath || n.path.startsWith(`${targetPath}/`);

  const nodesToDelete = local.filter(isDescendant);
  const idsToDelete = nodesToDelete.map((n) => n.id);

  if (isSupabaseConfigured) {
    try {
      // 1. Delete by exact path
      await supabase.from("project_nodes").delete().eq("path", targetPath);

      // 2. If folder, also delete all descendant files and subfolders
      if (target.type === "folder") {
        await supabase.from("project_nodes").delete().like("path", `${targetPath}/%`);
      }

      // 3. For any nodes with valid UUID format, delete by ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUuids = idsToDelete.filter((id) => uuidRegex.test(id));
      if (validUuids.length > 0) {
        await supabase.from("project_nodes").delete().in("id", validUuids);
      }
    } catch {
      // Non-fatal fallback to local deletion
    }
  }

  const remaining = local.filter((n) => !isDescendant(n));
  saveLocalNodes(remaining);
  return true;
}
