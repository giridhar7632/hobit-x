# Home Screen Redesign — Tasks

- `[ ]` **Schema & Types**
  - `[ ]` Add migrations to `database.ts` (time_of_day, icon, sort_order)
  - `[ ]` Update `types.ts` Habit interface
  - `[ ]` Update `schema.sql` for Supabase
  - `[ ]` Update `actions.ts` createHabit INSERT

- `[ ]` **Theme & Colors**
  - `[ ]` Update `theme.ts` with warm off-white
  - `[ ]` Add `pastelBg` to `habit-colors.ts`

- `[ ]` **Icons**
  - `[ ]` Add ListViewIcon, GridViewIcon, CardViewIcon to `icons.tsx`
  - `[ ]` Add SunIcon, MoonIcon, StarIcon for time-of-day headers

- `[ ]` **New Components**
  - `[ ]` `components/home/date-selector.tsx`
  - `[ ]` `components/home/view-mode-menu.tsx`
  - `[ ]` `components/home/completion-indicator.tsx`
  - `[ ]` `components/home/habit-list-view.tsx`
  - `[ ]` `components/home/habit-grid-view.tsx`
  - `[ ]` `components/home/habit-card-view.tsx`

- `[ ]` **Main Screen Rewrite**
  - `[ ]` Rewrite `habits/index.tsx` with new layout

- `[ ]` **Create/Edit Form Updates**
  - `[ ]` Add time_of_day selector to `create.tsx`
  - `[ ]` Add time_of_day selector to `habits/edit.tsx`

- `[ ]` **Verification**
  - `[ ]` TypeScript compilation check
  - `[ ]` Visual verification
