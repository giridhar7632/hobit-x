# Guided Multi-Step "Create Habit" Experience — Implementation Plan

Redesign the entire habit creation experience into a guided 4-step journey with habit templates, an icon picker, progressive disclosure, and customizable tracking goals (completion, time, or quantity).

---

## User Review Required

> [!IMPORTANT]
> **Database Schema Additions**:
> We will add 4 new columns to the SQLite `habits` table and Supabase schema:
> - `completion_type TEXT DEFAULT 'check'` (`'check' | 'time' | 'quantity'`)
> - `target_value NUMERIC` (e.g. 20 for 20 minutes or 8 for 8 glasses)
> - `target_unit TEXT` (e.g. `'minutes'`, `'glasses'`, `'pages'`)
> - `reminder_message TEXT` (personalized notification message)
>
> All additions are non-destructive and idempotent. Existing habits will default to `completion_type = 'check'`.

> [!IMPORTANT]
> **Navigation Flow**:
> Tapping the "+" tab will now initially show **Screen 1 (Templates & Discovery)**:
> - Users can pick a popular or curated template (e.g. Reading, Water, Exercise, Meditate, Journal) to pre-fill the wizard.
> - Or tap "+ Create a custom habit" at the bottom to start with a blank form.
> - Navigating back during the wizard preserves all entered values.

---

## Proposed Changes

### 1. Database & Types

#### [MODIFY] [utils/database.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/database.ts)
Add additive migrations for the 4 new columns:
```typescript
const columnMigrations = [
  // ... existing migrations
  `ALTER TABLE habits ADD COLUMN completion_type TEXT DEFAULT 'check'`,
  `ALTER TABLE habits ADD COLUMN target_value NUMERIC`,
  `ALTER TABLE habits ADD COLUMN target_unit TEXT`,
  `ALTER TABLE habits ADD COLUMN reminder_message TEXT`,
];
```

#### [MODIFY] [utils/types.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/types.ts)
Add to `Habit` interface:
```typescript
completion_type?: 'check' | 'time' | 'quantity';
target_value?: number | null;
target_unit?: string | null;
reminder_message?: string | null;
```

#### [MODIFY] [utils/schema.sql](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/schema.sql)
Add the columns to `public.habits` in Supabase schema.

#### [MODIFY] [utils/actions.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/actions.ts)
Update `createHabit()` and `updateHabit()` SQL queries to insert and update `completion_type`, `target_value`, `target_unit`, and `reminder_message`.

---

### 2. Templates & Icon Registry

#### [NEW] [constants/habit-templates.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/constants/habit-templates.ts)
Define pre-configured templates categorized into:
- **Popular**: Reading (📚), Drink Water (💧), Exercise (🏃)
- **Mind & Focus**: Meditate (🧘), Journal (✍️), Reduce Screen Time (📵)
- **Learning**: Practice Coding (💻), Learn a Language (🗣), Study (📖)
- **Health & Wellness**: Vitamins (💊), Sleep Well (😴), Daily Walk (🚶)

Each template contains default icon, title, description, color, time_of_day, frequency, completion_type, target_value, and target_unit.

#### [NEW] [components/create/icon-picker-modal.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/icon-picker-modal.tsx)
Dedicated icon picker bottom sheet / modal:
- Real-time search ("🔍 Search icons")
- Categories: Popular, Fitness, Learning, Health, Mind & Focus, Finance, Lifestyle
- 4-5 column clean grid of rounded squares
- Selected icon highlighted with accent background and checkmark
- Tapping an icon selects it and returns to Step 1 immediately

---

### 3. Creation Flow Components

#### [NEW] [components/create/step-progress-header.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/step-progress-header.tsx)
- Shows "Step X of 4"
- Smooth animated progress bar (25% → 50% → 75% → 100%)
- Step title and supporting description
- Back navigation button

#### [NEW] [components/create/template-picker-screen.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/template-picker-screen.tsx)
- Header: "← Back", "Let's build a new habit", "Start with something popular or create your own."
- Categorized template cards:
  - Icon inside soft rounded square
  - Title and subtitle
  - Subtle `+` action button
- Bottom option: "+ Create a custom habit" with supporting subtitle

#### [NEW] [components/create/step-identity.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/step-identity.tsx)
- Large center icon preview (touchable to open Icon Picker)
- Habit name input (autofocused, validation error if empty)
- Description input (optional)
- Color swatches row with ring selection indicator

#### [NEW] [components/create/step-schedule.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/step-schedule.tsx)
- 4 large Time of Day cards: Morning (☀️), Afternoon (🌤), Evening (🌙), Anytime (✦)
- Frequency selector ("Every day", "Specific days", "Every X days")
- Progressive disclosure:
  - Day toggles (`[M] [T] [W] [T] [F] [S] [S]`) for "Specific days"
  - Stepper (`[-] [N] [+]`) for "Every X days"

#### [NEW] [components/create/step-goal.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/step-goal.tsx)
- 3 large selectable cards:
  1. `Just complete it` (`check`)
  2. `Track time` (`time`)
  3. `Track quantity` (`quantity`)
- Dynamic configuration:
  - If `time`: duration input + quick chips (5m, 10m, 15m, 20m, 30m, 45m, 1h)
  - If `quantity`: target number + unit chips (pages, glasses, steps, reps, km) + custom unit input

#### [NEW] [components/create/step-reminder.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/create/step-reminder.tsx)
- "Remind me" toggle switch (default off)
- When off: calm message ("No problem. You can always add a reminder later.")
- When on:
  - Reminder time picker button
  - Optional reminder message input with suggestion chips ("Let's do this!", "Time for your habit", "Small steps matter", "Don't break the streak")
- Pre-creation summary card displaying icon, name, schedule, goal, and reminder
- Full-width prominent "Create Habit" button

---

### 4. Screen Controller

#### [MODIFY] [app/(tabs)/create.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/(tabs)/create.tsx)
- Coordinate multi-step flow state: `stage: 'templates' | 1 | 2 | 3 | 4`
- Maintain unified habit draft state across transitions so going back never clears data
- Standardized bottom navigation bar (`Cancel / Back` and `Next / Create Habit`)
- Final submission:
  - Save to local SQLite database via `createHabit()`
  - Schedule notification (incorporating custom reminder message)
  - Enqueue to Meridian Lite outbox for sync
  - Navigate to new habit detail screen

---

### 5. Home Views Icon Display

#### [MODIFY] [components/home/habit-list-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-list-view.tsx)
#### [MODIFY] [components/home/habit-grid-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-grid-view.tsx)
#### [MODIFY] [components/home/habit-card-view.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/home/habit-card-view.tsx)
- Render `habit.icon` inside the habit icon container if specified, falling back to `SproutIcon` when null.

---

## Verification Plan

### Automated Checks
- Run TypeScript verification:
  ```bash
  npx tsc --noEmit
  ```

### Manual Verification
1. **Template Selection**: Open Create tab → verify template cards render with icons, titles, and `+` buttons.
2. **Template Pre-fill**: Tap "Reading every day" → verify Step 1 opens with 📚, "Reading", 20 min preset.
3. **Custom Habit**: Tap "+ Create a custom habit" → verify clean blank wizard starts at Step 1.
4. **Icon Picker**: Tap icon on Step 1 → verify categorized grid opens, search works, selecting updates icon and returns to Step 1.
5. **Back/Next Navigation**: Enter name, proceed to Step 2 & 3, go back to Step 1 → verify name and selections remain intact.
6. **Goal Selection**: Test "Just complete it", "Track time" (with quick chips), and "Track quantity" (with unit chips).
7. **Reminder & Message**: Toggle reminder ON → verify time selector and message suggestion chips appear.
8. **Habit Creation**: Tap "Create Habit" → verify habit is saved, shows in Home screen with correct icon, color, schedule, and goal.
9. **Dark & Light Mode**: Verify smooth aesthetics, soft pastel colors, and readable typography across both modes.
