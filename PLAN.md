# 12th Strategy Builder - Architecture & Implementation Plan

## Current Architecture Overview

1. **Task Model & Data Structures (`src/lib/strategyData.ts`)**:
   - `PlanChapterTask`: Represents a study task for a subject/chapter with fields: `id`, `subjectId`, `chapterId`, `chapterName`, `subjectName`, `taskType`, `estHours`, `completed`, `notes`, `videoUrl`, `videoTitle`.
   - `PlanDay`: Contains `date` (YYYY-MM-DD), `dayType` ("working" | "holiday" | "self_leave"), `targetStudyHours`, and `tasks: PlanChapterTask[]`.
   - `StrategyPlan`: Top-level model containing `id`, `title`, `studentName`, `stream`, `startDate`, `targetEndDate`, `selectedSubjectIds`, `days`, `createdAt`, `updatedAt`.
   - `CBSE_12TH_SUBJECTS`: Comprehensive CBSE syllabus database with subjects, chapters, topics, difficulty, and marks weightage.

2. **Storage Architecture (`src/lib/strategyData.ts` & `src/lib/cloudStrategy.ts`)**:
   - LocalStorage key: `vk_strategy_builder_plan_v1`.
   - Cloud storage: Supabase table `strategy_plans` for authenticated users; guest mode uses `localStorage`.
   - Backup & Migration requirement: Auto-backup on load to `strategy_plan_backup_v1` before any data-model migration so existing user plans are never corrupted or lost.

3. **Player Component (`src/components/InAppVideoPlayer.tsx`)**:
   - YouTube iframe API wrapper with custom controls, playback speed up to 4x, volume control, fullscreen, subtitle controls, scrubber with hover/buffer bars, and tap-to-skip.
   - Current skip behavior needs accumulator with a 500-700ms debounce window and running display (e.g., "+30s").
   - UI redesign: Glassmorphism translucent aesthetic (`backdrop-blur`, semi-transparent backgrounds, subtle borders) and smooth fade animations.

4. **Backlog Analyzer (`src/pages/StrategyBuilder.tsx` & `metrics`)**:
   - Computes overdue tasks prior to `todayIso`.
   - Current "Auto-Shift" simply shifts dates in bulk.
   - Enhancement requirement: "Auto Shift" that redistributes pending/incomplete tasks forward starting from today, preserving task order and day-wise load balance, leaving completed tasks untouched, with preview confirmation and full Undo.

5. **Settings & Account Management (`src/pages/StrategyBuilder.tsx`)**:
   - Settings modal manages authentication, cloud sync status, plan code import/export, and syllabus preferences.
   - Needs:
     - "Copy JSON" with versioned schema and toast confirmation.
     - YouTube Premium / Google Identity login indicator and session state.

6. **AI Guide (`src/lib/strategyData.ts` & AI Generator Modal)**:
   - Builds prompts and AI schemas for CBSE Class 12 planner.
   - Needs lecture awareness: splitting by duration, chapter, or topics, and multi-day distribution.

---

## Step-by-Step Implementation Strategy

### Feature 1: Partial Tasks (Strategy Builder)
- Extend `PlanChapterTask` model to support partial sub-units:
  - `isSplit?: boolean`
  - `parentId?: string`
  - `partialIndex?: number`
  - `totalPartials?: number`
  - `splitType?: "time" | "chapter" | "topic"`
  - `timeRange?: { startSec: number; endSec: number; label?: string }`
  - `topicName?: string`
  - `progressPercent?: number`
- Run backward-compatible migration on load:
  - Backup existing plan in `localStorage` under `strategy_plan_backup_v1` if not yet backed up.
  - Normalize any existing tasks without sub-units, ensuring defaults (`progressPercent: completed ? 100 : 0`).
- Implement Lecture-aware splitting modal / tool:
  - By time range (e.g., 00:00-25:00, 25:00-50:00).
  - By chapter sub-topics or custom topic ranges.
  - Assign each partial task to a specific date across days.
- Auto-calculate parent task progress % from partials:
  - When all partials are complete, parent is complete.
  - Partial completion updates parent progress % dynamically.
- Build/lint verification.

### Feature 2: Settings: Copy JSON
- Add "Copy JSON" action in Strategy Settings modal.
- Formats complete app state into a versioned JSON object (`{ version: 2, exportedAt, plan, settings, ... }`).
- Copies to system clipboard with fallback and displays toast notification.
- Build/lint verification.

### Feature 3: Backlog Analyzer: Auto Shift
- Refactor backlog auto-shift:
  - Collect all overdue incomplete tasks from dates < today.
  - Distribute them forward starting from today, respecting day load limits and preserving original order.
  - Do NOT touch completed tasks.
  - Show preview/confirmation modal before applying changes.
  - Implement full Undo capability (restore pre-shift snapshot).
- Build/lint verification.

### Feature 4: Lecture Player Enhancements
- Accumulating skip/rewind:
  - Debounce window (600ms) with pending-seek counter (+10s, +20s, +30s...).
  - Display running indicator badge (+10s, +20s...).
  - Single seek executed at end of debounce.
- UI Redesign:
  - Light, minimal translucent look with glassmorphic styles (`backdrop-blur-xl`, `bg-white/10 dark:bg-black/30`, fine hairline borders).
  - Smooth fade-in/fade-out for controls.
  - GPU-accelerated transforms and opacity.
- Build/lint verification.

### Feature 5: YouTube Premium Login
- Add Google Identity / YouTube Sign-In option in Settings / Player.
- Display connected user state, avatar, and logout option.
- Explain YouTube embed session handling for ad-free playback.
- Build/lint verification.

### Feature 6: AI Guide Enhancements
- Update `generateStrategyPlanPrompt` and AI planner instructions to support lecture tasks, time-split sub-units, chapter-based partial splits, and day-wise load balancing.
- Build/lint verification.

### Documentation & Deliverables
- Maintain `CHANGELOG.md` with migration details and assumptions.
- Run `compile_applet` and verify zero errors.
- Final summary of completed and untested edge cases.
