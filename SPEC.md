# GitHub Trending Widget — Product Specification

> Version: 2.0
> Date: 2026-03-28
> Status: Implemented

---

## 1. Overview

A lightweight macOS menu bar app that displays the top 10 GitHub trending repositories of the week, with AI-powered analysis and categorization via Claude Code CLI. Lives in the system tray — click to open, click again to hide. Designed as a passive information surface for staying current with AI and tech trends.

## 2. Goals

- **Single purpose**: Surface GitHub's weekly top 10 trending repos with intelligent summaries
- **Zero friction**: Menu bar icon, one click to open, one click to hide
- **Lightweight**: ~11MB .app bundle, minimal CPU/memory footprint
- **Bilingual**: Full Chinese/English toggle with one button
- **Offline-first**: Cached data loads instantly, refresh only when you want

## 3. Non-Goals

- No data persistence / history / database
- No favorites, bookmarks, or collections
- No push notifications or alerts
- No user accounts or authentication
- No cross-platform support (macOS only)
- No custom filtering or search
- No Anthropic API key required

---

## 4. Architecture

### 4.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Desktop framework | Tauri v2 | ~11MB bundle, native macOS window APIs, tray support |
| Frontend | React 18 + TypeScript | Fast development, component model |
| Styling | Tailwind CSS v4 | Utility-first, `@tailwindcss/vite` plugin |
| Backend (Rust) | reqwest + scraper | HTTP fetch + HTML parsing |
| AI Summarization | Claude Code CLI (`claude -p`) | No API key needed, uses existing Claude Code subscription |
| Window effects | window-vibrancy | Native macOS HudWindow material |
| Build tool | Vite | Fast HMR, Tauri-compatible |

### 4.2 System Diagram

```
                    macOS Menu Bar
                         │
                    [Tray Icon] ← click to toggle
                         │
┌────────────────────────┴─────────────────────────┐
│                  Tauri Shell                      │
│           (HudWindow vibrancy, 16px radius)       │
│                                                   │
│  ┌──────────┐     IPC      ┌──────────────────┐  │
│  │  React   │◄────────────►│    Rust Core     │  │
│  │  WebView │  (commands)  │                  │  │
│  │          │              │  trending.rs     │  │
│  │  App.tsx │              │  ai.rs           │  │
│  │  Detail  │              │  lib.rs (tray)   │  │
│  └──────────┘              └───────┬──────────┘  │
│       │                            │              │
│   localStorage                     │              │
│   (cache + locale)                 │              │
└────────────────────────────────────┼──────────────┘
                     ┌───────────────┼───────────────┐
                     ▼                               ▼
            github.com/trending            claude CLI (-p)
            (HTML scraping)             (local, no API key)
```

---

## 5. Data Flow

### 5.1 Fetch Cycle

1. **Trigger**: First launch (no cache) OR user clicks refresh button
2. **Cache check**: If cached data exists in localStorage, display immediately — skip fetch
3. **Scrape**: Rust backend fetches `github.com/trending?since=weekly`
4. **Parse**: Extract top 10 repos — name, owner, description, stars, weekly stars, language
5. **Summarize**: Rust spawns `claude -p` subprocess with structured prompt
6. **Return**: Structured JSON with summaries in both languages + category
7. **Cache**: Frontend saves response to localStorage
8. **Render**: Frontend displays ranked list

### 5.2 Data Model

```typescript
interface RepoSummary {
  what_is_it: string;
  how_to_use: string;
  why_it_helps: string;
}

interface LocalizedSummary {
  zh: RepoSummary;
  en: RepoSummary;
}

interface AnalyzedRepo {
  rank: number;              // 1-10
  owner: string;             // e.g. "openai"
  name: string;              // e.g. "whisper"
  url: string;               // full GitHub URL
  description: string;       // original repo description
  language: string | null;   // primary language
  stars: string;             // total stars
  weekly_stars: string;      // stars gained this week
  category: string;          // AI-assigned category
  summary: LocalizedSummary;
}
```

### 5.3 AI Summary Strategy

- **Tool**: Claude Code CLI (`claude -p "..."`) — no API key required
- **Single call**: All 10 repos analyzed in one prompt
- **Bilingual**: Both Chinese and English summaries generated simultaneously
- **Categories**: AI Tools, DevOps, Frontend, Backend, Data, Security, Other
- **Audience**: Developer-focused, plain language, no jargon
- **Caching**: Summaries persist in localStorage until manual refresh

---

## 6. UI Specification

### 6.1 Design Principles

- **Native macOS vibrancy**: HudWindow material via `window-vibrancy` crate (not CSS blur)
- **Apple widget aesthetic**: 16px rounded corners, subtle shadows, system font
- **Menu bar app**: No Dock icon, no title bar, tray icon only
- **Single-window model**: List view slides to detail view (same window)

### 6.2 Main Window (List View)

- **Size**: 340 × 520px default, resizable (min 280×360, max 500×800)
- **Position**: Floating, always-on-top
- **Background**: Transparent HTML + native macOS HudWindow vibrancy
- **Trigger**: Click tray icon to show/hide

```
┌──────────────────────────────────┐
│  GitHub 每周热榜        EN  🔄   │  ← drag region + controls
│──────────────────────────────────│
│  1  project-name    Rust  +1.2k★ │
│  2  project-name    Python +980★ │
│  3  project-name    TS    +870★  │
│  4  ...                          │
│  ...                             │
│ 10  project-name    Go    +320★  │
└──────────────────────────────────┘
```

**Row item spec**:
- Rank number (semibold, muted gray)
- Repo name (13px, truncated)
- Owner + language (11px, secondary text)
- Weekly star delta (right-aligned, `+1.2k ★` format)
- Hover: subtle bg highlight with transition
- Click: slides to detail view
- Staggered fade-in animation on load

**Header controls**:
- Title (draggable region)
- Language toggle pill: "EN" ↔ "中"
- Refresh button (spins while loading)

### 6.3 Detail View (Slide-in)

- **Behavior**: Slides in from right within the same window
- **Back**: Arrow button returns to list

```
┌──────────────────────────────────┐
│  ←  project-name         ★ 12k  │
│     owner · ★ 12k               │
│──────────────────────────────────│
│  [TypeScript] [AI Tools]         │
│                                  │
│  WHAT IS IT                      │
│  A one-sentence explanation...   │
│                                  │
│  HOW TO USE                      │
│  Practical usage in 2-3 lines..  │
│                                  │
│  WHY IT HELPS YOU                │
│  Developer-specific benefits...  │
│                                  │
│      [ Open on GitHub ↗ ]        │
└──────────────────────────────────┘
```

### 6.4 States

| State | Display |
|-------|---------|
| Cached data available | Instant display from localStorage |
| Loading (first fetch, no cache) | Skeleton shimmer cards × 10 |
| Error (network) | "Failed to fetch, please retry" + retry button |
| Error (Claude CLI missing) | "Claude Code not found" message |
| Refreshing (has existing data) | Existing list stays visible, refresh icon spins |
| Success | Normal list + detail |

---

## 7. Internationalization (i18n)

### 7.1 Scope

All UI chrome text exists in both Chinese and English:

| Key | 中文 | English |
|-----|------|---------|
| title | GitHub 每周热榜 | GitHub Weekly Hot 10 |
| category | 分类 | Category |
| whatIsIt | 这是什么 | What is it |
| howToUse | 怎么用 | How to use |
| whyItHelps | 对你有什么帮助 | Why it helps you |
| openGithub | 在 GitHub 中打开 | Open on GitHub |
| refresh | 刷新 | Refresh |
| loading | 加载中... | Loading... |
| error | 获取失败，请重试 | Failed to fetch, please retry |
| noCli | 未找到 Claude Code | Claude Code not found |
| back | 返回 | Back |

### 7.2 Implementation

- React context with `locale: 'zh' | 'en'`
- Toggle stored in `localStorage`
- AI summaries pre-generated in both languages (no re-fetch on toggle)

---

## 8. Window & Tray Behavior

### 8.1 Tray Icon

- Custom 22px template icon (trending bar chart)
- `icon_as_template(true)` for native macOS menu bar appearance
- Click (left button, mouse-up) toggles window visibility

### 8.2 Window Properties

| Property | Value |
|----------|-------|
| Resizable | Yes (min 280×360, max 500×800) |
| Always on top | Yes |
| Transparent | Yes (native vibrancy) |
| Title bar | Hidden (custom drag region) |
| Dock icon | None (Accessory activation policy) |
| Skip taskbar | Yes |
| Shadow | Yes |
| Corner radius | 16px (via vibrancy) |

### 8.3 Toggle Logic

```
Click tray icon (left button up):
  if window visible → hide
  if window hidden → show + focus
```

No auto-hide on focus loss. Window stays until explicitly toggled via tray icon.

---

## 9. Caching

- **Storage**: `localStorage` key `github_trending_cache`
- **Contents**: Full `AnalyzedRepo[]` array + `fetchedAt` timestamp
- **Behavior**:
  - App opens → load from cache instantly (no network request)
  - User clicks refresh → fetch fresh data → update cache
  - No automatic expiry — manual refresh only
- **First launch**: No cache → auto-fetch + show skeleton loading

---

## 10. Configuration

**No configuration required.** The app uses the locally installed Claude Code CLI (`claude`) for AI summaries.

Prerequisites:
- Claude Code CLI installed (`~/.local/bin/claude`)
- Active Claude Code subscription

No API keys, no config files, no settings UI.

---

## 11. File Structure

```
github-trending-widget/
├── SPEC.md                        # This file
├── src-tauri/
│   ├── Cargo.toml                 # Rust deps: tauri, reqwest, scraper, etc.
│   ├── tauri.conf.json            # Window config, tray, permissions
│   ├── capabilities/
│   │   └── default.json           # Tauri v2 capability permissions
│   ├── icons/
│   │   ├── icon.png               # App icon (1024px)
│   │   ├── icon.icns              # macOS app icon
│   │   ├── tray-icon.png          # Menu bar icon (22px)
│   │   └── tray-icon@2x.png      # Menu bar icon Retina (44px)
│   └── src/
│       ├── main.rs                # Binary entry point
│       ├── lib.rs                 # Tauri setup, tray, vibrancy, commands
│       ├── trending.rs            # GitHub trending page scraper
│       └── ai.rs                  # Claude CLI integration
├── src/
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Main app (list view + cache logic)
│   ├── types.ts                   # TypeScript interfaces
│   ├── i18n.ts                    # Locale context + translations
│   ├── index.css                  # Global styles + animations
│   └── components/
│       ├── Header.tsx             # Title + language toggle + refresh
│       ├── TrendingItem.tsx       # Single row in list
│       ├── DetailView.tsx         # Expanded repo summary
│       ├── Skeleton.tsx           # Loading placeholder
│       └── ErrorState.tsx         # Error display
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 12. Performance

| Metric | Target | Actual |
|--------|--------|--------|
| .app bundle size | < 15MB | 11MB |
| .dmg size | < 10MB | 4.2MB |
| Frontend JS (gzip) | < 100KB | 64KB |
| Startup (cached) | < 1s | Instant |
| Startup (first fetch) | < 30s | 15-30s (Claude CLI) |
| Idle CPU | ~0% | ~0% |
| Rust tests | All pass | 9/9 |
