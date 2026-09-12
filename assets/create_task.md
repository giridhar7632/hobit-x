# Guided "Create Habit" Experience — Tasks

- `[ ]` **Schema & Database**
  - `[ ]` Add migrations in `utils/database.ts` (`completion_type`, `target_value`, `target_unit`, `reminder_message`)
  - `[ ]` Update `utils/types.ts` `Habit` interface
  - `[ ]` Update `utils/schema.sql`
  - `[ ]` Update `utils/actions.ts` `createHabit` and `updateHabit`

- `[ ]` **Templates & Icons**
  - `[ ]` Create `constants/habit-templates.ts`
  - `[ ]` Create `components/create/icon-picker-modal.tsx`

- `[ ]` **Wizard Step Components**
  - `[ ]` Create `components/create/step-progress-header.tsx`
  - `[ ]` Create `components/create/template-picker-screen.tsx`
  - `[ ]` Create `components/create/step-identity.tsx` (Step 1)
  - `[ ]` Create `components/create/step-schedule.tsx` (Step 2)
  - `[ ]` Create `components/create/step-goal.tsx` (Step 3)
  - `[ ]` Create `components/create/step-reminder.tsx` (Step 4)

- `[ ]` **Screen Controller**
  - `[ ]` Rewrite `app/(tabs)/create.tsx` to orchestrate multi-step flow with preserved draft state

- `[ ]` **Home Screen Icon Rendering**
  - `[ ]` Update `habit-list-view.tsx`, `habit-grid-view.tsx`, and `habit-card-view.tsx` to display custom icons

- `[ ]` **Verification**
  - `[ ]` Run `npx tsc --noEmit`
