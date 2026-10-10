import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  ArrowRight,
  School,
  Sun,
  Bed,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  BarChart2,
  CalendarDays,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  CBSE_12TH_SUBJECTS,
  SubjectInfo,
  SubjectChapter,
  PlanDay,
  PlanChapterTask,
  StrategyPlan,
  DayType,
  analyzePlanBacklog,
  formatFriendlyDate,
  formatLongDate,
  addDaysToDate,
  getTodayIso,
  loadSavedStrategyPlan,
  saveStrategyPlan,
  loadSyllabusProgress,
  saveSyllabusProgress,
  encodePlanToShareString,
  decodePlanFromShareString,
  generateDefault12thPlan,
  resetAttendanceSundaysOnly,
  clearAllPlanTasks,
  calculateDaysBetween,
  getDayOfWeek,
  SyllabusProgressItem,
} from "../lib/strategyData";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}
import { sfxClick, sfxSuccess } from "../lib/sound";

export function StrategyBuilder() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Plan State
  const [plan, setPlan] = useState<StrategyPlan>(() => loadSavedStrategyPlan());
  const [syllabusProgress, setSyllabusProgress] = useState<Record<string, SyllabusProgressItem>>(() =>
    loadSyllabusProgress()
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<"planner" | "syllabus" | "calendar" | "backlog">("planner");

  // Filter in Planner Tab
  const [dayFilter, setDayFilter] = useState<"all" | "working" | "holiday" | "self_leave" | "backlog">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Subject in Syllabus Tab
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("physics");

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [targetDateForNewTask, setTargetDateForNewTask] = useState<string>(getTodayIso());

  // Task creation form state
  const [selectedAddSubjectId, setSelectedAddSubjectId] = useState<string>("physics");
  const [selectedAddChapterId, setSelectedAddChapterId] = useState<string>("");
  const [selectedAddTaskType, setSelectedAddTaskType] = useState<PlanChapterTask["taskType"]>("Theory");
  const [selectedAddHours, setSelectedAddHours] = useState<number>(3);
  const [selectedAddNotes, setSelectedAddNotes] = useState<string>("");

  // Attendance Calendar Day Inspector & Quick-Edit state
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<PlanDay | null>(null);
  const [activeDropdownDate, setActiveDropdownDate] = useState<string | null>(null);

  // Share & Copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // New Plan Wizard state (bidirectional editable days or end date + option to make blank)
  const [wizardName, setWizardName] = useState(plan.studentName || "Vansh Kumar");
  const [wizardStartDate, setWizardStartDate] = useState(getTodayIso());
  const [wizardDuration, setWizardDuration] = useState<number>(60);
  const [wizardEndDate, setWizardEndDate] = useState<string>(addDaysToDate(getTodayIso(), 59));
  const [wizardMakeBlank, setWizardMakeBlank] = useState<boolean>(false);
  const [wizardSubjects, setWizardSubjects] = useState<string[]>(["physics", "chemistry", "mathematics", "cs", "english"]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const requestConfirm = (
    title: string,
    description: string,
    confirmLabel: string,
    onConfirm: () => void,
    isDestructive = true
  ) => {
    sfxClick();
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      confirmLabel,
      isDestructive,
      onConfirm: () => {
        setConfirmDialog(null);
        onConfirm();
      },
    });
  };

  const todayIso = useMemo(() => getTodayIso(), []);

  // Show toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize wizard duration -> end date
  const handleWizardDurationChange = (newDuration: number) => {
    const valid = Math.max(1, newDuration);
    setWizardDuration(valid);
    setWizardEndDate(addDaysToDate(wizardStartDate, valid - 1));
  };

  // Synchronize wizard end date -> duration
  const handleWizardEndDateChange = (newEndDate: string) => {
    setWizardEndDate(newEndDate);
    const calculatedDays = calculateDaysBetween(wizardStartDate, newEndDate);
    setWizardDuration(calculatedDays);
  };

  // Synchronize wizard start date -> end date
  const handleWizardStartDateChange = (newStartDate: string) => {
    setWizardStartDate(newStartDate);
    setWizardEndDate(addDaysToDate(newStartDate, wizardDuration - 1));
  };

  // Complete Reset of entire strategy plan (Back to standard CBSE default)
  const handleFullResetEntirePlan = () => {
    requestConfirm(
      "Reset Entire Strategy Plan?",
      "This will replace all customized dates, attendance settings, and chapter distributions with the official CBSE Class 12 standard plan. All custom assignments will be reset.",
      "Reset Everything",
      () => {
        const fresh = generateDefault12thPlan({ studentName: plan.studentName || "Vansh Kumar" });
        updatePlan(fresh);
        triggerToast("🔄 Complete reset complete! Standard Class 12 Strategy Plan restored.");
        sfxSuccess();
      },
      true
    );
  };

  // Clear All Tasks in Strategy Plan (Makes every date blank)
  const handleClearAllStrategyTasks = () => {
    requestConfirm(
      "Make Every Date Blank?",
      "Are you sure you want to clear all chapter assignments from your calendar? All dates will become completely blank so you can design your own schedule from scratch.",
      "Clear All Chapters",
      () => {
        const cleared = clearAllPlanTasks(plan);
        updatePlan(cleared);
        triggerToast("✨ Strategy cleared! Every date is now blank and ready for custom planning.");
        sfxSuccess();
      },
      true
    );
  };

  // Reset Attendance: Marks ONLY Sunday as holiday, rest as school work
  const handleResetAttendanceSundaysOnly = () => {
    requestConfirm(
      "Reset Attendance Matrix?",
      "This will reset all attendance marks across your entire schedule: only Sundays will be marked as Holiday, and every other day will be reset to School Working Day (0 self-leaves).",
      "Reset Attendance",
      () => {
        const updated = resetAttendanceSundaysOnly(plan);
        updatePlan(updated);
        if (selectedCalendarDay) {
          const refreshedDay = updated.days.find((d) => d.date === selectedCalendarDay.date) || null;
          setSelectedCalendarDay(refreshedDay);
        }
        setActiveDropdownDate(null);
        triggerToast("🏫 Attendance reset! Only Sundays marked as Holiday, rest set to School Working Day.");
        sfxSuccess();
      },
      false
    );
  };

  // Clear All Syllabus Mastery Checkmarks
  const handleClearAllSyllabusProgress = () => {
    requestConfirm(
      "Clear Syllabus Mastery?",
      "This will uncheck all concept completion, NCERT questions, and PYQs checkboxes across all subjects.",
      "Clear Checklists",
      () => {
        setSyllabusProgress({});
        saveSyllabusProgress({});
        triggerToast("✨ Syllabus mastery checklists cleared.");
        sfxSuccess();
      },
      true
    );
  };

  // Clear All Backlogs (Marks all overdue chapters caught up/done)
  const handleClearAllBacklogs = () => {
    requestConfirm(
      "Clear All Past Backlogs?",
      "This will mark all overdue uncompleted chapters prior to today as completed, putting your finish date target right back on schedule.",
      "Clear Backlogs",
      () => {
        const updatedDays = plan.days.map((d) => {
          if (d.date < todayIso) {
            return {
              ...d,
              tasks: d.tasks.map((t) => ({ ...t, completed: true })),
            };
          }
          return d;
        });

        updatePlan({ ...plan, days: updatedDays });
        triggerToast("🎉 All backlogs cleared! Target finish date is fully back on track.");
        sfxSuccess();
      },
      false
    );
  };

  // Check URL query parameters for shared plan on mount
  useEffect(() => {
    const sharedParam = searchParams.get("shared") || searchParams.get("plan");
    if (sharedParam) {
      const decoded = decodePlanFromShareString(sharedParam);
      if (decoded) {
        setPlan(decoded);
        saveStrategyPlan(decoded);
        triggerToast("🎉 Shared Class 12th Plan loaded successfully!");
        sfxSuccess();
      }
    }
  }, [searchParams]);

  // Sync plan changes to localStorage
  const updatePlan = (newPlan: StrategyPlan) => {
    setPlan(newPlan);
    saveStrategyPlan(newPlan);
  };

  // Backlog and Attendance Metrics calculation
  const metrics = useMemo(() => {
    return analyzePlanBacklog(plan);
  }, [plan]);

  // Selected subject for Syllabus tab
  const currentSubject = useMemo(() => {
    return CBSE_12TH_SUBJECTS.find((s) => s.id === selectedSubjectId) || CBSE_12TH_SUBJECTS[0];
  }, [selectedSubjectId]);

  // Auto-shift plan dates when user clicks "Auto-Shift Schedule by Backlog Days"
  const handleAutoShiftBacklog = () => {
    sfxClick();
    if (metrics.backlogDays <= 0) return;

    const shiftedDays = plan.days.map((d) => {
      // If date is today or in future, shift it by backlogDays
      if (d.date >= todayIso) {
        return {
          ...d,
          date: addDaysToDate(d.date, metrics.backlogDays),
        };
      }
      return d;
    });

    const newTargetEnd = addDaysToDate(plan.targetEndDate, metrics.backlogDays);
    const updated: StrategyPlan = {
      ...plan,
      targetEndDate: newTargetEnd,
      days: shiftedDays,
    };
    updatePlan(updated);
    triggerToast(`Shifted future schedule by +${metrics.backlogDays} backlog days!`);
    sfxSuccess();
  };

  // Toggle task completion
  const handleToggleTask = (dateStr: string, taskId: string) => {
    sfxClick();
    const updatedDays = plan.days.map((day) => {
      if (day.date !== dateStr) return day;
      return {
        ...day,
        tasks: day.tasks.map((task) => {
          if (task.id === taskId) {
            const nextDone = !task.completed;
            if (nextDone) sfxSuccess();
            return { ...task, completed: nextDone };
          }
          return task;
        }),
      };
    });

    updatePlan({
      ...plan,
      days: updatedDays,
    });
  };

  // Change Day Type (Working / Holiday / Self Leave)
  const handleChangeDayType = (dateStr: string, newType: DayType) => {
    sfxClick();
    const updatedDays = plan.days.map((day) => {
      if (day.date !== dateStr) return day;
      const hoursMap: Record<DayType, number> = {
        working: 5,
        holiday: 10,
        self_leave: 8.5,
      };
      return {
        ...day,
        dayType: newType,
        targetStudyHours: hoursMap[newType],
      };
    });

    updatePlan({
      ...plan,
      days: updatedDays,
    });
  };

  // Delete task from day
  const handleDeleteTask = (dateStr: string, taskId: string) => {
    sfxClick();
    const updatedDays = plan.days.map((day) => {
      if (day.date !== dateStr) return day;
      return {
        ...day,
        tasks: day.tasks.filter((t) => t.id !== taskId),
      };
    });
    updatePlan({
      ...plan,
      days: updatedDays,
    });
  };

  // Open modal to add task for specific date
  const handleOpenAddTask = (dateStr: string) => {
    sfxClick();
    setTargetDateForNewTask(dateStr);
    const defaultSub = CBSE_12TH_SUBJECTS[0];
    setSelectedAddSubjectId(defaultSub.id);
    setSelectedAddChapterId(defaultSub.chapters[0]?.id || "");
    setSelectedAddTaskType("Theory");
    setSelectedAddHours(3);
    setSelectedAddNotes("");
    setShowAddTaskModal(true);
  };

  // Submit new task
  const handleSaveNewTask = () => {
    sfxClick();
    const sub = CBSE_12TH_SUBJECTS.find((s) => s.id === selectedAddSubjectId);
    const chap = sub?.chapters.find((c) => c.id === selectedAddChapterId);
    if (!sub || !chap) return;

    const newTask: PlanChapterTask = {
      id: `task_${targetDateForNewTask}_${Date.now()}`,
      subjectId: sub.id,
      chapterId: chap.id,
      chapterName: chap.name,
      subjectName: sub.name,
      taskType: selectedAddTaskType,
      estHours: selectedAddHours,
      completed: false,
      notes: selectedAddNotes || undefined,
    };

    let foundDay = false;
    const updatedDays = plan.days.map((day) => {
      if (day.date === targetDateForNewTask) {
        foundDay = true;
        return {
          ...day,
          tasks: [...day.tasks, newTask],
        };
      }
      return day;
    });

    if (!foundDay) {
      updatedDays.push({
        date: targetDateForNewTask,
        dayType: "working",
        targetStudyHours: 5,
        tasks: [newTask],
      });
      updatedDays.sort((a, b) => a.date.localeCompare(b.date));
    }

    updatePlan({
      ...plan,
      days: updatedDays,
    });

    setShowAddTaskModal(false);
    triggerToast(`Added ${chap.name} to ${formatFriendlyDate(targetDateForNewTask)}`);
    sfxSuccess();
  };

  // Toggle Syllabus Progress Stage
  const handleToggleSyllabusStage = (
    chapterId: string,
    stage: keyof SyllabusProgressItem
  ) => {
    sfxClick();
    const current = syllabusProgress[chapterId] || {
      conceptDone: false,
      ncertDone: false,
      pyqsDone: false,
      revisionDone: false,
    };
    const nextVal = !current[stage];
    const updated = {
      ...syllabusProgress,
      [chapterId]: {
        ...current,
        [stage]: nextVal,
      },
    };
    setSyllabusProgress(updated);
    saveSyllabusProgress(updated);
    if (nextVal) sfxSuccess();
  };

  // Quick schedule chapter into Today's Plan
  const handleScheduleChapterToday = (subject: SubjectInfo, chapter: SubjectChapter) => {
    sfxClick();
    const newTask: PlanChapterTask = {
      id: `task_${todayIso}_${Date.now()}`,
      subjectId: subject.id,
      chapterId: chapter.id,
      chapterName: chapter.name,
      subjectName: subject.name,
      taskType: "Theory",
      estHours: Math.max(2, Math.round(chapter.estHours / 2)),
      completed: false,
      notes: `CBSE Chapter: ${chapter.unit} (${chapter.weightageMarks} marks)`,
    };

    let foundToday = false;
    const updatedDays = plan.days.map((day) => {
      if (day.date === todayIso) {
        foundToday = true;
        return {
          ...day,
          tasks: [...day.tasks, newTask],
        };
      }
      return day;
    });

    if (!foundToday) {
      updatedDays.unshift({
        date: todayIso,
        dayType: "working",
        targetStudyHours: 5,
        tasks: [newTask],
      });
    }

    updatePlan({
      ...plan,
      days: updatedDays,
    });
    triggerToast(`Added ${chapter.name} to Today's Plan!`);
    sfxSuccess();
  };

  // Copy share URL to clipboard
  const handleCopyShareLink = () => {
    sfxClick();
    const encoded = encodePlanToShareString(plan);
    const url = `${window.location.origin}/apps/strategy-builder?shared=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    triggerToast("Link copied to clipboard! Anyone can open & copy your plan.");
    sfxSuccess();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy plan JSON
  const handleCopyPlanJson = () => {
    sfxClick();
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopiedJson(true);
    triggerToast("Plan JSON copied to clipboard!");
    sfxSuccess();
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Import Plan from pasted string / JSON
  const handleImportPlan = () => {
    sfxClick();
    setImportError("");
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError("Please paste a share link, code, or JSON.");
      return;
    }

    // Try extracting shared query param if a full URL was pasted
    let candidate = trimmed;
    if (trimmed.includes("shared=") || trimmed.includes("plan=")) {
      try {
        const u = new URL(trimmed);
        candidate = u.searchParams.get("shared") || u.searchParams.get("plan") || trimmed;
      } catch {
        // regex match
        const match = trimmed.match(/[?&](?:shared|plan)=([^&#\s]+)/);
        if (match) candidate = match[1];
      }
    }

    // Try decoding base64 share string
    let decoded = decodePlanFromShareString(candidate);

    // Fallback: Try raw JSON parse
    if (!decoded) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && Array.isArray(parsed.days)) {
          decoded = parsed;
        }
      } catch {
        // failed
      }
    }

    if (decoded) {
      updatePlan(decoded);
      setShowImportModal(false);
      setImportText("");
      triggerToast("✅ Strategy Plan imported and loaded successfully!");
      sfxSuccess();
    } else {
      setImportError("Could not recognize this plan format. Ensure you pasted a valid share link or JSON.");
    }
  };

  // Create New Plan Wizard submit
  const handleCreateNewPlan = () => {
    sfxClick();
    const newPlan = generateDefault12thPlan({
      startDate: wizardStartDate,
      targetEndDate: wizardEndDate,
      durationDays: wizardDuration,
      studentName: wizardName,
      subjectIds: wizardSubjects,
      makeBlank: wizardMakeBlank,
    });
    updatePlan(newPlan);
    setShowNewPlanModal(false);
    triggerToast(
      wizardMakeBlank
        ? "🚀 Blank 12th Strategy created! You can now assign chapters."
        : "🚀 New 12th Board Strategy generated!"
    );
    sfxSuccess();
  };

  // Filtered days for planner view
  const filteredDays = useMemo(() => {
    return plan.days.filter((day) => {
      // Day Type Filter
      if (dayFilter === "working" && day.dayType !== "working") return false;
      if (dayFilter === "holiday" && day.dayType !== "holiday") return false;
      if (dayFilter === "self_leave" && day.dayType !== "self_leave") return false;
      if (dayFilter === "backlog") {
        const hasOverdue = day.date < todayIso && day.tasks.some((t) => !t.completed);
        if (!hasOverdue) return false;
      }

      // Search query in chapter or subject names
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTasks = day.tasks.some(
          (t) => t.chapterName.toLowerCase().includes(q) || t.subjectName.toLowerCase().includes(q)
        );
        const matchesDate = day.date.includes(q) || (day.label && day.label.toLowerCase().includes(q));
        if (!matchesTasks && !matchesDate) return false;
      }

      return true;
    });
  }, [plan.days, dayFilter, searchQuery, todayIso]);

  // Overall Syllabus Progress percentage
  const overallSyllabusStats = useMemo(() => {
    let totalChapters = 0;
    let completedChapters = 0;
    for (const sub of CBSE_12TH_SUBJECTS) {
      for (const ch of sub.chapters) {
        totalChapters++;
        const p = syllabusProgress[ch.id];
        if (p && (p.conceptDone || p.ncertDone || p.pyqsDone)) {
          completedChapters++;
        }
      }
    }
    const pct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    return { totalChapters, completedChapters, pct };
  }, [syllabusProgress]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification (Ultra-Glassmorphism Body with frosted blur, subtle gradient border & depth) */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm sm:max-w-md bg-white/70 dark:bg-zinc-900/75 backdrop-blur-xl border border-white/40 dark:border-white/10 text-[var(--ink)] px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/5 dark:ring-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-relaxed tracking-normal break-words text-[var(--ink)]">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="w-5 h-5 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)] mb-1">
            <Link to="/apps" className="hover:text-[var(--ink)] transition-colors">
              Apps
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--accent)] font-semibold">Strategy Builder (12th)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--ink)] flex items-center gap-2.5">
            <span>🎯 Strategy Builder (12th)</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              CBSE Class 12 Boards
            </span>
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Datewise chapter studying play, school attendance, holidays &amp; self-leave tracker with dynamic backlog calculator.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              sfxClick();
              setShowShareModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 shadow-sm transition-all"
            title="Share or Copy your study plan with friends"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Plan</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] text-[var(--ink)] text-xs font-semibold hover:border-[var(--accent)]/40 transition-all"
            title="Paste and duplicate a shared study strategy"
          >
            <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Copy Shared Plan</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              setShowNewPlanModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] text-[var(--ink)] text-xs font-semibold hover:border-[var(--accent)]/40 transition-all"
            title="Generate a fresh customized strategy"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>New Strategy</span>
          </button>

          <button
            onClick={handleFullResetEntirePlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-all cursor-pointer"
            title="Reset complete strategy back to default CBSE Class 12th curriculum"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Plan</span>
          </button>
        </div>
      </div>

      {/* CORE METRICS DASHBOARD - Explicitly includes Holidays, Self-Leave, School Working Days, and Backlog End Date */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1. School Working Days */}
        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">School Working</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--ink)]">{metrics.totalWorkingDays} <span className="text-xs font-normal text-[var(--muted)]">Days</span></div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">Regular school hours (~5h study)</div>
          </div>
        </div>

        {/* 2. Official Holidays & Sundays */}
        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Holidays &amp; Sundays</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.totalHolidays} <span className="text-xs font-normal text-[var(--muted)]">Days</span></div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">Full-throttle prep (~10-12h study)</div>
          </div>
        </div>

        {/* 3. Self Leaves (School Bunks / Prep Leaves) */}
        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Self Leaves (School)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.totalSelfLeaves} <span className="text-xs font-normal text-[var(--muted)]">Days</span></div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">Planned bunks for self-study</div>
          </div>
        </div>

        {/* 4. DYNAMIC BACKLOG & END DATE CALCULATOR */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
          metrics.hasActiveBacklog
            ? "bg-rose-500/10 border-rose-500/30"
            : "surface-elevated border-[var(--hairline)]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Target Finish Date
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              metrics.hasActiveBacklog ? "bg-rose-500/20 text-rose-500" : "bg-blue-500/10 text-blue-500"
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-lg font-black text-[var(--ink)] leading-snug">
              {formatLongDate(metrics.adjustedEndDate)}
            </div>

            {metrics.hasActiveBacklog ? (
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>+{metrics.backlogDays}d backlog delay (Orig: {formatFriendlyDate(metrics.originalEndDate)})</span>
              </div>
            ) : (
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>On track! Zero backlog delay</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC BACKLOG ALERT BANNER (If backlog is detected) */}
      {metrics.hasActiveBacklog && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--ink)]">
                Backlog Alert: {metrics.backlogTasksCount} Incomplete Chapters Detected!
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Because 1 day of backlog extends your syllabus target by 1 day, your projected finish date is now{" "}
                <span className="font-bold text-[var(--ink)]">{formatLongDate(metrics.adjustedEndDate)}</span> (+{metrics.backlogDays} days).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoShiftBacklog}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shift Schedule (+{metrics.backlogDays}d)</span>
            </button>
            <button
              onClick={() => {
                sfxClick();
                setActiveTab("backlog");
              }}
              className="px-3 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:border-[var(--accent)]/40 transition-colors"
            >
              View Backlog
            </button>
          </div>
        </div>
      )}

      {/* PROGRESS & SYLLABUS COMPLETION BAR */}
      <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)]">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--ink)]">{plan.title}</span>
            <span className="text-[var(--muted)]">•</span>
            <span className="text-[var(--muted)]">{plan.studentName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--accent)]">
              {metrics.completedTasksCount} / {metrics.totalTasksCount} Chapters Completed ({metrics.completionRatePercent}%)
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(2, metrics.completionRatePercent))}%` }}
          />
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-[var(--hairline)] gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              sfxClick();
              setActiveTab("planner");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "planner"
                ? "bg-[var(--accent)] text-white shadow"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Datewise Study Planner</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              setActiveTab("syllabus");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "syllabus"
                ? "bg-[var(--accent)] text-white shadow"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject-wise Syllabus &amp; PDFs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {overallSyllabusStats.pct}%
            </span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              setActiveTab("calendar");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "calendar"
                ? "bg-[var(--accent)] text-white shadow"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance Calendar</span>
          </button>

          <button
            onClick={() => {
              sfxClick();
              setActiveTab("backlog");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "backlog"
                ? "bg-[var(--accent)] text-white shadow"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Backlog Analyzer</span>
            {metrics.hasActiveBacklog && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Jump to Today Button */}
        {activeTab === "planner" && (
          <button
            onClick={() => {
              sfxClick();
              const el = document.getElementById(`day-${todayIso}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="px-3 py-1.5 rounded-lg border border-[var(--hairline)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors shrink-0"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* TAB 1: DATEWISE STUDY PLANNER */}
      {activeTab === "planner" && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 surface-elevated p-3 rounded-2xl border border-[var(--hairline)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[var(--muted)] mr-1">Filter Days:</span>
              <button
                onClick={() => {
                  sfxClick();
                  setDayFilter("all");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dayFilter === "all" ? "bg-[var(--ink)] text-[var(--surface)]" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                All Days ({plan.days.length})
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  setDayFilter("working");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dayFilter === "working" ? "bg-amber-500 text-black" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                🏫 School ({metrics.totalWorkingDays})
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  setDayFilter("holiday");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dayFilter === "holiday" ? "bg-emerald-500 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                🏖️ Holidays ({metrics.totalHolidays})
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  setDayFilter("self_leave");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dayFilter === "self_leave" ? "bg-purple-500 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                🛌 Self Leaves ({metrics.totalSelfLeaves})
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  setDayFilter("backlog");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dayFilter === "backlog" ? "bg-rose-500 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                ⚠️ Backlogs
              </button>
            </div>

            {/* Right Toolbar Actions: Clear All & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleClearAllStrategyTasks}
                className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Make every date blank by clearing all assigned chapters"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Make All Dates Blank</span>
              </button>

              {/* Quick Search */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapter, subject..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Days Stream */}
          <div className="space-y-3.5">
            {filteredDays.length === 0 ? (
              <div className="text-center py-12 surface-elevated rounded-2xl border border-[var(--hairline)]">
                <Calendar className="w-8 h-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[var(--ink)]">No study days match your filter.</p>
                <p className="text-xs text-[var(--muted)] mt-1">Try resetting the filter to "All Days".</p>
              </div>
            ) : (
              filteredDays.map((day) => {
                const isToday = day.date === todayIso;
                const isPast = day.date < todayIso;
                const hasBacklog = isPast && day.tasks.some((t) => !t.completed);

                return (
                  <div
                    key={day.date}
                    id={`day-${day.date}`}
                    className={`surface-elevated rounded-2xl border transition-all ${
                      isToday
                        ? "border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20"
                        : hasBacklog
                        ? "border-rose-500/40 bg-rose-500/[0.02]"
                        : "border-[var(--hairline)] hover:border-[var(--accent)]/30"
                    } p-4`}
                  >
                    {/* Day Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] pb-2.5 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--ink)]">
                              {formatFriendlyDate(day.date)}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">
                                TODAY
                              </span>
                            )}
                            {hasBacklog && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                BACKLOG
                              </span>
                            )}
                          </div>
                          {day.label && (
                            <div className="text-[11px] text-[var(--muted)] font-medium">{day.label}</div>
                          )}
                        </div>
                      </div>

                      {/* Day Type Selector Buttons: School Working, Holiday, Self Leave */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="inline-flex rounded-xl bg-[var(--surface-2)] p-0.5 border border-[var(--hairline)]">
                          <button
                            onClick={() => handleChangeDayType(day.date, "working")}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                              day.dayType === "working"
                                ? "bg-amber-500 text-black shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                            title="School working day (5h study target)"
                          >
                            <School className="w-3 h-3" />
                            <span>School</span>
                          </button>

                          <button
                            onClick={() => handleChangeDayType(day.date, "holiday")}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                              day.dayType === "holiday"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                            title="Official Holiday / Sunday (10h study target)"
                          >
                            <Sun className="w-3 h-3" />
                            <span>Holiday</span>
                          </button>

                          <button
                            onClick={() => handleChangeDayType(day.date, "self_leave")}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                              day.dayType === "self_leave"
                                ? "bg-purple-500 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                            title="School self-leave / prep bunk (8.5h study target)"
                          >
                            <Bed className="w-3 h-3" />
                            <span>Self-Leave</span>
                          </button>
                        </div>

                        {/* Add Chapter to this day button */}
                        <button
                          onClick={() => handleOpenAddTask(day.date)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] transition-colors"
                          title="Add another chapter to this day"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Chapter</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Scheduled Chapters (Multiple chapters per day supported!) */}
                    {day.tasks.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--hairline)] rounded-xl">
                        No chapters assigned for this date yet.{" "}
                        <button
                          onClick={() => handleOpenAddTask(day.date)}
                          className="text-[var(--accent)] font-bold underline ml-1"
                        >
                          + Add a chapter
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {day.tasks.map((task) => {
                          const subject = CBSE_12TH_SUBJECTS.find((s) => s.id === task.subjectId);
                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                task.completed
                                  ? "bg-emerald-500/[0.04] border-emerald-500/20 opacity-80"
                                  : isPast
                                  ? "bg-rose-500/[0.03] border-rose-500/20"
                                  : "bg-[var(--surface)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                              }`}
                            >
                              {/* Left Checkbox & Chapter Info */}
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  onClick={() => handleToggleTask(day.date, task.id)}
                                  className={`mt-0.5 shrink-0 rounded-lg transition-transform active:scale-90 ${
                                    task.completed
                                      ? "text-emerald-500"
                                      : isPast
                                      ? "text-rose-400 hover:text-rose-500"
                                      : "text-[var(--muted)] hover:text-[var(--accent)]"
                                  }`}
                                  title={task.completed ? "Mark incomplete" : "Mark completed"}
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/10" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Subject Tag */}
                                    <span
                                      className="text-[10px] font-black px-2 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: subject?.bgLight || "rgba(59, 130, 246, 0.1)",
                                        color: subject?.color || "#3b82f6",
                                      }}
                                    >
                                      {subject?.icon} {task.subjectName}
                                    </span>

                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)]">
                                      {task.taskType}
                                    </span>

                                    <span className="text-[10px] text-[var(--muted)] flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" />
                                      <span>{task.estHours}h</span>
                                    </span>
                                  </div>

                                  <div
                                    className={`font-bold text-xs sm:text-sm mt-1 truncate ${
                                      task.completed ? "line-through text-[var(--muted)]" : "text-[var(--ink)]"
                                    }`}
                                  >
                                    {task.chapterName}
                                  </div>

                                  {task.notes && (
                                    <div className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                                      {task.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleDeleteTask(day.date, task.id)}
                                  className="p-1 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Remove chapter from this day"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT-WISE SYLLABUS & OFFICIAL CBSE PDF VIEWER */}
      {activeTab === "syllabus" && (
        <div className="space-y-4">
          {/* Subject Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CBSE_12TH_SUBJECTS.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              let done = 0;
              for (const ch of sub.chapters) {
                if (syllabusProgress[ch.id]?.conceptDone) done++;
              }
              const pct = Math.round((done / sub.chapters.length) * 100);

              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    sfxClick();
                    setSelectedSubjectId(sub.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-[var(--accent)] shadow-md bg-[var(--surface-elevated)]"
                      : "surface-elevated border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{sub.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)]">
                      Code {sub.code}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[var(--ink)] mt-2">{sub.name}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">
                    {sub.chapters.length} Ch • {pct}% done
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Subject Detail & Official PDF Curriculum Card */}
          <div className="surface-elevated p-5 rounded-2xl border border-[var(--hairline)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentSubject.icon}</span>
                  <div>
                    <h2 className="text-lg font-black text-[var(--ink)]">
                      {currentSubject.name} (Code: {currentSubject.code})
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      CBSE Class 12 Curriculum • Theory: {currentSubject.totalTheoryMarks} Marks + Practical: {currentSubject.practicalMarks} Marks
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Clear & Official CBSE Syllabus PDF Link */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleClearAllSyllabusProgress}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                  title="Clear all chapter mastery checkboxes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Checklists</span>
                </button>

                <a
                  href={currentSubject.officialPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                  title="Open Official CBSE Academic Syllabus Document"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CBSE Official Syllabus PDF</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Chapters Table & 4-Stage Mastery Progress */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Class 12 Chapters, Marks Weightage &amp; Mastery Checklist:
              </div>

              <div className="space-y-2.5">
                {currentSubject.chapters.map((ch, idx) => {
                  const progress = syllabusProgress[ch.id] || {
                    conceptDone: false,
                    ncertDone: false,
                    pyqsDone: false,
                    revisionDone: false,
                  };

                  return (
                    <div
                      key={ch.id}
                      className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[var(--muted)]">Ch {idx + 1}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {ch.unit}
                            </span>
                            {ch.weightageMarks && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                ~{ch.weightageMarks} Marks
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              ch.difficulty === "Hard"
                                ? "bg-rose-500/10 text-rose-500"
                                : ch.difficulty === "Medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-emerald-500/10 text-emerald-500"
                            }`}>
                              {ch.difficulty}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-[var(--ink)] mt-1">{ch.name}</div>
                          <div className="text-[11px] text-[var(--muted)] mt-0.5">
                            Key Topics: {ch.topics.join(" • ")}
                          </div>
                        </div>

                        {/* 1-Click Schedule to Today */}
                        <button
                          onClick={() => handleScheduleChapterToday(currentSubject, ch)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] transition-colors flex items-center gap-1 shrink-0"
                          title="Schedule this chapter directly into today's study plan"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Today</span>
                        </button>
                      </div>

                      {/* 4-Stage Mastery Checkboxes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--hairline)]">
                        <label className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={progress.conceptDone}
                            onChange={() => handleToggleSyllabusStage(ch.id, "conceptDone")}
                            className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span className={progress.conceptDone ? "font-bold text-[var(--ink)]" : ""}>
                            1. Theory Concepts
                          </span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={progress.ncertDone}
                            onChange={() => handleToggleSyllabusStage(ch.id, "ncertDone")}
                            className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span className={progress.ncertDone ? "font-bold text-[var(--ink)]" : ""}>
                            2. NCERT Exercises
                          </span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={progress.pyqsDone}
                            onChange={() => handleToggleSyllabusStage(ch.id, "pyqsDone")}
                            className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span className={progress.pyqsDone ? "font-bold text-[var(--ink)]" : ""}>
                            3. Board PYQs
                          </span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={progress.revisionDone}
                            onChange={() => handleToggleSyllabusStage(ch.id, "revisionDone")}
                            className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          <span className={progress.revisionDone ? "font-bold text-[var(--ink)]" : ""}>
                            4. Final Revision
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & CALENDAR MATRIX (MINIMAL LAYOUT & MINIMAL DROPDOWN MENU) */}
      {activeTab === "calendar" && (
        <div className="surface-elevated p-4 sm:p-5 rounded-2xl border border-[var(--hairline)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] pb-3.5">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Attendance Calendar</h2>
              <p className="text-xs text-[var(--muted)]">
                Click any date to quickly toggle School Working, Holiday, or Self-Leave via the minimal menu.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Working Reset Attendance Button */}
              <button
                type="button"
                onClick={handleResetAttendanceSundaysOnly}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Marks only Sundays as Holiday, and every other day as School Working Day (0 self-leaves)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset (Sundays Only)</span>
              </button>

              {/* Minimal Attendance Metrics Badges */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  School: {metrics.totalWorkingDays}d
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Holidays: {metrics.totalHolidays}d
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Leaves: {metrics.totalSelfLeaves}d
                </span>
              </div>
            </div>
          </div>

          {/* Minimal Calendar Grid with Sunday-Saturday Alignment */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] pb-1 border-b border-[var(--hairline)]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                <div key={dayName} className={idx === 0 ? "text-emerald-500 font-extrabold" : ""}>
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Leading Empty Spacer Cells for Day of Week Alignment */}
              {plan.days.length > 0 &&
                Array.from({ length: getDayOfWeek(plan.days[0].date) }).map((_, i) => (
                  <div key={`lead-pad-${i}`} className="opacity-0 pointer-events-none rounded-xl" />
                ))}

              {/* Minimal Attendance Calendar Day Cells */}
              {plan.days.map((day) => {
                const isToday = day.date === todayIso;
                const isPast = day.date < todayIso;
                const hasBacklog = isPast && day.tasks.some((t) => !t.completed);
                const isDropdownOpen = activeDropdownDate === day.date;
                const dayParts = day.date.split("-");
                const dayNumber = parseInt(dayParts[2], 10);
                const monthShort = new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                  month: "short",
                });

                return (
                  <div key={day.date} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        sfxClick();
                        setActiveDropdownDate(isDropdownOpen ? null : day.date);
                      }}
                      className={`w-full p-2 sm:p-2.5 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between min-h-[66px] sm:min-h-[74px] ${
                        isToday
                          ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)] bg-[var(--surface-elevated)]"
                          : "bg-[var(--surface)] hover:border-[var(--hairline-strong)] hover:shadow-xs"
                      } ${
                        day.dayType === "holiday"
                          ? "border-emerald-500/35 bg-emerald-500/[0.04]"
                          : day.dayType === "self_leave"
                          ? "border-purple-500/35 bg-purple-500/[0.04]"
                          : "border-[var(--hairline)]"
                      }`}
                      title={`${formatFriendlyDate(day.date)}: ${
                        day.dayType === "holiday"
                          ? "Holiday"
                          : day.dayType === "self_leave"
                          ? "Self-Leave"
                          : "School"
                      } • Click to change`}
                    >
                      {/* Top: Date Number, Month & Attendance Dot */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-xs sm:text-sm text-[var(--ink)]">
                            {dayNumber}
                          </span>
                          <span className="text-[9px] font-medium text-[var(--muted)]">
                            {monthShort}
                          </span>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            day.dayType === "holiday"
                              ? "bg-emerald-500"
                              : day.dayType === "self_leave"
                              ? "bg-purple-500"
                              : "bg-amber-500"
                          }`}
                        />
                      </div>

                      {/* Middle: Minimal Attendance Tag */}
                      <div className="my-1">
                        <span
                          className={`inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            day.dayType === "holiday"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : day.dayType === "self_leave"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {day.dayType === "holiday"
                            ? "🏖️ Holiday"
                            : day.dayType === "self_leave"
                            ? "🛌 Leave"
                            : "🏫 School"}
                        </span>
                      </div>

                      {/* Bottom: Task Counter & Backlog Indicator */}
                      <div className="flex items-center justify-between w-full text-[9px]">
                        <span className="text-[var(--muted)] font-medium">
                          {day.tasks.length > 0 ? `${day.tasks.length} ch` : "—"}
                        </span>
                        {hasBacklog && (
                          <span className="font-black text-rose-500">Backlog</span>
                        )}
                      </div>
                    </button>

                    {/* Minimal DropdownMenu for Selected Date */}
                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownDate(null);
                          }}
                        />
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-40 top-full left-0 sm:left-auto sm:right-0 mt-1.5 w-48 sm:w-52 p-1.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--hairline-strong)] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 text-left"
                        >
                          <div className="px-2.5 py-1.5 border-b border-[var(--hairline)] mb-1 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[var(--ink)]">
                              {formatFriendlyDate(day.date)}
                            </span>
                            <span className="text-[9px] font-semibold text-[var(--muted)] uppercase">
                              Attendance
                            </span>
                          </div>

                          {/* Option 1: School Working */}
                          <button
                            type="button"
                            onClick={() => {
                              handleChangeDayType(day.date, "working");
                              setActiveDropdownDate(null);
                              triggerToast(`Marked ${formatFriendlyDate(day.date)}: School Working`);
                              sfxClick();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              day.dayType === "working"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
                                : "text-[var(--ink)] hover:bg-[var(--surface-2)] font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <School className="w-3.5 h-3.5 text-amber-500" />
                              <span>School Working</span>
                            </div>
                            {day.dayType === "working" && (
                              <Check className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </button>

                          {/* Option 2: Official Holiday */}
                          <button
                            type="button"
                            onClick={() => {
                              handleChangeDayType(day.date, "holiday");
                              setActiveDropdownDate(null);
                              triggerToast(`Marked ${formatFriendlyDate(day.date)}: Holiday`);
                              sfxClick();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              day.dayType === "holiday"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                                : "text-[var(--ink)] hover:bg-[var(--surface-2)] font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Sun className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Holiday / Sunday</span>
                            </div>
                            {day.dayType === "holiday" && (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </button>

                          {/* Option 3: Self Leave */}
                          <button
                            type="button"
                            onClick={() => {
                              handleChangeDayType(day.date, "self_leave");
                              setActiveDropdownDate(null);
                              triggerToast(`Marked ${formatFriendlyDate(day.date)}: Self-Leave`);
                              sfxClick();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              day.dayType === "self_leave"
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold"
                                : "text-[var(--ink)] hover:bg-[var(--surface-2)] font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Bed className="w-3.5 h-3.5 text-purple-500" />
                              <span>Self-Leave (Bunk)</span>
                            </div>
                            {day.dayType === "self_leave" && (
                              <Check className="w-3.5 h-3.5 text-purple-500" />
                            )}
                          </button>

                          <div className="my-1 border-t border-[var(--hairline)]" />

                          {/* Quick Actions: Add Chapter / View in Planner */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownDate(null);
                              handleOpenAddTask(day.date);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Add Chapter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownDate(null);
                              setActiveTab("planner");
                              setTimeout(() => {
                                const el = document.getElementById(`day-${day.date}`);
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 100);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>View in Planner</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKLOG & RECOVERY CENTER */}
      {activeTab === "backlog" && (
        <div className="surface-elevated p-5 rounded-2xl border border-[var(--hairline)] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
            <div>
              <h2 className="text-lg font-black text-[var(--ink)]">Backlog &amp; Recovery Intelligence</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Every 1 day of backlog dynamically pushes your target finish date by 1 day.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {metrics.hasActiveBacklog && (
                <>
                  <button
                    onClick={handleClearAllBacklogs}
                    className="px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Mark all overdue chapters from past days completed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Clear All Backlog</span>
                  </button>

                  <button
                    onClick={handleAutoShiftBacklog}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto-Shift Calendar by +{metrics.backlogDays} Days</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Overdue Tasks</span>
              <div className="text-2xl font-black text-rose-500 mt-1">{metrics.backlogTasksCount}</div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Chapters from past dates not yet checked off.</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">End Date Delay</span>
              <div className="text-2xl font-black text-amber-500 mt-1">+{metrics.backlogDays} Days</div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Target date shifted from {formatFriendlyDate(metrics.originalEndDate)} to {formatFriendlyDate(metrics.adjustedEndDate)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Available Recovery Slots</span>
              <div className="text-2xl font-black text-emerald-500 mt-1">{metrics.totalHolidays + metrics.totalSelfLeaves}</div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">Holidays and self-leaves available to catch up.</p>
            </div>
          </div>

          {/* List of Backlog Tasks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Overdue Chapters:</h3>
            {metrics.backlogTasksCount === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.03]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-[var(--ink)]">Zero Backlog! You are completely up to date.</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">All scheduled tasks prior to today have been completed.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {plan.days
                  .filter((d) => d.date < todayIso && d.tasks.some((t) => !t.completed))
                  .map((d) => (
                    <div key={d.date} className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.02] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          Scheduled for {formatFriendlyDate(d.date)}
                        </span>
                        <button
                          onClick={() => {
                            sfxClick();
                            // Mark all tasks on this date completed
                            const updated = plan.days.map((day) => {
                              if (day.date !== d.date) return day;
                              return {
                                ...day,
                                tasks: day.tasks.map((t) => ({ ...t, completed: true })),
                              };
                            });
                            updatePlan({ ...plan, days: updated });
                            triggerToast("Marked date tasks completed!");
                            sfxSuccess();
                          }}
                          className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
                        >
                          Mark all done
                        </button>
                      </div>

                      <div className="space-y-1">
                        {d.tasks
                          .filter((t) => !t.completed)
                          .map((t) => (
                            <div key={t.id} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-[var(--ink)]">
                                • {t.subjectName}: {t.chapterName} ({t.taskType})
                              </span>
                              <button
                                onClick={() => handleToggleTask(d.date, t.id)}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20"
                              >
                                Done
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SHARE PLAN (Link + JSON) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="surface-elevated max-w-lg w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--ink)]">Share Your 12th Board Strategy</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Anyone with this link can view your datewise study plan and 1-click duplicate it into their own strategy builder!
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--ink)]">Direct Shareable Link:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/apps/strategy-builder?shared=${encodePlanToShareString(plan)}`}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Need raw JSON export?</span>
                <button
                  onClick={handleCopyPlanJson}
                  className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJson ? "Copied JSON!" : "Copy Plan JSON"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COPY / IMPORT SHARED PLAN */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="surface-elevated max-w-lg w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--ink)]">Import / Copy Shared Strategy</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Paste a shared strategy link or JSON export below to load and copy it into your local workspace.
            </p>

            <div className="space-y-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste shared URL (e.g. https://.../strategy-builder?shared=...) or JSON here"
                rows={4}
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />

              {importError && (
                <div className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportPlan}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Load Strategy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CHAPTER TO DAY */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="surface-elevated max-w-md w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--ink)]">
                Add Chapter for {formatFriendlyDate(targetDateForNewTask)}
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Select Subject */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Subject:</label>
                <select
                  value={selectedAddSubjectId}
                  onChange={(e) => {
                    setSelectedAddSubjectId(e.target.value);
                    const s = CBSE_12TH_SUBJECTS.find((sub) => sub.id === e.target.value);
                    if (s && s.chapters[0]) setSelectedAddChapterId(s.chapters[0].id);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                >
                  {CBSE_12TH_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name} (Code {s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Chapter */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Chapter (CBSE 12th):</label>
                <select
                  value={selectedAddChapterId}
                  onChange={(e) => setSelectedAddChapterId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                >
                  {(CBSE_12TH_SUBJECTS.find((s) => s.id === selectedAddSubjectId)?.chapters || []).map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} (~{ch.weightageMarks}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Type & Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Task Focus:</label>
                  <select
                    value={selectedAddTaskType}
                    onChange={(e) => setSelectedAddTaskType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Theory">Theory &amp; Concepts</option>
                    <option value="NCERT Exercises">NCERT Exercises</option>
                    <option value="PYQs">Previous Year Questions</option>
                    <option value="Revision">Revision &amp; Notes</option>
                    <option value="Sample Paper">Sample Paper / Mock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Est. Hours:</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={selectedAddHours}
                    onChange={(e) => setSelectedAddHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Specific Topics / Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Focus on derivations and formulas"
                  value={selectedAddNotes}
                  onChange={(e) => setSelectedAddNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] font-semibold hover:bg-[var(--surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewTask}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Add Chapter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW PLAN WIZARD (Editable Days, Editable End Date, and Blank Slate option) */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="surface-elevated max-w-lg w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)]">Generate 12th Board Strategy</h3>
                <p className="text-xs text-[var(--muted)]">Custom duration, editable target end date &amp; subject breakdown.</p>
              </div>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Student Name:</label>
                <input
                  type="text"
                  value={wizardName}
                  onChange={(e) => setWizardName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Start Date, Duration (Days), and Target End Date (Bi-directionally Synchronized) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Start Date:</label>
                  <input
                    type="date"
                    value={wizardStartDate}
                    onChange={(e) => handleWizardStartDateChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Duration (Days):</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={wizardDuration}
                    onChange={(e) => handleWizardDurationChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Target End Date:</label>
                  <input
                    type="date"
                    value={wizardEndDate}
                    onChange={(e) => handleWizardEndDateChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Quick duration presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[var(--muted)] font-semibold mr-1">Quick Presets:</span>
                {[30, 45, 60, 75, 90, 120].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleWizardDurationChange(days)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      wizardDuration === days
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "surface-elevated border-[var(--hairline)] text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              {/* Option to make every date blank */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wizardMakeBlank}
                  onChange={(e) => setWizardMakeBlank(e.target.checked)}
                  className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div>
                  <span className="font-bold text-[var(--ink)] block">Make every date blank (Blank Strategy)</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Creates empty study days so you can manually assign chapters without presets.
                  </span>
                </div>
              </label>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--ink)]">Included CBSE Subjects:</label>
                <div className="grid grid-cols-2 gap-2">
                  {CBSE_12TH_SUBJECTS.map((s) => {
                    const checked = wizardSubjects.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setWizardSubjects(wizardSubjects.filter((id) => id !== s.id));
                            } else {
                              setWizardSubjects([...wizardSubjects, s.id]);
                            }
                          }}
                          className="rounded border-[var(--hairline)] text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        <span className="font-semibold text-[var(--ink)]">
                          {s.icon} {s.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] font-semibold hover:bg-[var(--surface-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewPlan}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{wizardMakeBlank ? "Create Blank Strategy" : "Generate Strategy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (Ultra-Glassmorphism body with backdrop blur) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  confirmDialog.isDestructive
                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-[var(--ink)] tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--hairline)]">
              <button
                type="button"
                onClick={() => {
                  sfxClick();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  confirmDialog.isDestructive
                    ? "bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/20"
                    : "bg-[var(--accent)] hover:opacity-90 active:scale-95"
                }`}
              >
                {confirmDialog.isDestructive ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
