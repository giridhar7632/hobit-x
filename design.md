# Design Specification: Hobit Web Landing Page

Technical design system, tokens, layout specifications, and component hierarchy for the Hobit landing page.

---

## 1. Design Tokens & Palette

### Base Theme Variables
```css
:root {
  --bg-primary: #ffffff;
  --bg-surface: #f4f4f5;
  --bg-surface-elevated: #ffffff;
  --border-subtle: #e5e5ea;
  --text-primary: #11181c;
  --text-secondary: #687076;
  --text-muted: #8e8e93;
  --accent-primary: #84cc16;
  --accent-primary-hover: #65a30d;
  --accent-soft: #d9f99d;
  --danger: #ef4444;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
}

[data-theme='dark'] {
  --bg-primary: #151718;
  --bg-surface: #1c1c1e;
  --bg-surface-elevated: #27272a;
  --border-subtle: #2c2c2e;
  --text-primary: #ecedee;
  --text-secondary: #9ba1a6;
  --text-muted: #636366;
  --accent-primary: #84cc16;
  --accent-primary-hover: #a3e635;
  --accent-soft: rgba(132, 204, 22, 0.15);
  --danger: #f87171;
}
```

### Habit Category Accent Palettes
| Key | Label | Hex Accent | Hex Light Soft | Dark Surface Class |
| :--- | :--- | :--- | :--- | :--- |
| `lime` | Lime | `#84cc16` | `#d9f99d` | `bg-lime-500/10 text-lime-400 border-lime-500/30` |
| `rose` | Rose | `#f43f5e` | `#fecdd3` | `bg-rose-500/10 text-rose-400 border-rose-500/30` |
| `emerald`| Sage | `#10b981` | `#a7f3d0` | `bg-emerald-500/10 text-emerald-400 border-emerald-500/30` |
| `sky` | Sky | `#0ea5e9` | `#bae6fd` | `bg-sky-500/10 text-sky-400 border-sky-500/30` |
| `amber` | Peach | `#f59e0b` | `#fef3c7` | `bg-amber-500/10 text-amber-400 border-amber-500/30` |
| `indigo` | Lavender | `#6366f1` | `#c7d2fe` | `bg-indigo-500/10 text-indigo-400 border-indigo-500/30` |

---

## 2. Typography Specification

* **Primary Font**: `Poppins`, sans-serif (`@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap')`)
* **Monospace Font**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| Level | Size / Line Height | Weight | Tailwind Class |
| :--- | :--- | :--- | :--- |
| Display Hero | 64px / 1.1 (Desktop), 40px / 1.2 (Mobile) | 700 | `text-4xl md:text-6xl font-bold tracking-tight` |
| Section Title | 36px / 1.2 (Desktop), 28px / 1.2 (Mobile) | 700 | `text-2xl md:text-4xl font-bold tracking-tight` |
| Card Title | 20px / 1.3 | 600 | `text-xl font-semibold` |
| Body Text | 16px / 1.6 | 400 | `text-base font-normal text-neutral-300` |
| Small / Label | 13px / 1.4 | 500 | `text-xs font-medium uppercase tracking-wider` |
| Code / Data | 12px / 1.5 | 400 | `font-mono text-xs text-neutral-400` |

---

## 3. Layout Grid & Container Structure

* **Max Width**: `max-w-6xl` (1152px) centered with `px-4 sm:px-6 lg:px-8`.
* **Section Vertical Spacing**: `py-20 md:py-28`.
* **Card Corner Radius**: `rounded-3xl` (`24px`).
* **Input / Button Radius**: `rounded-xl` (`12px`) or `rounded-full`.
* **Elevation / Glass**:
  - Glass card: `bg-[#1c1c1e]/80 backdrop-blur-md border border-[#2c2c2e]`
  - Hover state: `hover:border-lime-500/40 transition-colors duration-200`

---

## 4. Page Architecture & Section Wireframes

```
+-------------------------------------------------------------------+
| Navbar (Sticky): [Logo: Hobit]  [Features  Engine  Demo  FAQ] [CTA] |
+-------------------------------------------------------------------+
| Hero Section                                                      |
|   Left Column (Text):                                             |
|     - Architecture Badge (Meridian Lite + Supabase)               |
|     - Headline: Offline-First Habit Tracking. Instant Local Writes|
|     - Description & Platform Badges (iOS / Android / Web)         |
|     - Dual CTA buttons: [Download App] [Explore Architecture]     |
|   Right Column (Interactive Preview):                             |
|     - Live Habit Checklist Card (clickable progress ring)         |
|     - Live Streak counter & daily milestone indicator             |
+-------------------------------------------------------------------+
| Architecture Bento Grid (5 Cards)                                 |
|   [ 1. SQLite Local DB ]      [ 2. Meridian Lite FIFO Outbox ]    |
|   [ 3. Supabase RLS Cloud ]   [ 4. 60-Tick Focus Timer ]          |
|   [ 5. 365-Day Activity Heatmap Grid ]                            |
+-------------------------------------------------------------------+
| Live Interactive Playground                                       |
|   - Toggle habit status (Completed / Partial / Missed)            |
|   - Real-time streak recalculation demonstration                  |
+-------------------------------------------------------------------+
| Feature Breakdown (3 Columns)                                     |
|   - Local Notifications  - Guest Mode Support  - Zero Lock-in     |
+-------------------------------------------------------------------+
| Technical FAQ (Accordion)                                         |
+-------------------------------------------------------------------+
| Footer: [Repo Link] [Schema & Docs] [Copyright]                   |
+-------------------------------------------------------------------+
```

---

## 5. Section Component Details

### 5.1 Hero Component
* **Tagline Badge**: `Border rounded-full px-3.5 py-1 text-xs font-semibold bg-lime-500/10 text-lime-400 border-lime-500/30`
* **Copy**:
  - Title: "Offline-First Habit Tracker with Zero Cloud Latency"
  - Subtitle: "Writes execute instantly against local SQLite. Outbox queue synchronizes with Supabase PostgreSQL and Row Level Security when network connectivity is available."
* **Action Buttons**:
  - Primary: `bg-[#84cc16] hover:bg-[#65a30d] text-black font-semibold px-6 py-3 rounded-xl`
  - Secondary: `bg-[#1c1c1e] hover:bg-[#27272a] text-white border border-[#2c2c2e] px-6 py-3 rounded-xl`

### 5.2 Architecture Bento Grid
Grid: `grid grid-cols-1 md:grid-cols-3 gap-4`

1. **Card 1 (SQLite Local Engine)**:
   - Span: `col-span-1 md:col-span-2`
   - Content: Local execution path (`meridian_lite_hobit_app.db`), query performance (0ms network overhead), offline durability.
2. **Card 2 (FIFO Outbox Sync)**:
   - Span: `col-span-1`
   - Content: Transactional mutation queue representation (`create_habit`, `track_habit`), auto-retry with exponential backoff.
3. **Card 3 (Supabase RLS Auth)**:
   - Span: `col-span-1`
   - Content: Google SSO, PostgreSQL schema with foreign keys, row level security policies enforcing `auth.uid() = user_id`.
4. **Card 4 (Interactive Focus Ring)**:
   - Span: `col-span-1`
   - Content: SVG 60-tick circular progress ring, duration countdown display.
5. **Card 5 (Activity Heatmap)**:
   - Span: `col-span-1 md:col-span-2`
   - Content: 7x16 grid of day cells color-coded by completion status (`Completed` `#84cc16`, `Partial` `#f59e0b`, `Skipped` `#687076`, `Missed` `#ef4444`).

### 5.3 Interactive Habit Simulator Props
```typescript
interface HabitItem {
  id: string;
  name: string;
  plannedMinutes: number;
  currentStreak: number;
  status: 'pending' | 'completed' | 'partial';
  color: 'lime' | 'rose' | 'emerald' | 'sky' | 'amber' | 'indigo';
}

const mockHabits: HabitItem[] = [
  { id: '1', name: 'Deep Work Session', plannedMinutes: 45, currentStreak: 12, status: 'completed', color: 'lime' },
  { id: '2', name: 'Hydration & Mobility', plannedMinutes: 15, currentStreak: 8, status: 'completed', color: 'emerald' },
  { id: '3', name: 'Technical Reading', plannedMinutes: 30, currentStreak: 5, status: 'pending', color: 'sky' },
];
```

---

## 6. Technical Stack Requirements

* **Framework**: Next.js (App Router) or React 18+ with TypeScript.
* **Styling**: Tailwind CSS.
* **Animation**: `framer-motion` (limited to entry transitions and tab switches; duration `<= 0.25s`).
* **Icons**: `lucide-react` (`CheckCircle2`, `Flame`, `Database`, `RefreshCw`, `ShieldCheck`, `Clock`, `ArrowRight`).
