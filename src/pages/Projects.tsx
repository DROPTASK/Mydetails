import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  FileCode2,
  FileText,
  FileImage,
  File,
  Upload,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Lock,
  ShieldCheck,
  Edit3,
  X,
  ExternalLink,
  Code,
  FileSpreadsheet,
  FileQuestion,
  CornerLeftUp,
  RefreshCw,
  Eye,
  Save,
  Play,
} from "lucide-react";
import {
  getAllProjectNodes,
  createProjectFolder,
  createProjectFile,
  uploadProjectFile,
  updateProjectFileContent,
  deleteProjectNode,
  normalizePath,
  type ProjectNode,
} from "../lib/projectFileSystem";
import { isAdminSession, setAdminSession, verifyAdminPassword } from "../lib/adminAuth";
import { sfxClick, sfxSuccess } from "../lib/sound";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(name: string, mime?: string | null) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext || "")) {
    return <FileImage className="w-5 h-5 text-amber-500" />;
  }
  if (["py"].includes(ext || "")) {
    return <FileCode2 className="w-5 h-5 text-emerald-500" />;
  }
  if (["js", "ts", "tsx", "jsx", "html", "css"].includes(ext || "")) {
    return <FileCode2 className="w-5 h-5 text-blue-500" />;
  }
  if (["json", "sql", "sh", "yaml", "yml"].includes(ext || "")) {
    return <FileSpreadsheet className="w-5 h-5 text-purple-500" />;
  }
  if (["md", "txt"].includes(ext || "")) {
    return <FileText className="w-5 h-5 text-[var(--accent)]" />;
  }
  return <File className="w-5 h-5 text-[var(--muted)]" />;
}

export function Projects({ isAdmin: propIsAdmin }: { isAdmin?: boolean }) {
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<ProjectNode | null>(null);

  // Admin State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => Boolean(propIsAdmin || isAdminSession()));
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [nodeToDelete, setNodeToDelete] = useState<ProjectNode | null>(null);

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  // Editing file content
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editFileContent, setEditFileContent] = useState("");

  // Copy feedback
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const handleRunInPython = (file: ProjectNode) => {
    sfxClick();
    navigate("/apps/python", {
      state: {
        loadCode: file.content || "",
        fileName: file.name,
        autoRun: true,
        projectNodeId: file.id,
        projectPath: file.path,
      },
    });
  };

  useEffect(() => {
    if (propIsAdmin !== undefined) {
      setIsAdmin(propIsAdmin);
    }
  }, [propIsAdmin]);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const data = await getAllProjectNodes();
      setNodes(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(adminPassword)) {
      sfxSuccess();
      setIsAdmin(true);
      setAdminSession(true);
      setShowAdminUnlock(false);
      setAdminPassword("");
      setUnlockError("");
    } else {
      setUnlockError("Incorrect password");
    }
  };

  // Filter nodes by current directory or search query
  const displayedNodes = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.path.toLowerCase().includes(q) ||
          (n.content && n.content.toLowerCase().includes(q))
      );
    }
    // Strict parent path match for folder navigation
    return nodes
      .filter((n) => n.parent_path === currentPath)
      .sort((a, b) => {
        // Folders first, then alphabetical
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [nodes, currentPath, searchQuery]);

  // Navigate into directory
  const handleOpenFolder = (folderPath: string) => {
    sfxClick();
    setCurrentPath(folderPath);
    setSearchQuery("");
  };

  // Go to parent directory
  const handleNavigateUp = () => {
    sfxClick();
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? `/${parts.join("/")}` : "/");
  };

  // Open file for viewing
  const handleOpenFile = (node: ProjectNode) => {
    sfxClick();
    setSelectedFile(node);
    setEditFileContent(node.content || "");
    setIsEditingFile(false);
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    sfxClick();
    const res = await createProjectFolder(currentPath, newFolderName);
    if (res.success && res.node) {
      sfxSuccess();
      setNodes((prev) => [...prev, res.node!]);
      setNewFolderName("");
      setShowNewFolderModal(false);
    }
  };

  // Create File
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    sfxClick();
    const res = await createProjectFile({
      parentPath: currentPath,
      fileName: newFileName,
      content: newFileContent,
    });
    if (res.success && res.node) {
      sfxSuccess();
      setNodes((prev) => [...prev, res.node!]);
      setNewFileName("");
      setNewFileContent("");
      setShowNewFileModal(false);
    }
  };

  // Upload File
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sfxClick();
    const res = await uploadProjectFile(currentPath, file);
    if (res.success && res.node) {
      sfxSuccess();
      setNodes((prev) => {
        const withoutOld = prev.filter((n) => n.path !== res.node!.path);
        return [...withoutOld, res.node!];
      });
    }
    e.target.value = "";
  };

  // Save File Edits
  const handleSaveFileEdits = async () => {
    if (!selectedFile) return;
    sfxClick();
    const res = await updateProjectFileContent(selectedFile.id, editFileContent);
    if (res.success && res.node) {
      sfxSuccess();
      setSelectedFile(res.node);
      setNodes((prev) => prev.map((n) => (n.id === res.node!.id ? res.node! : n)));
      setIsEditingFile(false);
    }
  };

  // Delete Node
  const handleDeleteNode = (node: ProjectNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfxClick();
    setNodeToDelete(node);
  };

  // Copy File text
  const handleCopyFile = () => {
    if (!selectedFile?.content) return;
    sfxClick();
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download File
  const handleDownloadFile = () => {
    if (!selectedFile) return;
    sfxClick();
    let url = selectedFile.file_url;
    if (!url) {
      const blob = new Blob([selectedFile.content || ""], { type: selectedFile.mime_type || "text/plain" });
      url = URL.createObjectURL(blob);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name;
    a.click();
  };

  // Breadcrumbs paths
  const pathBreadcrumbs = useMemo(() => {
    if (currentPath === "/") return [{ name: "root", path: "/" }];
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: "root", path: "/" }];
    let acc = "";
    for (const p of parts) {
      acc += `/${p}`;
      crumbs.push({ name: p, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      {/* Top Header & Admin Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--hairline)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight">
              Projects &amp; Filesystem
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Interactive computer path file explorer. Browse source repositories, code samples, notes, and uploaded project assets.
          </p>
        </div>

        {/* Admin Controls / Unlock */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Mode (Authoring Enabled)</span>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminUnlock((p) => !p)}
              className="btn btn-secondary px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Login</span>
            </button>
          )}

          <button
            onClick={loadNodes}
            className="icon-btn rounded-xl"
            style={{ width: 34, height: 34 }}
            title="Refresh Files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Admin Unlock Bar */}
      {showAdminUnlock && !isAdmin && (
        <form
          onSubmit={handleUnlockAdmin}
          className="p-3.5 surface-elevated rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-2"
        >
          <span className="text-xs font-bold text-[var(--ink)]">Admin Authorization:</span>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] flex-1 max-w-xs"
          />
          <button type="submit" className="btn btn-primary text-xs px-3.5 py-2 rounded-xl font-bold">
            Unlock
          </button>
          <button
            type="button"
            onClick={() => setShowAdminUnlock(false)}
            className="btn btn-secondary text-xs px-2.5 py-2 rounded-xl"
          >
            Cancel
          </button>
          {unlockError && <span className="text-xs text-rose-500 font-semibold">{unlockError}</span>}
        </form>
      )}

      {/* Breadcrumb Path Bar & Explorer Actions */}
      <div className="surface-elevated rounded-2xl p-3 border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Breadcrumb Links */}
        <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto no-scrollbar py-0.5">
          {currentPath !== "/" && (
            <button
              onClick={handleNavigateUp}
              className="icon-btn rounded-lg shrink-0 mr-1"
              style={{ width: 28, height: 28 }}
              title="Go to parent directory"
            >
              <CornerLeftUp className="w-3.5 h-3.5" />
            </button>
          )}

          {pathBreadcrumbs.map((crumb, idx) => (
            <div key={crumb.path} className="flex items-center gap-1 shrink-0">
              {idx > 0 && <span className="text-[var(--muted)] opacity-40 select-none">/</span>}
              <button
                onClick={() => handleOpenFolder(crumb.path)}
                className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                  crumb.path === currentPath
                    ? "bg-[var(--surface-2)] text-[var(--accent)] font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]/50"
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Right Search & Authoring Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search in projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-hidden w-44 sm:w-56"
            />
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                title="Create Folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">New Folder</span>
              </button>

              <button
                onClick={() => setShowNewFileModal(true)}
                className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                title="Create File"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">New File</span>
              </button>

              <button
                onClick={() => fileUploadInputRef.current?.click()}
                className="btn btn-primary text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                title="Upload Files"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <input
                ref={fileUploadInputRef}
                type="file"
                multiple
                onChange={handleUploadFile}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Directory Content List */}
      <div className="surface-elevated rounded-3xl border border-[var(--hairline)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-[var(--surface-2)] animate-pulse" />
            ))}
          </div>
        ) : displayedNodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] mx-auto">
              <Folder className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--ink)]">Folder is Empty</h3>
              <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                {isAdmin
                  ? "Create a new file, folder, or upload content here."
                  : "No public files in this folder."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--hairline)]">
            {displayedNodes.map((node) => {
              const isFolder = node.type === "folder";
              const childCount = isFolder
                ? nodes.filter((n) => n.parent_path === node.path).length
                : 0;

              return (
                <div
                  key={node.id}
                  onClick={() => (isFolder ? handleOpenFolder(node.path) : handleOpenFile(node))}
                  className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-2)]/60 cursor-pointer transition-colors group"
                >
                  {/* Left: Icon & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isFolder ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5 fill-current" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                        {getFileIcon(node.name, node.mime_type)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {node.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono flex items-center gap-2">
                        {isFolder ? (
                          <span>{childCount} {childCount === 1 ? "item" : "items"}</span>
                        ) : (
                          <span>{formatBytes(node.size_bytes)}</span>
                        )}
                        <span>•</span>
                        <span>{new Date(node.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isFolder && (
                      node.name.endsWith(".py") ||
                      node.name.endsWith(".pyw") ||
                      node.mime_type === "text/x-python" ||
                      Boolean(node.content && (node.content.includes("def ") || node.content.includes("print(") || node.content.includes("import ")))
                    ) && (
                      <button
                        onClick={() => handleRunInPython(node)}
                        className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95"
                        title="Run in Python Interpreter"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </button>
                    )}

                    {!isFolder && (
                      <button
                        onClick={() => handleOpenFile(node)}
                        className="btn btn-secondary text-xs px-2.5 py-1 rounded-lg font-medium hidden sm:inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteNode(node, e)}
                        className="icon-btn text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        style={{ width: 30, height: 30 }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isFolder && (
                      <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview & Editor Modal */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="surface-elevated rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[var(--hairline)] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-[var(--surface-2)]/70 border-b border-[var(--hairline)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(selectedFile.name, selectedFile.mime_type)}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[var(--ink)] truncate">
                      {selectedFile.name}
                    </h3>
                    <p className="text-[11px] text-[var(--muted)] font-mono truncate">
                      {selectedFile.path} • {formatBytes(selectedFile.size_bytes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(
                    selectedFile.name.endsWith(".py") ||
                    selectedFile.name.endsWith(".pyw") ||
                    selectedFile.mime_type === "text/x-python" ||
                    Boolean(selectedFile.content && (selectedFile.content.includes("def ") || selectedFile.content.includes("print(") || selectedFile.content.includes("import ")))
                  ) && (
                    <button
                      onClick={() => handleRunInPython(selectedFile)}
                      className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                      title="Run in Python Interpreter"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run in Python</span>
                    </button>
                  )}

                  {isAdmin && !isEditingFile && (
                    <button
                      onClick={() => setIsEditingFile(true)}
                      className="btn btn-secondary text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}

                  {isEditingFile && (
                    <button
                      onClick={handleSaveFileEdits}
                      className="btn btn-primary text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Changes</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyFile}
                    className="btn btn-secondary text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                    title="Copy content"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="btn btn-secondary text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                    title="Download file"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        const fileToDel = selectedFile;
                        setSelectedFile(null);
                        setIsEditingFile(false);
                        handleDeleteNode(fileToDel);
                      }}
                      className="btn bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 border border-rose-500/20"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setIsEditingFile(false);
                    }}
                    className="icon-btn rounded-lg ml-1"
                    style={{ width: 30, height: 30 }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100">
                {selectedFile.mime_type?.startsWith("image/") ||
                /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(selectedFile.name) ? (
                  <div className="flex items-center justify-center p-6 bg-black/40 rounded-2xl min-h-[300px]">
                    <img
                      src={selectedFile.file_url || selectedFile.content || ""}
                      alt={selectedFile.name}
                      className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : isEditingFile ? (
                  <textarea
                    value={editFileContent}
                    onChange={(e) => setEditFileContent(e.target.value)}
                    className="w-full h-full min-h-[420px] bg-transparent outline-none resize-none leading-relaxed font-mono text-zinc-100"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono">
                    {selectedFile.content || "Empty file."}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface-elevated rounded-3xl p-6 max-w-sm w-full border border-[var(--hairline)] shadow-xl space-y-4">
            <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-500" />
              <span>Create New Folder</span>
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Path: <span className="font-mono text-[var(--ink)]">{currentPath}</span>
            </p>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Folder name (e.g. backend, assets)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="btn btn-secondary text-xs px-3 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface-elevated rounded-3xl p-6 max-w-lg w-full border border-[var(--hairline)] shadow-xl space-y-4">
            <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald-500" />
              <span>Create New File</span>
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Path: <span className="font-mono text-[var(--ink)]">{currentPath}</span>
            </p>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="File name (e.g. script.py, config.json, note.md)"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] font-mono"
              />
              <textarea
                placeholder="# File content..."
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                rows={6}
                className="w-full text-xs p-3 rounded-xl bg-zinc-950 text-zinc-100 border border-[var(--hairline)] font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="btn btn-secondary text-xs px-3 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {nodeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-elevated rounded-3xl p-6 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Delete {nodeToDelete.type === "folder" ? "Folder" : "File"}?
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Are you sure you want to delete <strong className="text-[var(--ink)]">{nodeToDelete.name}</strong>?
                  {nodeToDelete.type === "folder" ? " All contents inside this folder will also be removed." : " This action cannot be undone."}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNodeToDelete(null)}
                  className="btn btn-secondary flex-1 py-2 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    sfxClick();
                    const target = nodeToDelete;
                    setNodeToDelete(null);
                    await deleteProjectNode(target.id, target.path);
                    setNodes((prev) =>
                      prev.filter((n) => n.id !== target.id && n.path !== target.path && !n.path.startsWith(`${target.path}/`))
                    );
                    if (selectedFile?.id === target.id || selectedFile?.path === target.path) {
                      setSelectedFile(null);
                    }
                    sfxSuccess();
                  }}
                  className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-xs"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
