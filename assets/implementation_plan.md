# Home Screen Redesign — Premium Habit Dashboard

Complete visual and functional redesign of the Home/Habits screen into a premium daily ritual dashboard with three switchable view modes.

## User Review Required

> [!IMPORTANT]
> **Schema Changes**: This plan adds 3 new columns to the `habits` table (`time_of_day`, `icon`, `sort_order`). These will be added via SQLite migration in [`utils/database.ts`](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/database.ts). Existing habits will default to `time_of_day = 'anytime'`, `icon = null`, `sort_order = 0`. No data loss.

> [!WARNING]
> **Breaking Visual Change**: The existing `HabitCard` component will be preserved but a new, separate set of view components will be created. The old card is still used in other screens (detail, etc). The Home screen will switch to the new view system entirely.

> [!IMPORTANT]
> **User Name**: The greeting header needs the user's display name. The app has `useAuth()` context with `user` object. The name will be derived from `user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'`.

## Open Questions

> [!IMPORTANT]
> **Icon Selection in Create/Edit**: Should we add an icon picker to the Create Habit and Edit Habit forms now, or defer that to a follow-up? The redesign will support icons but existing habits will render a default icon based on the habit color if no icon is set.

> [!IMPORTANT]
> **Time-of-Day Selector**: Should we add a `time_of_day` picker (Morning/Afternoon/Evening/Anytime) to the Create Habit and Edit Habit forms as part of this redesign, or defer? List View grouping depends on this field.

---

## Proposed Changes

### Schema & Types

#### [MODIFY] [database.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/database.ts)
Add 3 new SQLite migration statements after the existing ones:
```sql
ALTER TABLE habits ADD COLUMN time_of_day TEXT DEFAULT 'anytime';
ALTER TABLE habits ADD COLUMN icon TEXT;
ALTER TABLE habits ADD COLUMN sort_order INTEGER DEFAULT 0;
```
Wrapped in try/catch so they're idempotent (column already exists = no-op).

#### [MODIFY] [types.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/types.ts)
Add to `Habit` interface:
```typescript
time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime';
icon?: string | null;
sort_order?: number;
```

#### [MODIFY] [schema.sql](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/schema.sql)
Add the 3 new columns to the Supabase schema for cloud sync compatibility.

---

### Theme & Colors

#### [MODIFY] [theme.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/constants/theme.ts)
Add warm off-white background colors:
```typescript
light: {
  background: '#FAFAF8', // warm off-white instead of pure white
  surface: '#F2F1EE',    // warmer surface
  // ... rest unchanged
}
```

#### [MODIFY] [habit-colors.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/constants/habit-colors.ts)
Add `pastelBg` property to each color for soft card backgrounds:
```typescript
lime: {
  ...existing,
  pastelBg: '#F4F8E8',  // very soft lime
  pastelBgDark: '#1A2408', // dark mode equivalent
}
```

---

### New Components (6 files)

#### [NEW] [components/home/date-selector.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/date-selector.tsx)
Horizontally scrollable weekly date strip:
- Shows ~7 days with day abbreviation (MON) + date number
- Selected date has prominent rounded pill background using tint color
- Today dot indicator when not selected
- Scroll between weeks
- `onSelectDate(date: string)` callback
- Auto-scrolls to today on mount

#### [NEW] [components/home/view-mode-menu.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/view-mode-menu.tsx)
Compact icon button + dropdown popover:
- Shows current mode icon (list/grid/card)
- Tapping opens a small overlay with 3 options + icons + checkmark on selected
- Persists selection to AsyncStorage
- `ViewMode = 'list' | 'grid' | 'card'`

#### [NEW] [components/home/habit-list-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-list-view.tsx)
**List View** — productivity-focused:
- Groups habits by `time_of_day` (Morning → Afternoon → Evening → Anytime)
- Section headers with subtle icon + text
- Each habit: icon square + name + description + completion circle
- Timed habits show timer button
- Lightweight rows, no heavy cards
- Completion circle tap → track habit
- Row tap → navigate to detail

#### [NEW] [components/home/habit-grid-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-grid-view.tsx)
**Grid View** — visual overview:
- 2-column grid
- Each card: soft pastel background from habit color
- Contains: optional time pill, habit icon, name, description, completion indicator
- Card tap → navigate to detail
- Completion indicator tap → track habit
- Subtle press animation (scale)

#### [NEW] [components/home/habit-card-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-card-view.tsx)
**Card View** — immersive editorial:
- Full-width large cards with generous padding
- Soft pastel backgrounds
- Large icon, name, description
- Streak or planned duration badge
- Completion indicator top-right
- Spacious, editorial feel

#### [NEW] [components/home/completion-indicator.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/completion-indicator.tsx)
Shared completion circle/indicator used across all 3 views:
- Empty circle → tap to complete
- Filled circle + animated checkmark → completed
- Partial progress ring
- Skipped/Missed subtle states
- Scale + haptic animation on tap
- Multi-reminder badge (1/2, etc)

---

### Icons

#### [MODIFY] [icons.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/constants/icons.tsx)
Add new icons needed for the redesign:
- `ListViewIcon`, `GridViewIcon`, `CardViewIcon` — for view mode switcher
- `SunIcon`, `MoonIcon`, `StarIcon` — for time-of-day section headers
- Default habit icon (used when `habit.icon` is null) — a simple rounded square icon

---

### Main Screen Rewrite

#### [MODIFY] [habits/index.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/(tabs)/habits/index.tsx)
Complete rewrite of the home screen:

**Structure:**
```
<SafeAreaView>
  <ScrollView>
    {/* Header: Greeting + View Mode Switcher */}
    <Header greeting + name />
    <ViewModeSwitcher />

    {/* Date Selector */}
    <DateSelector selectedDate onSelectDate />

    {/* Progress Summary */}
    <ProgressBar completed/total />

    {/* Habits Content — switches based on viewMode */}
    {viewMode === 'list' && <HabitListView habits />}
    {viewMode === 'grid' && <HabitGridView habits />}
    {viewMode === 'card' && <HabitCardView habits />}

    {/* Empty State */}
    {habits.length === 0 && <EmptyState />}
  </ScrollView>

  {/* Timer Modal — preserved */}
  <Modal>...</Modal>
</SafeAreaView>
```

**Key Logic:**
- `viewMode` state loaded from AsyncStorage on mount, defaults to `'list'`
- `selectedDate` state, defaults to today
- Habits filtered by `selectedDate` using existing scheduling fields (`frequency`, `target_days`, `start_date`, `end_date`)
- Greeting dynamically changes: morning (5-12), afternoon (12-17), evening (17+)
- User name from `useAuth()` context
- All existing tracking/untracking/timer logic preserved
- Notification sync logic preserved

**Scheduling Filter:**
```typescript
function isHabitScheduledForDate(habit: Habit, dateISO: string): boolean {
  // Check start_date / end_date bounds
  // Check frequency: 'daily' → always, 'weekly' → check target_days
  // Check interval
}
```

---

### Preserve Existing Functionality

- **Quick Track**: All 3 views call the same `handleQuickTrack(habit)` from current code
- **Untrack**: All 3 views support untrack via the completion indicator
- **Timer**: All 3 views have a timer button that opens the existing `HabitTimerScreen` modal
- **Navigation**: Tapping a habit navigates to `/habits/[id]` detail screen
- **Notifications**: Background notification sync on mount preserved
- **Multi-reminder badges**: `0/2`, `1/2` etc. preserved in completion indicator
- **Streak logic**: No changes to tracking/streak functions in `actions.ts`

---

### Create/Edit Form Updates

#### [MODIFY] [create.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/(tabs)/create.tsx)
Add `time_of_day` selector (4 chips: Morning, Afternoon, Evening, Anytime) to the form, inserted after the Frequency section.

#### [MODIFY] [habits/edit.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/(tabs)/habits/edit.tsx)
Add same `time_of_day` selector, pre-filled from habit data.

#### [MODIFY] [actions.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/actions.ts)
Update `createHabit()` to include `time_of_day`, `icon`, `sort_order` in the INSERT statement.

---

## Verification Plan

### Manual Verification
1. Launch the app and verify the new Home screen renders with greeting, date selector, and habits
2. Switch between List/Grid/Card views and verify smooth transitions
3. Kill and reopen the app — verify view mode persists
4. Tap dates in the date selector — verify habits filter correctly
5. Complete a habit in each view mode — verify animation, haptics, and data persistence
6. Untrack a habit — verify it reverts correctly
7. Open timer from each view — verify modal works
8. Test with 0 habits — verify empty state
9. Test dark mode — verify all views look correct
10. Create a new habit with time_of_day — verify it appears in correct list group
