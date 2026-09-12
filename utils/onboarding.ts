import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeOfDay } from './notifications';

export const ONBOARDING_COMPLETED_KEY = '@hobit_onboarding_completed';
export const ONBOARDING_STEP_KEY = '@hobit_onboarding_step';
export const ONBOARDING_DRAFT_KEY = '@hobit_onboarding_draft';
export const FIRST_HINT_DISMISSED_KEY = '@hobit_first_hint_dismissed';

export type OnboardingStep =
  | 'welcome'
  | 'choose'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'ready';

export interface OnboardingHabitDraft {
  icon: string;
  name: string;
  description: string;
  color: string;
  times_of_day: TimeOfDay[];
  frequency: 'daily' | 'weekly' | 'interval';
  target_days: number[];
  interval: number;
  completion_type: 'check' | 'time' | 'quantity';
  planned_time_minutes: number;
  target_value: number;
  target_unit: string;
  notify: boolean;
  notify_times: string[]; // ISO strings for safe serialization
  reminder_message: string;
}

export const DEFAULT_ONBOARDING_DRAFT: OnboardingHabitDraft = {
  icon: 'SproutIcon',
  name: '',
  description: '',
  color: 'purple',
  times_of_day: ['anytime'],
  frequency: 'daily',
  target_days: [1, 2, 3, 4, 5],
  interval: 1,
  completion_type: 'check',
  planned_time_minutes: 0,
  target_value: 0,
  target_unit: '',
  notify: false,
  notify_times: [
    (() => {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    })(),
  ],
  reminder_message: '',
};

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function completeOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
    await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch (e) {
    console.error('Failed to complete onboarding:', e);
  }
}

export async function saveOnboardingStep(step: OnboardingStep): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step);
  } catch (e) {
    console.error('Failed to save onboarding step:', e);
  }
}

export async function getSavedOnboardingStep(): Promise<OnboardingStep | null> {
  try {
    const step = await AsyncStorage.getItem(ONBOARDING_STEP_KEY);
    return step as OnboardingStep | null;
  } catch {
    return null;
  }
}

export async function saveOnboardingDraft(draft: OnboardingHabitDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save onboarding draft:', e);
  }
}

export async function getSavedOnboardingDraft(): Promise<OnboardingHabitDraft | null> {
  try {
    const json = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function clearOnboardingDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {}
}

export async function hasDismissedFirstHint(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(FIRST_HINT_DISMISSED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function dismissFirstHint(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_HINT_DISMISSED_KEY, 'true');
  } catch {}
}
