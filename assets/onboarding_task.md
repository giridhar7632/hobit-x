# Task: First-Time User Value-First Onboarding Flow

- [ ] 1. Core Onboarding State & Persistence <!-- id: 1 -->
  - [ ] Implement `utils/onboarding.ts` with AsyncStorage persistence (step, draft, completed flag, hint flag) <!-- id: 1.1 -->
- [ ] 2. Onboarding Components <!-- id: 2 -->
  - [ ] Build `components/onboarding/onboarding-welcome.tsx` with editorial typography, quote, and Get Started CTA <!-- id: 2.1 -->
  - [ ] Build `components/onboarding/onboarding-choose.tsx` with category filters, template cards, and custom habit option <!-- id: 2.2 -->
  - [ ] Build `components/onboarding/onboarding-ready.tsx` with celebration animation, habit summary card, and continue CTA <!-- id: 2.3 -->
  - [ ] Build `components/onboarding/onboarding-auth.tsx` with value proposition, Google sign-in, and "Not now" guest mode <!-- id: 2.4 -->
- [ ] 3. Master Onboarding Controller <!-- id: 3 -->
  - [ ] Build `app/onboarding.tsx` integrating welcome, choose, 4-step wizard, ready, and auth with persistent state <!-- id: 3.1 -->
- [ ] 4. Routing & App Integration <!-- id: 4 -->
  - [ ] Update `app/index.tsx` to route first-time users to `/onboarding` and returning users to Home or Auth <!-- id: 4.1 -->
  - [ ] Register `onboarding` screen in `app/_layout.tsx` <!-- id: 4.2 -->
  - [ ] Add first-time contextual hint banner in `app/(tabs)/habits/index.tsx` <!-- id: 4.3 -->
- [ ] 5. Verification & Testing <!-- id: 5 -->
  - [ ] Run `npx tsc --noEmit` <!-- id: 5.1 -->
  - [ ] Verify onboarding flow, guest habit creation, state resumption, and home screen presentation <!-- id: 5.2 -->
