# Changelog - 12th Strategy Builder Enhancements

All notable changes to the 12th Strategy Builder app are documented in this file.

## [2.1.0] - 2026-10-30

### Feature 1: Partial Tasks (Strategy Builder)
- **Data Model Extended**: Extended `PlanChapterTask` with `isPartial`, `parentId`, `partialIndex`, `totalPartials`, `splitType`, `timeRange`, `topicName`, `progressPercent`, and `isSplitParent`.
- **Automatic Migration & Data Safety**: Added `strategy_plan_backup_v1` automatic backup key on first load prior to running `migratePlanData`. Existing user plans are preserved with 100% backward compatibility.
- **Lecture-Aware Splitting Engine**: Users can split any chapter task into multiple partial tasks across days by:
  - Time range (e.g. 00:00 - 25:00, 25:00 - 50:00) with custom intervals.
  - CBSE chapter topics pre-populated from the syllabus database.
  - Custom study sub-units (Concept, NCERT Exercises, PYQs, Sample Papers).
- **Day-by-Day Independent Tracking**: Each sub-unit is assigned to a specific target date with independent completion toggle and progress stepper (0%, 25%, 50%, 75%, 100%).
- **Dynamic Parent Progress Calculation**: Parent tasks automatically compute their total completion and progress percentage from their children using `syncPlanParentProgress`.

### Feature 2: Settings: Copy JSON
- **Full App Export**: Added a "Copy JSON (Full App Data)" action in Settings that serializes the active plan, syllabus progress checklist, connected account status, and configuration.
- **Versioned Schema**: Schema includes `"version": 2` with timestamped ISO export metadata.
- **Toast Feedback**: Instant clipboard copy with auditory click and confirmation toast.

### Feature 3: Backlog Analyzer: Auto Shift
- **Intelligent Load Balancing**: Replaced rudimentary bulk date shifting with an intelligent task redistribution engine:
  - Overdue incomplete tasks before today are extracted in original chronological order.
  - Completed past tasks are untouched (100% data preservation).
  - Pending tasks are smoothly distributed starting from today across upcoming days without exceeding daily study hours (`targetStudyHours`).
- **Interactive Preview Modal**: Shows the count of pending tasks, starting reschedule date, safety guarantee, and original dates before applying.
- **1-Click Undo**: Stores pre-shift snapshot in memory and displays an "Undo Auto-Shift" action button in the Backlog view to restore previous state at any time.

### Feature 4: Lecture Player Redesign & Accumulating Skip
- **Accumulating Skip (Bug Fix)**: Fixed the issue where rapid taps only skipped 10s:
  - Implemented a unified 600ms debounce window with a pending-seek accumulator.
  - 1 tap = 10s, 2 taps = 20s, 3 taps = 30s, etc.
  - Displays a running total badge (`+30s` / `-30s`) on screen.
  - Executes a single, clean seek on the YouTube player at the end of the debounce window.
  - Unified across on-screen buttons, side double-taps, and keyboard arrow shortcuts.
- **Translucent Glassmorphism Redesign**: Removed heavy solid black/zinc backgrounds and replaced with modern translucent glassmorphism (`backdrop-blur-2xl bg-black/40 border border-white/10 shadow-2xl`).
- **Smooth Auto-Hide**: Controls auto-hide after 4s with GPU-accelerated opacity and transform transitions.

### Feature 5: YouTube Premium Login
- **Official Google Session Integration**: Added an option in Strategy Settings and the player to connect a Google/YouTube account so YouTube Premium benefits (ad-free playback, study focus) apply to embedded lectures.
- **Connection Status in Settings**: Displays connected Google account email, name, active Premium status badge, and a Disconnect/Logout option.
- **Player Premium Indicator**: Shows a sleek `★ Premium Active` badge in the player header bar when signed in.

### Feature 6: AI Guide Lecture & Partial Split Planning
- **Lecture-Aware Prompt Generator**: Updated `generateAiStrategyPrompt` with strict JSON schema instructions for AI models (ChatGPT, Claude, Gemini) to include video lecture titles, URLs, and timestamp ranges.
- **Partial Task Schema Suggestions**: Generates multi-day split plans for heavy chapters (>4 hours or Hard difficulty) specifying `isPartial`, `parentId`, `timeRange`, and `topicName`.

### Feature 7: Video Quality Control in Player
- **Resolution Selector**: Integrated YouTube IFrame API quality level controls (`getAvailableQualityLevels`, `getPlaybackQuality`, `setPlaybackQuality`).
- **Support for All Resolutions**: 2160p (4K UHD), 1440p (2K QHD), 1080p (HD), 720p (HD), 480p, 360p, 240p, 144p, and Auto (bandwidth-adaptive).
- **Glassmorphism Menu**: Added a sleek popover menu accessible from the bottom controller HUD with active quality checkmark badges and dynamic resolution switching.
- **On-Screen Quality Toast**: Displays immediate translucent toast notification upon quality change (e.g., `Quality: 1080p (HD)`).
- **HUD Quality Badge**: Added a responsive quality indicator button in the bottom HUD bar showing the active resolution (e.g. `1080P`, `720P`, `AUTO`).

### Assumptions & Notes
- YouTube embeds in modern browsers inherit user authentication and Premium status via active Google sessions in the browser. The in-app Google sign-in records the user's YouTube identity and active session.
- Pre-shift snapshot is held in React state during the active session for instantaneous Undo; plans are simultaneously persisted to `localStorage`.
- Available video resolutions depend on the source video uploaded to YouTube and adaptive streaming bandwidth conditions.
