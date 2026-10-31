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

### Feature 7: Video Quality & Subtitle Control Overhaul
- **Forced Stream Resolution Switching**: YouTube HTML5 embeds ignore simple `setPlaybackQuality()` calls due to adaptive bitrate (ABR) defaults. Updated quality switching to re-negotiate the stream at the active timestamp using `player.loadVideoById({ videoId, startSeconds, suggestedQuality })` along with `setPlaybackQualityRange`.
- **Buffering Quality Enforcement**: Hooked into `onStateChange` (Buffering state 3 and Playing state 1) with `targetQualityRef` to continuously enforce selected resolutions.
- **Dynamic Subtitle Track Detection**: Integrated `player.getOption('captions', 'tracklist')` inside `onApiChange` and `onReady` to detect the actual caption tracks uploaded on the video (e.g., auto-generated English, human English, Hindi).
- **Official Subtitle Off Specification**: Replaced deprecated/no-op `unloadModule("captions")` with the official YouTube API specification `player.setOption('captions', 'track', {})` and `reload: true` to reliably turn subtitles off.
- **Native YouTube Mode Toggle**: Added a 1-click "Native Mode" button in the player header and inside both the Quality and Subtitle popovers ("Official Gear" / "Use Native CC") that removes the blocking layer and enables direct interaction with YouTube's official in-player settings gear and CC toggles whenever desired.

### Feature 8: Admin Content Deletion Fix & Homepage Connection DP Avatars
- **Admin Content Deletion Fix**:
  - Replaced unawaited Supabase-only delete calls with `deletePortfolioAsset` in `src/lib/portfolioStorage.ts`.
  - Validates UUIDs prior to issuing Postgres queries, completely preventing PostgreSQL `22P02: invalid input syntax for type uuid` errors on seed items (e.g. `app-1`, `photo-1`).
  - Persists deleted item IDs in `localStorage` (`vk_deleted_portfolio_asset_ids_v2`) so deleted fallback items never resurrect on page reload or re-render.
  - Broadcasts cross-tab and cross-component custom event `vk_portfolio_assets_updated` so `AssetList` and `SocialLinks` reflect deletions and additions in real-time.
  - Added filter tabs (All, Connections, Photos, Apps, Games, Interests), item counts, and confirmation feedback toasts in the Admin panel.
### Feature 9: Themed Site Logos, Homepage Visibility Toggles & Advanced PFP Avatars
- **Themed Site Logos & Brand Badges (`platformThemes.tsx`)**:
  - Engineered vector SVG logos and authentic brand gradient styling for all major platforms: **Twitter / X**, **WhatsApp**, **Reddit**, **Telegram**, **Instagram**, **GitHub**, **LinkedIn**, **YouTube**, **Discord**, **Spotify**, **Threads**, and **Email**.
  - Built an automatic platform detector (`detectPlatform`) that matches URLs, handles, and titles to their respective platform themes and pre-populates URL prefixes (`https://wa.me/`, `https://x.com/`, `https://reddit.com/u/`, `https://t.me/`, etc.).
- **Homepage Visibility Toggles in Admin Content Tab**:
  - Added interactive "Show on Home" / "Hidden" toggle controls directly on each item row in Admin Content (`tab === "assets"`).
  - Toggling immediately saves overrides persistently across sessions, dispatches `vk_portfolio_assets_updated`, and provides auditory & toast confirmation.
  - `SocialLinks.tsx` on the homepage dynamically displays only active items where `show_on_home !== false`.
- **Advanced PFP (Profile Picture / DP) System (`AdvancedPfp`)**:
  - Implemented multi-layered avatar design featuring:
    - Platform-specific ambient neon aura glow on hover.
    - Specular curved glass gloss reflection overlay.
    - Corner platform badge chip with authentic SVG icon and separation hairline ring.
    - Graceful fallback to a themed gradient canvas with crisp vector emblem if an avatar photo is not provided or fails to load.
  - Added live PFP preview in the Admin content creation panel with instant preset auto-fills.

### Feature 10: Pure App Themed Socials & Dedicated Admin Socials Manager
- **Pure App Themed Social Buttons (`SocialAppLogo`)**:
  - Removed all avatar profile pictures and corner mini-badges from the homepage social bar.
  - Socials are now displayed directly with their authentic, crisp **app themed logos** (Twitter / X, WhatsApp, Reddit, Telegram, Instagram, GitHub, LinkedIn, YouTube, Discord, Spotify, Email).
  - Each icon button features the platform's brand gradient background, authentic SVG vector glyph, and subtle curved glass gloss highlight.
- **Dedicated Admin Socials Manager**:
  - Added a dedicated **Socials** tab in the Admin panel navigation with direct input fields for all standard social platforms:
    - **Twitter / X**, **WhatsApp**, **Reddit**, **Telegram**, **Instagram**, **GitHub**, **LinkedIn**, **YouTube**, **Discord**, **Spotify**, and **Email**.
    - Each row displays the app-themed logo, input field for the profile URL, and an instant toggle button (`✓ On Home` vs `✕ Hidden`).
- **Other Sites / Custom Links with Custom Logo Upload**:
  - Added an "Other Sites & Custom Links" creator below the standard social fields.
  - Allows entering custom site name, URL, and giving a custom logo (via image URL or local file upload).
  - Custom sites display their custom logo on the homepage social bar and can be independently toggled on/off or deleted.

### Feature 11: Strict Display of Admin-Configured Social Links on Homepage
- **Only Configured Socials Shown**: Updated `SocialLinks.tsx` and `portfolioStorage.ts` so the homepage social bar strictly displays social links that have been explicitly entered and configured in the Admin Socials tab.
- **Removed Hardcoded Dummy Placeholders**: Removed the unconfigured seed placeholders (`https://wa.me/919999999999`, `https://reddit.com/u/vanshkumar`, etc.) from `DEFAULT_PORTFOLIO_ASSETS` and cleaned legacy dummy URLs from storage so unconfigured platforms start empty and never auto-populate on the homepage.
- **Admin Input Placeholders**: Changed standard social inputs in Admin to display helpful placeholders (e.g., `https://x.com/yourhandle`) without pre-filling fake usernames.
- **Configured State Validation (`isConfiguredHomeSocial`)**: Connection links only render on the homepage when:
  1. A non-empty, genuine URL has been set in the Admin Socials tab.
  2. The link is not in the legacy dummy seed list.
  3. The homepage toggle is set to `On Home` (`show_on_home !== false`).
- **Interactive Feedback**: In the Admin Socials tab, unconfigured social links display "Not Set" and prompt the user with a helpful toast message to enter a URL before toggling homepage visibility.

### Assumptions & Notes
- YouTube embeds in modern browsers inherit user authentication and Premium status via active Google sessions in the browser. The in-app Google sign-in records the user's YouTube identity and active session.
- Pre-shift snapshot is held in React state during the active session for instantaneous Undo; plans are simultaneously persisted to `localStorage`.
- Available video resolutions depend on the source video uploaded to YouTube and adaptive streaming bandwidth conditions.

