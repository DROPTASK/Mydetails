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
  Bot,
  Wand2,
  Play,
  Video,
  Youtube,
  VideoOff,
  Edit3,
  ShieldCheck,
  Maximize,
  Minimize,
  Database,
  Cloud,
  LogIn,
  LogOut,
  Mail,
  Key,
  Send,
  Smartphone,
  Share,
  Settings,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  UserPlus,
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
  generateAiStrategyPrompt,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  formatVideoTime,
} from "../lib/strategyData";
import { InAppVideoPlayer } from "../components/InAppVideoPlayer";
import {
  getCurrentAuthUser,
  requestEmailOtp,
  verifyEmailOtp,
  registerWithPassword,
  loginWithPassword,
  setPasswordForUser,
  logoutAuthUser,
  AuthUser,
} from "../lib/authOtp";
import {
  saveStrategyToCloudDb,
  loadStrategyFromCloud,
  fetchUserLatestPlanFromCloud,
  getSocialShareLinks,
  CloudPlanRecord,
} from "../lib/cloudStrategy";

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
  const [activeTab, setActiveTab] = useState<"today" | "planner" | "syllabus" | "calendar" | "backlog">("today");

  // In-App Video Player State
  const [activeVideoModal, setActiveVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    videoTitle?: string;
    taskName?: string;
    subjectName?: string;
    dateStr: string;
    taskId: string;
    isCompleted: boolean;
  } | null>(null);

  // Attach / Edit Video URL Modal State
  const [videoEditModal, setVideoEditModal] = useState<{
    isOpen: boolean;
    dateStr: string;
    taskId: string;
    taskName: string;
    videoUrl: string;
    videoTitle: string;
  } | null>(null);

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
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [targetDateForNewTask, setTargetDateForNewTask] = useState<string>(getTodayIso());

  // AI Prompt Builder State
  const [aiGoalText, setAiGoalText] = useState(
    "I want to score 95%+ in Class 12th Board examinations. Balance theory with NCERT questions, past 10-year board PYQs, and scheduled sample papers. Give more study hours on holidays and Sundays."
  );
  const [aiWeakSubjects, setAiWeakSubjects] = useState("Physics derivations & Chemistry Organic mechanisms");
  const [aiIncludeCurrentPlan, setAiIncludeCurrentPlan] = useState<boolean>(false);
  const [aiCopiedPrompt, setAiCopiedPrompt] = useState(false);

  // Task creation form state
  const [selectedAddSubjectId, setSelectedAddSubjectId] = useState<string>("physics");
  const [selectedAddChapterId, setSelectedAddChapterId] = useState<string>("");
  const [selectedAddTaskType, setSelectedAddTaskType] = useState<PlanChapterTask["taskType"]>("Theory");
  const [selectedAddHours, setSelectedAddHours] = useState<number>(3);
  const [selectedAddNotes, setSelectedAddNotes] = useState<string>("");
  const [selectedAddVideoUrl, setSelectedAddVideoUrl] = useState<string>("");
  const [selectedAddVideoTitle, setSelectedAddVideoTitle] = useState<string>("");

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

  // Fullscreen Study Mode State
  const [isPlannerFullscreen, setIsPlannerFullscreen] = useState(false);
  const plannerContainerRef = useRef<HTMLDivElement | null>(null);

  const togglePlannerFullscreen = () => {
    sfxClick();
    if (!document.fullscreenElement) {
      if (plannerContainerRef.current?.requestFullscreen) {
        plannerContainerRef.current.requestFullscreen().catch(() => {});
      } else if ((plannerContainerRef.current as any)?.webkitRequestFullscreen) {
        (plannerContainerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any)?.webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFs = () => {
      setIsPlannerFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFs);
    document.addEventListener("webkitfullscreenchange", handleFs);
    return () => {
      document.removeEventListener("fullscreenchange", handleFs);
      document.removeEventListener("webkitfullscreenchange", handleFs);
    };
  }, []);

  // Auth User State (Email OTP 8-digit & Password)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCurrentAuthUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "otp">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authOtp, setAuthOtp] = useState("");
  const [authOtpSent, setAuthOtpSent] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const isLoggingInRef = useRef(false);

  // Cloud DB Save & Easy Sharing State
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [showEasyShareModal, setShowEasyShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<"synced" | "saving" | "offline">("synced");
  const [easyShareUrl, setEasyShareUrl] = useState("");
  const [easyShortCode, setEasyShortCode] = useState("");
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedShortCode, setCopiedShortCode] = useState(false);
  const autoSyncDebounceRef = useRef<any>(null);
  const [codeToLoad, setCodeToLoad] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Sync ref with authUser so async callbacks and debounce timers never see stale null
  const authUserRef = useRef<AuthUser | null>(authUser);
  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  // Set and persist plan locally without triggering an auto-sync back mutation to Cloud DB
  const applyLoadedPlan = (loadedPlan: StrategyPlan, shortCode?: string, shareUrl?: string) => {
    setPlan(loadedPlan);
    saveStrategyPlan(loadedPlan);
    if (shortCode) {
      setEasyShortCode(shortCode);
    }
    if (shareUrl) {
      setEasyShareUrl(shareUrl);
    }
  };

  // Sync user mutations to localStorage and debounce auto-sync to Cloud DB on user action.
  // ONLY sends data to DB when user makes an actual change (never during login!).
  const updatePlan = (newPlan: StrategyPlan) => {
    setPlan(newPlan);
    saveStrategyPlan(newPlan);

    // CRITICAL: When user is logging in, do NOT send data from browser to DB!
    if (isLoggingInRef.current) {
      return;
    }

    // Auto-sync to DB in background on any user change
    if (autoSyncDebounceRef.current) {
      clearTimeout(autoSyncDebounceRef.current);
    }
    setDbSyncStatus("saving");
    autoSyncDebounceRef.current = setTimeout(async () => {
      try {
        const userEmail = authUserRef.current?.email || "guest@vanshkumar.in";
        const res = await saveStrategyToCloudDb(newPlan, userEmail);
        setEasyShareUrl(res.shareUrl);
        setEasyShortCode(res.shortCode);
        setDbSyncStatus("synced");
      } catch {
        setDbSyncStatus("offline");
      }
    }, 600);
  };

  // Auto-load plan from URL query param (?code= or ?plan=) or from authenticated user's Cloud DB
  useEffect(() => {
    const codeParam = searchParams.get("code") || searchParams.get("cloudPlan");
    const planParam = searchParams.get("plan");

    if (codeParam) {
      setIsLoadingCode(true);
      loadStrategyFromCloud(codeParam).then((loaded) => {
        setIsLoadingCode(false);
        if (loaded) {
          const upper = codeParam.toUpperCase();
          const cleanCode = upper.startsWith("12TH-") ? upper : upper.length <= 6 ? `12TH-${upper}` : upper;
          const shareUrl = `${window.location.origin}/apps/strategy-builder?code=${cleanCode}`;
          applyLoadedPlan(loaded, cleanCode, shareUrl);
          triggerToast(`✅ Loaded Shared Plan: "${loaded.title}"!`);
          sfxSuccess();
        } else {
          triggerToast(`⚠️ Could not find plan for code "${codeParam}".`);
        }
      });
    } else if (planParam) {
      const decoded = decodePlanFromShareString(planParam);
      if (decoded) {
        applyLoadedPlan(decoded);
        triggerToast(`✅ Loaded Shared Plan: "${decoded.title}"!`);
        sfxSuccess();
      }
    } else if (authUser?.email) {
      // User is logged in on this device - ONLY RECEIVE from DB! NO data sending!
      isLoggingInRef.current = true;
      fetchUserLatestPlanFromCloud(authUser.email).then((cloudRec) => {
        if (cloudRec && cloudRec.planData) {
          applyLoadedPlan(cloudRec.planData, cloudRec.shortCode, cloudRec.shareUrl);
          triggerToast(`☁️ Synced latest plan for ${authUser.email}!`);
        }
      }).finally(() => {
        setTimeout(() => {
          isLoggingInRef.current = false;
        }, 500);
      });
    }
  }, [searchParams, authUser?.email]);

  // Load a plan explicitly using Short Code or URL
  const handleLoadByCode = async (explicitCode?: string) => {
    sfxClick();
    const targetCode = (explicitCode || codeToLoad).trim();
    if (!targetCode) {
      triggerToast("Please enter a short code or share link.");
      return;
    }
    setIsLoadingCode(true);
    try {
      const loaded = await loadStrategyFromCloud(targetCode);
      if (loaded) {
        const upper = targetCode.toUpperCase();
        const cleanCode = upper.startsWith("12TH-") ? upper : upper.length <= 6 ? `12TH-${upper}` : upper;
        const shareUrl = `${window.location.origin}/apps/strategy-builder?code=${cleanCode}`;
        applyLoadedPlan(loaded, cleanCode, shareUrl);
        setShowSettingsModal(false);
        setShowEasyShareModal(false);
        setShowImportModal(false);
        setCodeToLoad("");
        triggerToast(`🎉 Successfully loaded plan: "${loaded.title}" (${loaded.studentName})!`);
        sfxSuccess();
      } else {
        triggerToast(`❌ No plan found for code "${targetCode}". Please verify.`);
      }
    } catch {
      triggerToast("Failed to load plan from cloud.");
    } finally {
      setIsLoadingCode(false);
    }
  };

  // Helper: Post-Auth Success with NO outbound data sending, ONLY receiving!
  const handlePostAuthSuccess = async (user: AuthUser, welcomeMsg?: string) => {
    isLoggingInRef.current = true;
    setAuthUser(user);
    authUserRef.current = user;
    setShowAuthModal(false);
    setAuthPassword("");
    setAuthOtp("");
    setAuthOtpSent(false);
    sfxSuccess();

    try {
      // User logins: NO data sending, ONLY receiving from DB!
      const existingCloudPlan = await fetchUserLatestPlanFromCloud(user.email);
      if (existingCloudPlan && existingCloudPlan.planData) {
        applyLoadedPlan(existingCloudPlan.planData, existingCloudPlan.shortCode, existingCloudPlan.shareUrl);
        triggerToast(`🎉 Welcome back, ${user.displayName}! Loaded your cloud plan from database.`);
      } else {
        // First-time user with no cloud plan: DO NOT send data to DB during login!
        triggerToast(welcomeMsg || `🎉 Welcome, ${user.displayName}! Signed in.`);
      }
    } finally {
      setTimeout(() => {
        isLoggingInRef.current = false;
      }, 500);
    }
  };

  // 1. Password Login
  const handlePasswordLogin = async () => {
    sfxClick();
    setAuthError("");
    setAuthIsLoading(true);
    try {
      const res = await loginWithPassword(authEmail, authPassword);
      if (res.success && res.user) {
        await handlePostAuthSuccess(res.user);
      } else {
        setAuthError(res.error || "Login failed. Please check credentials.");
      }
    } catch (e: any) {
      setAuthError(e?.message || "Login failed.");
    } finally {
      setAuthIsLoading(false);
    }
  };

  // 2. Password Account Creation / Registration
  const handlePasswordRegister = async () => {
    sfxClick();
    setAuthError("");
    setAuthIsLoading(true);
    try {
      const res = await registerWithPassword(authEmail, authPassword, authDisplayName);
      if (res.success && res.user) {
        await handlePostAuthSuccess(res.user, `🎉 Welcome, ${res.user.displayName}! Account created.`);
      } else {
        setAuthError(res.error || "Failed to create account.");
      }
    } catch (e: any) {
      setAuthError(e?.message || "Failed to create account.");
    } finally {
      setAuthIsLoading(false);
    }
  };

  // 3. Request 8-digit OTP
  const handleSendAuthOtp = async () => {
    sfxClick();
    setAuthError("");
    setAuthIsLoading(true);
    try {
      const res = await requestEmailOtp(authEmail);
      if (res.success) {
        setAuthOtpSent(true);
        triggerToast(`📨 Verification code dispatched to ${authEmail}`);
        sfxSuccess();
      } else {
        setAuthError(res.message || "Failed to send OTP.");
      }
    } catch {
      setAuthError("Failed to deliver OTP. Please check email address.");
    } finally {
      setAuthIsLoading(false);
    }
  };

  // 4. Verify 8-digit OTP
  const handleVerifyAuthOtp = async () => {
    sfxClick();
    setAuthError("");
    setAuthIsLoading(true);
    try {
      const res = await verifyEmailOtp(authEmail, authOtp);
      if (res.success && res.user) {
        await handlePostAuthSuccess(res.user);
      } else {
        setAuthError(res.error || "Incorrect 8-digit code. Please check and try again.");
      }
    } catch {
      setAuthError("Verification failed.");
    } finally {
      setAuthIsLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    sfxClick();
    logoutAuthUser();
    setAuthUser(null);
    triggerToast("Logged out from cloud sync.");
  };

  // Save Now in DB button action
  const handleSaveNowToDb = async () => {
    sfxClick();
    if (!authUser) {
      setShowAuthModal(true);
      triggerToast("🔐 Please enter your email to receive an 8-digit OTP and save in DB.");
      return;
    }

    setIsSavingToDb(true);
    try {
      const res = await saveStrategyToCloudDb(plan, authUser.email);
      setEasyShareUrl(res.shareUrl);
      setEasyShortCode(res.shortCode);
      setShowEasyShareModal(true);
      triggerToast(`☁️ Saved to Cloud DB! Code: ${res.shortCode}`);
      sfxSuccess();
    } catch {
      triggerToast("Failed to save to database. Please try again.");
    } finally {
      setIsSavingToDb(false);
    }
  };

  // Open Easy Share Modal
  const handleOpenEasyShare = async () => {
    sfxClick();
    setIsSavingToDb(true);
    try {
      const email = authUser?.email || "guest@vanshkumar.in";
      const res = await saveStrategyToCloudDb(plan, email);
      setEasyShareUrl(res.shareUrl);
      setEasyShortCode(res.shortCode);
      setShowEasyShareModal(true);
    } finally {
      setIsSavingToDb(false);
    }
  };

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
    setSelectedAddVideoUrl("");
    setSelectedAddVideoTitle("");
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
      videoUrl: selectedAddVideoUrl.trim() || undefined,
      videoTitle: selectedAddVideoTitle.trim() || undefined,
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

  // Save / Update YouTube Video for specific task
  const handleSaveVideoEdit = (dateStr: string, taskId: string, videoUrl: string, videoTitle?: string) => {
    sfxClick();
    const updatedDays = plan.days.map((day) => {
      if (day.date !== dateStr) return day;
      return {
        ...day,
        tasks: day.tasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            videoUrl: videoUrl.trim() || undefined,
            videoTitle: videoTitle?.trim() || undefined,
          };
        }),
      };
    });

    updatePlan({
      ...plan,
      days: updatedDays,
    });

    setVideoEditModal(null);
    triggerToast(videoUrl.trim() ? "📺 YouTube lecture video attached!" : "Video link removed.");
    sfxSuccess();
  };

  // Shift an overdue backlog task to today
  const handleShiftBacklogTaskToToday = (sourceDate: string, taskId: string) => {
    sfxClick();
    let movedTask: PlanChapterTask | null = null;
    const cleanedDays = plan.days.map((day) => {
      if (day.date !== sourceDate) return day;
      const target = day.tasks.find((t) => t.id === taskId);
      if (target) movedTask = target;
      return {
        ...day,
        tasks: day.tasks.filter((t) => t.id !== taskId),
      };
    });

    if (!movedTask) return;

    let foundToday = false;
    const finalDays = cleanedDays.map((day) => {
      if (day.date === todayIso) {
        foundToday = true;
        return {
          ...day,
          tasks: [...day.tasks, movedTask!],
        };
      }
      return day;
    });

    if (!foundToday) {
      finalDays.push({
        date: todayIso,
        dayType: "working",
        targetStudyHours: 5,
        tasks: [movedTask],
      });
      finalDays.sort((a, b) => a.date.localeCompare(b.date));
    }

    updatePlan({
      ...plan,
      days: finalDays,
    });

    triggerToast(`Rescheduled ${(movedTask as PlanChapterTask).chapterName} to Today!`);
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

  // Import Plan from pasted string / short code / URL / JSON
  const handleImportPlan = async () => {
    sfxClick();
    setImportError("");
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError("Please paste a short code (e.g. 12TH-T5QV), share link, or JSON.");
      return;
    }

    // 1. Try resolving via Cloud DB (short code, ID, URL query)
    try {
      const fromCloud = await loadStrategyFromCloud(trimmed);
      if (fromCloud) {
        const upper = trimmed.toUpperCase();
        const codeClean = upper.startsWith("12TH-") ? upper : upper.length <= 6 ? `12TH-${upper}` : upper;
        const shareUrl = `${window.location.origin}/apps/strategy-builder?code=${codeClean}`;
        applyLoadedPlan(fromCloud, codeClean, shareUrl);
        setShowImportModal(false);
        setImportText("");
        triggerToast(`✅ Loaded Strategy Plan from Cloud DB: "${fromCloud.title}"!`);
        sfxSuccess();
        return;
      }
    } catch {
      // Continue to next parsers
    }

    // 2. Try extracting shared query param if a full URL was pasted
    let candidate = trimmed;
    if (trimmed.includes("shared=") || trimmed.includes("plan=")) {
      try {
        const u = new URL(trimmed);
        candidate = u.searchParams.get("shared") || u.searchParams.get("plan") || trimmed;
      } catch {
        const match = trimmed.match(/[?&](?:shared|plan)=([^&#\s]+)/);
        if (match) candidate = match[1];
      }
    }

    // 3. Try decoding base64 share string
    let decoded = decodePlanFromShareString(candidate);

    // 4. Fallback: Try raw JSON parse
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
      applyLoadedPlan(decoded);
      setShowImportModal(false);
      setImportText("");
      triggerToast("✅ Strategy Plan imported and loaded successfully!");
      sfxSuccess();
    } else {
      setImportError("Could not recognize this plan. Ensure you entered a valid 4-6 digit short code (e.g. 12TH-T5QV), share URL, or JSON.");
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

  // Today's day data from active plan
  const todayDay = useMemo(() => {
    return plan.days.find((d) => d.date === todayIso);
  }, [plan.days, todayIso]);

  // Today backlog tasks (from past dates that are incomplete)
  const pastBacklogTasks = useMemo(() => {
    const list: { day: PlanDay; task: PlanChapterTask }[] = [];
    for (const day of plan.days) {
      if (day.date < todayIso) {
        for (const task of day.tasks) {
          if (!task.completed) {
            list.push({ day, task });
          }
        }
      }
    }
    return list;
  }, [plan.days, todayIso]);

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
    <div
      ref={plannerContainerRef}
      className={`space-y-6 ${
        isPlannerFullscreen
          ? "fixed inset-0 z-50 bg-[var(--surface)] overflow-y-auto p-4 sm:p-8"
          : "max-w-6xl mx-auto pb-16"
      }`}
    >
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

        {/* Minimal Streamlined Header Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subtle Real-time DB Sync Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              dbSyncStatus === "saving"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            }`}
            title="Changes automatically sync to cloud database on every action"
          >
            <Cloud className={`w-3.5 h-3.5 ${dbSyncStatus === "saving" ? "animate-pulse" : ""}`} />
            <span>{dbSyncStatus === "saving" ? "Syncing..." : "Saved to Cloud"}</span>
            {easyShortCode && (
              <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-extrabold ml-0.5">
                {easyShortCode}
              </span>
            )}
          </div>

          {/* Direct Share Button */}
          <button
            onClick={handleOpenEasyShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Open Share link with standardized short code"
          >
            <Share className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Fullscreen Zen Mode Button */}
          <button
            onClick={togglePlannerFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
            title={isPlannerFullscreen ? "Exit Fullscreen Focus Mode" : "Fullscreen Focus Mode"}
          >
            {isPlannerFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlannerFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          {/* Unified Settings Button (hosts Login, AI Prompt Builder, Copy Plan, New Strategy, Reset) */}
          <button
            onClick={() => {
              sfxClick();
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] hover:border-[var(--accent)] text-xs font-bold text-[var(--ink)] transition-all cursor-pointer"
            title="Open Settings & Strategy Tools"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Settings</span>
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
            <div className="text-2xl font-black text-[var(--ink)] flex items-baseline gap-1.5">
              <span>{metrics.remainingWorkingDaysFromToday}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Left</span>
              <span className="text-xs font-normal text-[var(--muted)]">/ {metrics.totalWorkingDays} Total</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5 flex items-center justify-between">
              <span>School days (~5h study)</span>
              <span className="text-[10px] font-medium text-[var(--muted)]">({metrics.pastWorkingDays} past)</span>
            </div>
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
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1.5">
              <span>{metrics.remainingHolidaysFromToday}</span>
              <span className="text-xs font-bold">Left</span>
              <span className="text-xs font-normal text-[var(--muted)]">/ {metrics.totalHolidays} Total</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5 flex items-center justify-between">
              <span>High-output (~10-12h study)</span>
              <span className="text-[10px] font-medium text-[var(--muted)]">({metrics.pastHolidays} past)</span>
            </div>
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
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-baseline gap-1.5">
              <span>{metrics.remainingSelfLeavesFromToday}</span>
              <span className="text-xs font-bold">Left</span>
              <span className="text-xs font-normal text-[var(--muted)]">/ {metrics.totalSelfLeaves} Total</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5 flex items-center justify-between">
              <span>Planned bunks for self-study</span>
              <span className="text-[10px] font-medium text-[var(--muted)]">({metrics.pastSelfLeaves} past)</span>
            </div>
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
                <span>On track! {metrics.remainingDaysFromToday} days left from today</span>
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
              setActiveTab("today");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "today"
                ? "bg-[var(--accent)] text-white shadow"
                : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Today</span>
            {todayDay && todayDay.tasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {todayDay.tasks.filter((t) => t.completed).length}/{todayDay.tasks.length}
              </span>
            )}
          </button>

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

      {/* TAB 0: TODAY STUDY DASHBOARD */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {/* Today Overview Header Card */}
          <div className="surface-elevated p-4 sm:p-5 rounded-3xl border border-[var(--hairline)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Today&apos;s Focus
                  </span>
                  <span className="text-xs text-[var(--muted)]">•</span>
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {formatLongDate(todayIso)}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[var(--ink)]">
                  {formatFriendlyDate(todayIso)}
                </h2>
              </div>

              {/* Day Status / Schedule Type Switcher */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-xl bg-[var(--surface-2)] p-0.5 border border-[var(--hairline)]">
                  <button
                    onClick={() => handleChangeDayType(todayIso, "working")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      (todayDay?.dayType || "working") === "working"
                        ? "bg-amber-500 text-black shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="School working day (5h study target)"
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>School Day</span>
                  </button>
                  <button
                    onClick={() => handleChangeDayType(todayIso, "holiday")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      todayDay?.dayType === "holiday"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Official Holiday / Sunday (10h study target)"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Holiday</span>
                  </button>
                  <button
                    onClick={() => handleChangeDayType(todayIso, "self_leave")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      todayDay?.dayType === "self_leave"
                        ? "bg-purple-500 text-white shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Self Leave / Prep Bunk (8.5h study target)"
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Self Leave</span>
                  </button>
                </div>

                <button
                  onClick={() => handleOpenAddTask(todayIso)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Chapter for Today</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics for Today */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--hairline)]">
              <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Target Study Hours</div>
                <div className="text-base font-black text-[var(--ink)] mt-0.5">
                  {todayDay?.targetStudyHours || 5} Hours
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Scheduled Hours</div>
                <div className="text-base font-black text-indigo-500 mt-0.5">
                  {(todayDay?.tasks || []).reduce((acc, t) => acc + (t.estHours || 0), 0)} Hours
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Chapters Today</div>
                <div className="text-base font-black text-[var(--ink)] mt-0.5">
                  {(todayDay?.tasks || []).filter((t) => t.completed).length} / {(todayDay?.tasks || []).length} Done
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Active Backlog</div>
                <div className={`text-base font-black mt-0.5 ${pastBacklogTasks.length > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {pastBacklogTasks.length > 0 ? `${pastBacklogTasks.length} Pending` : "0 (On Track! 🎉)"}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <span>Today&apos;s Chapter Schedule</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                  {(todayDay?.tasks || []).length} Chapters
                </span>
              </h3>
              <button
                onClick={() => handleOpenAddTask(todayIso)}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Task</span>
              </button>
            </div>

            {(!todayDay || todayDay.tasks.length === 0) ? (
              <div className="text-center py-12 surface-elevated rounded-3xl border border-[var(--hairline)] p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Flame className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[var(--ink)]">No tasks scheduled for today yet</h4>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                  Assign chapters from your Class 12 syllabus, paste a lecture video link, or catch up on past backlogs below!
                </p>
                <button
                  onClick={() => handleOpenAddTask(todayIso)}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Today&apos;s First Chapter</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayDay.tasks.map((task) => {
                  const subject = CBSE_12TH_SUBJECTS.find((s) => s.id === task.subjectId);
                  const videoId = extractYouTubeVideoId(task.videoUrl || "");
                  return (
                    <div
                      key={task.id}
                      className={`surface-elevated rounded-2xl border p-4 transition-all space-y-3 ${
                        task.completed
                          ? "bg-emerald-500/[0.04] border-emerald-500/30 opacity-85"
                          : "border-[var(--hairline)] hover:border-[var(--accent)]/40 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Task Information */}
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTask(todayIso, task.id)}
                            className={`mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer ${
                              task.completed
                                ? "text-emerald-500"
                                : "text-[var(--muted)] hover:text-[var(--accent)]"
                            }`}
                            title={task.completed ? "Mark incomplete" : "Mark completed"}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-6 h-6 fill-emerald-500/15" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[10px] font-black px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: subject?.bgLight || "rgba(59, 130, 246, 0.12)",
                                  color: subject?.color || "#3b82f6",
                                }}
                              >
                                {subject?.icon} {task.subjectName}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--muted)]">
                                {task.taskType}
                              </span>
                              <span className="text-[10px] text-[var(--muted)] flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                <span>{task.estHours}h planned</span>
                              </span>
                            </div>

                            <h4
                              className={`text-sm sm:text-base font-bold ${
                                task.completed ? "line-through text-[var(--muted)]" : "text-[var(--ink)]"
                              }`}
                            >
                              {task.chapterName}
                            </h4>

                            {task.notes && (
                              <p className="text-xs text-[var(--muted)]">{task.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setVideoEditModal({
                                isOpen: true,
                                dateStr: todayIso,
                                taskId: task.id,
                                taskName: task.chapterName,
                                videoUrl: task.videoUrl || "",
                                videoTitle: task.videoTitle || "",
                              })
                            }
                            className={`p-1.5 rounded-xl border border-[var(--hairline)] hover:bg-[var(--surface-2)] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              task.videoUrl ? "text-red-500" : "text-[var(--muted)]"
                            }`}
                            title={task.videoUrl ? "Edit YouTube Link" : "Attach YouTube Link"}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {task.videoUrl ? "Edit Video" : "Attach Video"}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDeleteTask(todayIso, task.id)}
                            className="p-1.5 rounded-xl text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete task from today"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Video Player Card Feature (When video link is attached) */}
                      {task.videoUrl ? (
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500/5 via-purple-500/5 to-indigo-500/5 border border-red-500/20 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {videoId ? (
                              <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-black">
                                <img
                                  src={getYouTubeThumbnailUrl(videoId) || ""}
                                  alt="Video Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center shrink-0">
                                <Youtube className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1">
                                  <Youtube className="w-3 h-3" />
                                  Lecture Video Attached
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                  <ShieldCheck className="w-3 h-3" />
                                  Ad-Shield Ready
                                </span>
                              </div>
                              <p className="text-xs font-bold text-[var(--ink)] truncate max-w-md">
                                {task.videoTitle || task.chapterName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                sfxClick();
                                setActiveVideoModal({
                                  isOpen: true,
                                  videoUrl: task.videoUrl!,
                                  videoTitle: task.videoTitle || task.chapterName,
                                  taskName: task.chapterName,
                                  subjectName: task.subjectName,
                                  dateStr: todayIso,
                                  taskId: task.id,
                                  isCompleted: task.completed,
                                });
                              }}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Watch in In-App Player</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[var(--surface-2)]/60 border border-dashed border-[var(--hairline)] flex items-center justify-between text-xs text-[var(--muted)]">
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-zinc-400" />
                            <span>No lecture video attached yet.</span>
                          </span>
                          <button
                            onClick={() =>
                              setVideoEditModal({
                                isOpen: true,
                                dateStr: todayIso,
                                taskId: task.id,
                                taskName: task.chapterName,
                                videoUrl: "",
                                videoTitle: "",
                              })
                            }
                            className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Attach YouTube Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Backlogs Catch-Up Section (If any past tasks remain incomplete) */}
          {pastBacklogTasks.length > 0 && (
            <div className="surface-elevated p-4 sm:p-5 rounded-3xl border border-rose-500/30 bg-rose-500/[0.02] space-y-3 mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--ink)]">
                      Catch Up on Past Backlog Chapters Today
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      {pastBacklogTasks.length} pending chapter(s) from earlier dates
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAutoShiftBacklog}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Reschedule Schedule (+{metrics.backlogDays}d)</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {pastBacklogTasks.map(({ day, task }) => {
                  const subject = CBSE_12TH_SUBJECTS.find((s) => s.id === task.subjectId);
                  return (
                    <div
                      key={`backlog-${day.date}-${task.id}`}
                      className="p-3 rounded-2xl bg-[var(--surface)] border border-rose-500/20 flex flex-wrap items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleTask(day.date, task.id)}
                          className="shrink-0 text-rose-400 hover:text-emerald-500 transition-colors cursor-pointer"
                          title="Mark task completed"
                        >
                          <Circle className="w-5 h-5" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Due {formatFriendlyDate(day.date)}
                            </span>
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: subject?.bgLight || "rgba(59, 130, 246, 0.12)",
                                color: subject?.color || "#3b82f6",
                              }}
                            >
                              {subject?.icon} {task.subjectName}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--muted)]">
                              {task.estHours}h
                            </span>
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate mt-0.5">
                            {task.chapterName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.videoUrl && (
                          <button
                            onClick={() => {
                              sfxClick();
                              setActiveVideoModal({
                                isOpen: true,
                                videoUrl: task.videoUrl!,
                                videoTitle: task.videoTitle || task.chapterName,
                                taskName: task.chapterName,
                                subjectName: task.subjectName,
                                dateStr: day.date,
                                taskId: task.id,
                                isCompleted: task.completed,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-600/20 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Lecture</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleShiftBacklogTaskToToday(day.date, task.id)}
                          className="px-2.5 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Move this task to today's schedule"
                        >
                          <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
                          <span>Shift to Today</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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

                                  {task.videoUrl && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          sfxClick();
                                          setActiveVideoModal({
                                            isOpen: true,
                                            videoUrl: task.videoUrl!,
                                            videoTitle: task.videoTitle || task.chapterName,
                                            taskName: task.chapterName,
                                            subjectName: task.subjectName,
                                            dateStr: day.date,
                                            taskId: task.id,
                                            isCompleted: task.completed,
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-600/20 transition-all cursor-pointer"
                                        title="Watch lecture video in Ad-Shield player"
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        <span>Watch Video</span>
                                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    sfxClick();
                                    setVideoEditModal({
                                      isOpen: true,
                                      dateStr: day.date,
                                      taskId: task.id,
                                      taskName: task.chapterName,
                                      videoUrl: task.videoUrl || "",
                                      videoTitle: task.videoTitle || "",
                                    });
                                  }}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                    task.videoUrl
                                      ? "text-red-500 hover:bg-red-500/10"
                                      : "text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10"
                                  }`}
                                  title={task.videoUrl ? "Edit / Replace YouTube Video" : "Attach YouTube Lecture Video"}
                                >
                                  <Video className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteTask(day.date, task.id)}
                                  className="p-1 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

              {/* Minimal Attendance Metrics Badges (Synced with Real-Date Remaining from Today) */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-[11px]" title={`${metrics.remainingWorkingDaysFromToday} school days left from today out of ${metrics.totalWorkingDays} total`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  School: {metrics.remainingWorkingDaysFromToday}d left <span className="opacity-60 text-[10px]">({metrics.totalWorkingDays} total)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]" title={`${metrics.remainingHolidaysFromToday} holidays left from today out of ${metrics.totalHolidays} total`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Holidays: {metrics.remainingHolidaysFromToday}d left <span className="opacity-60 text-[10px]">({metrics.totalHolidays} total)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold text-[11px]" title={`${metrics.remainingSelfLeavesFromToday} self leaves left from today out of ${metrics.totalSelfLeaves} total`}>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Leaves: {metrics.remainingSelfLeavesFromToday}d left <span className="opacity-60 text-[10px]">({metrics.totalSelfLeaves} total)</span>
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

              {/* YouTube Video URL (Optional) */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube Lecture Video Link (Optional):</span>
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Ad-Shield Mode
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={selectedAddVideoUrl}
                  onChange={(e) => setSelectedAddVideoUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {selectedAddVideoUrl.trim() && (
                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)]">Video Lecture Title (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter One-Shot Marathon Lecture"
                    value={selectedAddVideoTitle}
                    onChange={(e) => setSelectedAddVideoTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

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

      {/* MODAL 5: AI STRATEGY PROMPT BUILDER (Export Custom Prompt & JSON Schema for other AIs) */}
      {showAiPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="surface-elevated max-w-2xl w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
                    <span>AI Strategy Prompt Builder</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Compatible with ChatGPT, Claude, Gemini
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Generate an exact prompt that teaches any AI how to build a 100% import-compatible JSON study plan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiPromptModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              {/* How it works banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 space-y-1.5">
                <div className="font-bold text-[var(--ink)] flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>How to use with other AI (ChatGPT / Claude / Gemini):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[var(--muted)] text-[11px] leading-relaxed">
                  <li>Customize your target study goal and weak subjects below.</li>
                  <li>Click <strong>&quot;Copy AI Prompt&quot;</strong> to copy the fully-engineered instructions + JSON schema.</li>
                  <li>Paste it into ChatGPT, Claude, or Gemini — it will output a customized <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">```json</code> study plan.</li>
                  <li>Copy that AI&apos;s output JSON, come back here, click <strong>&quot;Copy Shared Plan&quot;</strong> &rarr; <strong>Paste &amp; Load Strategy</strong>!</li>
                </ol>
              </div>

              {/* Real-Date Context Pill */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  📅 Synced by Today: <strong className="text-[var(--ink)]">{formatLongDate(metrics.todayDate)}</strong>
                </span>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  {metrics.remainingDaysFromToday} study days remaining until finish target ({formatFriendlyDate(metrics.adjustedEndDate)})
                </span>
              </div>

              {/* Student Goal Input */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)] flex items-center justify-between">
                  <span>Your Custom Study Goals &amp; Instructions:</span>
                  <span className="text-[10px] text-[var(--muted)] font-normal">Passed into AI prompt</span>
                </label>
                <textarea
                  value={aiGoalText}
                  onChange={(e) => setAiGoalText(e.target.value)}
                  placeholder="Describe your exact goal (e.g. 95%+ target, 4 hours school daily, more time on weekends, focus on NCERT derivations)"
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              {/* Weak Subjects / Focus Areas */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Weak Chapters / High-Priority Focus:</label>
                <input
                  type="text"
                  value={aiWeakSubjects}
                  onChange={(e) => setAiWeakSubjects(e.target.value)}
                  placeholder="e.g. Organic Chemistry mechanisms, Physics Optics derivations, Math Calculus PYQs"
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Toggle to Include Current Active Plan JSON */}
              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <span>Include Current Plan in Prompt</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {plan.days.length} days / {plan.days.reduce((acc, d) => acc + d.tasks.length, 0)} tasks
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    Appends your active study calendar JSON into the prompt so AI can refine, reschedule, or rebalance your existing tasks.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={aiIncludeCurrentPlan}
                  onClick={() => {
                    sfxClick();
                    setAiIncludeCurrentPlan(!aiIncludeCurrentPlan);
                  }}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    aiIncludeCurrentPlan ? "bg-purple-600" : "bg-[var(--surface-2)] border border-[var(--hairline)]"
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                      aiIncludeCurrentPlan ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Live Prompt Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--ink)]">
                    Generated Prompt Preview (with Exact Chapter Catalog &amp; JSON Schema):
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {aiIncludeCurrentPlan ? "Includes Full Current Plan" : "Clean Slate Mode"}
                  </span>
                </div>
                <div className="relative">
                  <pre className="w-full max-h-52 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] font-mono text-[10px] text-[var(--ink)] overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                    {generateAiStrategyPrompt({
                      userGoal: aiGoalText,
                      studentName: plan.studentName,
                      startDate: getTodayIso(),
                      targetEndDate: metrics.adjustedEndDate,
                      durationDays: metrics.remainingDaysFromToday,
                      selectedSubjects: plan.selectedSubjectIds,
                      weakSubjects: aiWeakSubjects,
                      includeCurrentPlanJson: aiIncludeCurrentPlan,
                      currentPlan: plan,
                    })}
                  </pre>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] gap-2 flex-wrap">
                <div className="text-[11px] text-[var(--muted)]">
                  Ready to paste into ChatGPT, Claude, Gemini, DeepSeek, or any LLM.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAiPromptModal(false)}
                    className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] font-semibold hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      sfxClick();
                      const fullPrompt = generateAiStrategyPrompt({
                        userGoal: aiGoalText,
                        studentName: plan.studentName,
                        startDate: getTodayIso(),
                        targetEndDate: metrics.adjustedEndDate,
                        durationDays: metrics.remainingDaysFromToday,
                        selectedSubjects: plan.selectedSubjectIds,
                        weakSubjects: aiWeakSubjects,
                        includeCurrentPlanJson: aiIncludeCurrentPlan,
                        currentPlan: plan,
                      });
                      navigator.clipboard.writeText(fullPrompt);
                      setAiCopiedPrompt(true);
                      triggerToast("🤖 AI Prompt copied! Paste into ChatGPT, Claude or Gemini.");
                      sfxSuccess();
                      setTimeout(() => setAiCopiedPrompt(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:opacity-95 shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {aiCopiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{aiCopiedPrompt ? "Prompt Copied!" : "Copy AI Prompt"}</span>
                  </button>
                </div>
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

      {/* MODAL: ATTACH / EDIT YOUTUBE VIDEO LINK */}
      {videoEditModal && videoEditModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="surface-elevated max-w-md w-full rounded-3xl border border-[var(--hairline)] p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ink)]">
                    {videoEditModal.videoUrl ? "Edit Lecture Video" : "Attach YouTube Video"}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] truncate max-w-[240px]">
                    {videoEditModal.taskName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVideoEditModal(null)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Ad-Shield feature note */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="text-[11px] leading-relaxed">
                  In-App Player includes <strong>Ad-Shield mode</strong>, speed controls (0.5x–2x), and real-time study progress timer.
                </span>
              </div>

              {/* Video URL Input */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)] flex items-center justify-between">
                  <span>YouTube Video Link:</span>
                  <span className="text-[10px] text-[var(--muted)] font-normal">watch / shorts / youtu.be</span>
                </label>
                <input
                  type="url"
                  placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                  value={videoEditModal.videoUrl}
                  onChange={(e) =>
                    setVideoEditModal({
                      ...videoEditModal,
                      videoUrl: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
              </div>

              {/* Optional Custom Video Title */}
              <div className="space-y-1">
                <label className="font-bold text-[var(--ink)]">Video Title (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Full Chapter Marathon / Concept One-Shot"
                  value={videoEditModal.videoTitle}
                  onChange={(e) =>
                    setVideoEditModal({
                      ...videoEditModal,
                      videoTitle: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Preview Thumbnail if valid video */}
              {extractYouTubeVideoId(videoEditModal.videoUrl) && (
                <div className="p-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg bg-black overflow-hidden relative shrink-0">
                    <img
                      src={getYouTubeThumbnailUrl(videoEditModal.videoUrl) || ""}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-[var(--ink)] truncate">
                      {videoEditModal.videoTitle || videoEditModal.taskName}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid YouTube Link Detected
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)]">
                {videoEditModal.videoUrl ? (
                  <button
                    onClick={() => {
                      handleSaveVideoEdit(
                        videoEditModal.dateStr,
                        videoEditModal.taskId,
                        "",
                        ""
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Video</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVideoEditModal(null)}
                    className="px-3.5 py-1.5 rounded-xl surface-elevated border border-[var(--hairline)] font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleSaveVideoEdit(
                        videoEditModal.dateStr,
                        videoEditModal.taskId,
                        videoEditModal.videoUrl,
                        videoEditModal.videoTitle
                      );
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IN-APP VIDEO PLAYER (Ad-Shielding, Real-time Progress, Speed Controller) */}
      {activeVideoModal && activeVideoModal.isOpen && (
        <InAppVideoPlayer
          videoUrl={activeVideoModal.videoUrl}
          videoTitle={activeVideoModal.videoTitle}
          taskName={activeVideoModal.taskName}
          subjectName={activeVideoModal.subjectName}
          isCompleted={activeVideoModal.isCompleted}
          onToggleCompleted={() => {
            handleToggleTask(activeVideoModal.dateStr, activeVideoModal.taskId);
            setActiveVideoModal((prev) =>
              prev ? { ...prev, isCompleted: !prev.isCompleted } : null
            );
          }}
          onClose={() => setActiveVideoModal(null)}
        />
      )}

      {/* MODAL: AUTHENTICATION (PASSWORD LOGIN, ACCOUNT CREATION & 8-DIGIT OTP) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="surface-elevated max-w-md w-full rounded-3xl border border-[var(--hairline-strong)] p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  {authMode === "register" ? (
                    <UserPlus className="w-5 h-5" />
                  ) : authMode === "otp" ? (
                    <Key className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)]">
                    {authMode === "register"
                      ? "Create Cloud Account"
                      : authMode === "otp"
                      ? authOtpSent
                        ? "Enter 8-Digit OTP"
                        : "Email OTP Verification"
                      : "Cloud Account Login"}
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {authMode === "register"
                      ? "Set a password to log in & sync across all devices"
                      : authMode === "otp"
                      ? "One-time code delivered directly to your inbox"
                      : "Sign in with your email & password"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthOtpSent(false);
                  setAuthError("");
                  setAuthPassword("");
                }}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  authMode === "login"
                    ? "bg-[var(--surface-elevated)] text-[var(--ink)] shadow-sm font-bold"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  authMode === "register"
                    ? "bg-[var(--surface-elevated)] text-[var(--ink)] shadow-sm font-bold"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setAuthError("");
                }}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  authMode === "otp"
                    ? "bg-[var(--surface-elevated)] text-[var(--ink)] shadow-sm font-bold"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                8-Digit OTP
              </button>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 1: PASSWORD LOGIN */}
            {authMode === "login" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePasswordLogin();
                }}
                className="space-y-3.5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--ink)]">Email Address:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. akash@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--ink)]">Password:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("otp");
                        setAuthError("");
                      }}
                      className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      Forgot / Use OTP
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[var(--hairline)]">
                  <span className="text-[11px] text-[var(--muted)]">
                    New user?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError("");
                      }}
                      className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="px-3.5 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={authIsLoading || !authEmail.trim() || !authPassword}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{authIsLoading ? "Signing In..." : "Sign In"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: PASSWORD REGISTRATION / ACCOUNT CREATION */}
            {authMode === "register" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePasswordRegister();
                }}
                className="space-y-3.5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--ink)]">Student Name (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Akash Kumar"
                    value={authDisplayName}
                    onChange={(e) => setAuthDisplayName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--ink)]">Email Address:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. akash@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                    <span>Create Password:</span>
                    <span className="text-[10px] text-[var(--muted)]">At least 6 characters</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Create a secure password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[var(--hairline)]">
                  <span className="text-[11px] text-[var(--muted)]">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="px-3.5 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={authIsLoading || !authEmail.trim() || authPassword.length < 6}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{authIsLoading ? "Creating..." : "Create Account"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: 8-DIGIT EMAIL OTP LOGIN */}
            {authMode === "otp" && (
              <div className="space-y-4">
                {!authOtpSent ? (
                  /* Step 1: Email Form for OTP */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                        <span>Your Email Address:</span>
                        <span className="text-[10px] text-[var(--muted)] font-normal">Real 8-digit OTP will be sent</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          type="email"
                          placeholder="e.g. akash@gmail.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendAuthOtp()}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-[var(--muted)] leading-relaxed">
                      🔐 We will deliver an <strong>8-digit verification code</strong> directly to your email inbox. Works across all devices.
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--hairline)]">
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(false)}
                        className="px-4 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendAuthOtp}
                        disabled={authIsLoading || !authEmail.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{authIsLoading ? "Sending OTP..." : "Send 8-Digit OTP"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Step 2: 8-digit OTP Verification */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                      <span className="text-[var(--muted)]">
                        Code sent to: <strong className="text-[var(--ink)]">{authEmail}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setAuthOtpSent(false);
                          setAuthOtp("");
                          setAuthError("");
                        }}
                        className="text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>

                    {/* 8-Digit Code Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                        <span>Enter 8-Digit Verification Code:</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">8 Digits</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="12345678"
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && authOtp.length === 8 && handleVerifyAuthOtp()}
                        className="w-full text-center text-xl font-mono font-bold tracking-[0.3em] p-3 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--hairline-strong)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)]">
                      <button
                        type="button"
                        onClick={handleSendAuthOtp}
                        disabled={authIsLoading}
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                      >
                        Resend Code
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAuthModal(false)}
                          className="px-3.5 py-2 rounded-xl surface-elevated border border-[var(--hairline)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyAuthOtp}
                          disabled={authIsLoading || authOtp.length !== 8}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{authIsLoading ? "Verifying..." : "Verify & Sign In"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EASY SHARABILITY & CLOUD DB LINK */}
      {showEasyShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="surface-elevated max-w-lg w-full rounded-3xl border border-[var(--hairline-strong)] p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
                    <span>Easy Share Strategy</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Saved in DB ☁️
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Share your custom 12th board plan via short code, link, or WhatsApp!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEasyShareModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Short Code Box */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--muted)] uppercase tracking-wider text-[10px]">
                    🔑 Strategy Short Code:
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    1-Click Load for Friends
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--hairline)]">
                  <span className="font-mono text-base font-extrabold text-[var(--ink)] tracking-wider">
                    {easyShortCode || "12TH-CBSE"}
                  </span>
                  <button
                    onClick={() => {
                      sfxClick();
                      navigator.clipboard.writeText(easyShortCode);
                      setCopiedShortCode(true);
                      triggerToast("📋 Short Code copied! Friends can paste it in 'Copy Shared Plan'.");
                      sfxSuccess();
                      setTimeout(() => setCopiedShortCode(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--accent)] hover:text-white border border-[var(--hairline)] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedShortCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShortCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Friends can click <strong>&quot;Copy Shared Plan&quot;</strong> and paste this code to load your exact schedule.
                </p>
              </div>

              {/* Direct Universal Share URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--ink)] flex items-center justify-between">
                  <span>Direct Sharable Link:</span>
                  <span className="text-[10px] text-[var(--muted)]">Universal browser link</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={easyShareUrl}
                    className="flex-1 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] font-mono text-[11px] text-[var(--ink)] select-all truncate"
                  />
                  <button
                    onClick={() => {
                      sfxClick();
                      navigator.clipboard.writeText(easyShareUrl);
                      setCopiedShareUrl(true);
                      triggerToast("🔗 Share Link copied to clipboard!");
                      sfxSuccess();
                      setTimeout(() => setCopiedShareUrl(false), 2500);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedShareUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShareUrl ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Social Sharing Actions */}
              <div className="pt-2 border-t border-[var(--hairline)] space-y-2">
                <div className="text-[11px] font-bold text-[var(--ink)]">1-Click Quick Share:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <a
                    href={getSocialShareLinks(plan, easyShareUrl, easyShortCode).whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>💬 WhatsApp</span>
                  </a>

                  <a
                    href={getSocialShareLinks(plan, easyShareUrl, easyShortCode).telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>✈️ Telegram</span>
                  </a>

                  <a
                    href={getSocialShareLinks(plan, easyShareUrl, easyShortCode).email}
                    className="p-2.5 rounded-xl surface-elevated hover:bg-[var(--surface-2)] border border-[var(--hairline)] font-bold text-center flex items-center justify-center gap-1.5 transition-colors col-span-2 sm:col-span-1"
                  >
                    <span>✉️ Email</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--hairline)]">
              <button
                onClick={() => setShowEasyShareModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED SETTINGS & TOOLS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="surface-elevated max-w-lg w-full rounded-3xl border border-[var(--hairline-strong)] p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--ink)]">Strategy Settings</h3>
                  <p className="text-xs text-[var(--muted)]">Manage cloud sync, accounts, and plan management tools</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full surface-elevated border border-[var(--hairline)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Section 1: Account & Real-time Cloud Sync */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Cloud &amp; Account</div>
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-[var(--ink)]">
                        {authUser ? authUser.displayName : "Guest User (Local Storage)"}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {authUser ? authUser.email : "Log in with Password or 8-digit Email OTP to sync across any device"}
                      </div>
                    </div>
                  </div>
                  {authUser ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowSettingsModal(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowAuthModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Log In</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>Auto-Sync Status:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{dbSyncStatus === "saving" ? "Syncing..." : "Active (Every Action)"}</span>
                    </span>
                    <button
                      onClick={handleSaveNowToDb}
                      disabled={isSavingToDb}
                      className="px-2 py-0.5 rounded-md surface-elevated border border-[var(--hairline)] hover:bg-[var(--surface-2)] text-[10px] font-bold text-[var(--ink)] cursor-pointer transition-colors"
                    >
                      {isSavingToDb ? "Saving..." : "Sync Now"}
                    </button>
                  </div>
                </div>

                {/* Current Active Short Code */}
                {easyShortCode && (
                  <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">Your Plan Code</div>
                      <div className="text-xs font-mono font-bold text-[var(--accent)]">{easyShortCode}</div>
                    </div>
                    <button
                      onClick={() => {
                        sfxClick();
                        navigator.clipboard.writeText(easyShortCode);
                        setCopiedShortCode(true);
                        triggerToast("📋 Plan Code copied to clipboard!");
                        sfxSuccess();
                        setTimeout(() => setCopiedShortCode(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg surface-elevated border border-[var(--hairline)] hover:bg-[var(--surface-2)] text-[11px] font-bold text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedShortCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedShortCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                )}

                {/* Open Plan by Short Code */}
                <div className="pt-2 border-t border-[var(--hairline)] space-y-1.5">
                  <div className="text-[11px] font-bold text-[var(--ink)] flex items-center justify-between">
                    <span>Open / Import Plan by Code:</span>
                    <span className="text-[10px] text-[var(--muted)]">Syncs instantly from Cloud DB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codeToLoad}
                      onChange={(e) => setCodeToLoad(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g. 12TH-T5QV or T5QV)"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--hairline-strong)] text-xs font-mono font-bold text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLoadByCode();
                      }}
                    />
                    <button
                      onClick={() => handleLoadByCode()}
                      disabled={isLoadingCode || !codeToLoad.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {isLoadingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                      <span>Load</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Strategy Generator Tools */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Strategy Tools</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* AI Prompt Builder */}
                <button
                  onClick={() => {
                    sfxClick();
                    setShowSettingsModal(false);
                    setShowAiPromptModal(true);
                  }}
                  className="p-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] hover:border-[var(--accent)] text-left transition-all flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">AI Prompt Builder</div>
                    <div className="text-[11px] text-[var(--muted)]">Generate prompt for ChatGPT / Claude</div>
                  </div>
                </button>

                {/* Copy Shared Plan */}
                <button
                  onClick={() => {
                    sfxClick();
                    setShowSettingsModal(false);
                    setShowImportModal(true);
                  }}
                  className="p-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] hover:border-[var(--accent)] text-left transition-all flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">Copy Shared Plan</div>
                    <div className="text-[11px] text-[var(--muted)]">Paste short code or JSON plan</div>
                  </div>
                </button>

                {/* New Customized Strategy */}
                <button
                  onClick={() => {
                    sfxClick();
                    setShowSettingsModal(false);
                    setShowNewPlanModal(true);
                  }}
                  className="p-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] hover:border-[var(--accent)] text-left transition-all flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">New Strategy Wizard</div>
                    <div className="text-[11px] text-[var(--muted)]">Configure fresh dates &amp; subjects</div>
                  </div>
                </button>

                {/* Clear All Tasks */}
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    handleClearAllStrategyTasks();
                  }}
                  className="p-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] hover:border-amber-500/40 text-left transition-all flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">Clear All Tasks</div>
                    <div className="text-[11px] text-[var(--muted)]">Make every date blank for scratch schedule</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: Danger Zone */}
            <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Reset Options</div>
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <div>
                  <div className="text-xs font-bold text-[var(--ink)]">Reset to Standard CBSE Plan</div>
                  <div className="text-[11px] text-[var(--muted)]">Restore official Class 12th defaults</div>
                </div>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    handleFullResetEntirePlan();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  Reset Plan
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end pt-2 border-t border-[var(--hairline)]">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-elevated)] border border-[var(--hairline)] text-xs font-bold transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
