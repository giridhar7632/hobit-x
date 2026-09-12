# Value-First Onboarding Flow — Implementation Plan

Build a complete first-time user onboarding flow that guides the user directly to their first meaningful outcome: **creating their first habit**, without gating them behind authentication up front.

---

## User Review Required

> [!IMPORTANT]
> **No Upfront Login / Guest First Experience**:
> - New installs will immediately see the **Welcome Screen** and proceed directly to **Choose a Habit** and **Customize Habit**.
> - Authentication is only presented **after** the first habit is fully configured ("Save your progress").
> - Users can choose **"Continue with Google"** or tap **"Not now"** to proceed as a guest. Both paths save the habit and mark onboarding as complete.
> - Returning users who already have an account can tap *"Already have an account? Sign in"* on the Welcome screen to go straight to `/auth`.

> [!IMPORTANT]
> **Crash & Resumption Safety**:
> - If the user backgrounds or kills the app halfway through onboarding, their current step and habit draft are persisted in `AsyncStorage` and restored upon reopening.
> - Once completed, onboarding is never shown again (`@hobit_onboarding_completed = 'true'`).

---

## Architecture & State Machine

```
               ┌──────────────────────────────┐
               │         app/index.tsx        │
               └──────────────┬───────────────┘
                              │
               Has completed onboarding?
               ├──────────────┴───────────────┐
               ▼ NO                           ▼ YES
      ┌─────────────────┐             ┌──────────────────┐
      │  /onboarding    │             │  user || isGuest │
      └────────┬────────┘             └────────┬─────────┘
               │                               │
               ▼                               ├───────► /(tabs)/habits
    ┌───────────────────────┐                  ▼
    │ 1. WELCOME            │                /auth
    └──────────┬────────────┘
               │ "Get Started"
               ▼
    ┌───────────────────────┐
    │ 2. CHOOSE A HABIT     │ (Templates with Category Filter + Custom)
    └──────────┬────────────┘
               │ Select / Custom
               ▼
    ┌───────────────────────┐
    │ 3. CUSTOMIZE HABIT    │
    │   • Step 1 Identity   │
    │   • Step 2 Schedule   │ (Multi-time support: Morning + Evening)
    │   • Step 3 Success    │ (Check / Time / Quantity)
    │   • Step 4 Reminder   │ (Optional multi-reminders)
    └──────────┬────────────┘
               │ "Finish Setup"
               ▼
    ┌───────────────────────┐
    │ 4. FIRST HABIT READY  │ (Accomplishment checkmark + Preview Card)
    └──────────┬────────────┘
               │ "Continue"
               ▼
    ┌───────────────────────┐
    │ 5. SAVE YOUR PROGRESS │ (Authentication Gate)
    └──────────┬────────────┘
               ├───────────────────────────────┐
               ▼ [Continue with Google]        ▼ [Not now]
       Authenticate via Supabase            Enable Guest Mode
               │                               │
               ▼                               ▼
       Save Habit (user_id)             Save Habit (guest)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                   Mark Onboarding Complete
                               ▼
                   Navigate to Home Screen
               (With subtle first-time hint)
```

---

## Proposed Changes

### 1. Onboarding State & Persistence Manager

#### [NEW] [utils/onboarding.ts](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/utils/onboarding.ts)
- Manages `AsyncStorage` keys:
  - `@hobit_onboarding_completed`: boolean string (`'true'`)
  - `@hobit_onboarding_step`: string (`'welcome' | 'choose' | 'step1' | 'step2' | 'step3' | 'step4' | 'ready' | 'auth'`)
  - `@hobit_onboarding_draft`: serialized `HabitDraft`
  - `@hobit_first_hint_dismissed`: boolean string
- Functions:
  - `hasCompletedOnboarding(): Promise<boolean>`
  - `getOnboardingState(): Promise<{ step: string; draft: HabitDraft | null }>`
  - `saveOnboardingStep(step: string): Promise<void>`
  - `saveOnboardingDraft(draft: HabitDraft): Promise<void>`
  - `completeOnboarding(): Promise<void>`
  - `clearOnboardingDraft(): Promise<void>`
  - `hasDismissedFirstHint(): Promise<boolean>`
  - `dismissFirstHint(): Promise<void>`

---

### 2. Onboarding Screens & Components

#### [NEW] [components/onboarding/onboarding-welcome.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/onboarding/onboarding-welcome.tsx)
- Editorial typography, generous whitespace, soft neutral palette.
- App emblem / sprout graphic at top.
- Headline: *"Build a life you want to wake up to."*
- Subtitle: *"Small actions, repeated every day, become something bigger."*
- Subtle rotating/randomized motivational quote (e.g. James Clear, Aristotle, Seneca).
- Primary CTA: `[ Get Started ]`
- Subtle secondary text: *"Already have an account? Sign in"* (links to `/auth`).

#### [NEW] [components/onboarding/onboarding-choose.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/onboarding/onboarding-choose.tsx)
- Header: *"What would you like to work on?"*
- Subtitle: *"Start with something small. You can always add more later."*
- Horizontal filter categories: `All`, `Popular`, `Mind & Focus`, `Learning`, `Health & Wellness`.
- Rounded cards displaying templates with icon, name, description, and `+` action:
  - Reading 📚
  - Exercise 🏃
  - Drink Water 💧
  - Meditation 🧘
  - Practice Coding 💻
  - Sleep Better 😴
  - Skincare Routine ✨ (Morning & Evening)
- Bottom option: *"Can't find what you're looking for? + Create a custom habit"*.

#### [NEW] [components/onboarding/onboarding-ready.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/onboarding/onboarding-ready.tsx)
- Accomplishment celebration:
  - Animated checkmark ring (smooth spring).
  - Headline: *"You're ready to begin."*
  - Curated habit card preview showing selected icon, name, frequency, and time/target.
  - Subtitle: *"Your first habit is ready. Small actions become meaningful when you show up consistently."*
  - Primary CTA: `[ Continue ]`

#### [NEW] [components/onboarding/onboarding-auth.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/components/onboarding/onboarding-auth.tsx)
- Value-first design:
  - Headline: *"Save your progress"*
  - Subtitle: *"Create an account to keep your habits safe and access them across your devices."*
  - Concise benefit pills:
    - ✓ Keep your habits safe
    - ✓ Sync across devices
    - ✓ Never lose your streak
  - Primary action: `[ Continue with Google ]` with official Google badge styling.
  - Secondary action: `Not now` (guest mode).

#### [NEW] [app/onboarding.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/onboarding.tsx)
- Master coordinator for the onboarding flow.
- Restores persisted step and draft on mount.
- Seamlessly transitions between:
  `welcome` → `choose` → `step1` → `step2` → `step3` → `step4` → `ready` → `auth`.
- Leverages existing `StepIdentity`, `StepSchedule`, `StepGoal`, `StepReminder`, and `IconPickerModal`.
- On completion (Google or Guest):
  - Calculates base points.
  - Generates notifications via `refreshHabitNotifications`.
  - Creates the habit in SQLite / Meridian Lite.
  - Marks onboarding complete.
  - Navigates to `/(tabs)/habits`.

---

### 3. Navigation & App Integration

#### [MODIFY] [app/index.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/index.tsx)
- Check `hasCompletedOnboarding()`.
- If `false`: redirect to `/onboarding`.
- If `true`: redirect to `/(tabs)/habits` (if user or isGuest) or `/auth`.

#### [MODIFY] [app/_layout.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/_layout.tsx)
- Register `onboarding` screen in Root Stack:
  `<Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />`

#### [MODIFY] [app/(tabs)/habits/index.tsx](file:///Users/giridhartalla/Downloads/01-projects/hobit-x/app/(tabs)/habits/index.tsx)
- First-time user contextual hint:
  - If `@hobit_first_hint_dismissed` is false and habits exist, show subtle toast banner:
    *"💡 Tap the circle when you've finished your session."*
  - Automatically dismisses and persists dismissal upon user's first track or untrack.

---

## Verification Plan

### Automated Checks
- Type safety verification:
  ```bash
  npx tsc --noEmit
  ```

### Interactive Flow Verification
1. **Fresh Launch / Welcome Screen**:
   - Verify app opens on `/onboarding` (Welcome screen).
   - Check editorial typography, quote, and "Get Started" CTA.
   - Verify "Already have an account? Sign in" navigates to `/auth`.
2. **Choose Habit**:
   - Tap "Get Started" → verify category filter and habit template cards.
   - Tap "Skincare routine" → verify wizard pre-fills with morning & evening.
3. **Customization Wizard (Steps 1-4)**:
   - Step 1: edit name, choose icon, pick color.
   - Step 2: verify Morning & Evening time selection.
   - Step 3: verify completion type selection.
   - Step 4: verify reminder toggle and time picker.
4. **App Accomplishment & Auth Gate**:
   - Tap "Finish Setup" → celebration screen displays with habit card.
   - Tap "Continue" → "Save your progress" screen appears.
5. **Guest Mode ("Not now")**:
   - Tap "Not now" → habit is saved locally as guest, redirects to Home.
   - Verify newly created habit appears in Home list.
   - Verify contextual hint tooltip appears and dismisses upon tapping the habit circle.
6. **Persistence & Resume**:
   - Background app at Step 3 or Auth screen → reopen and verify progress was preserved.
