import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMeridianMutation, useQueryClient } from 'meridian-lite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepGoal } from '@/components/create/step-goal';
import { StepIdentity } from '@/components/create/step-identity';
import { StepProgressHeader } from '@/components/create/step-progress-header';
import { StepReminder } from '@/components/create/step-reminder';
import { StepSchedule } from '@/components/create/step-schedule';
import { StepSummary } from '@/components/create/step-summary';
import { OnboardingChoose } from '@/components/onboarding/onboarding-choose';
import { OnboardingReady } from '@/components/onboarding/onboarding-ready';
import { OnboardingWelcome } from '@/components/onboarding/onboarding-welcome';
import Button from '@/components/ui/button';
import { getContrastTextColor, HABIT_COLORS } from '@/constants/habit-colors';
import { HabitTemplate } from '@/constants/habit-templates';
import { ChevronIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createHabit } from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import {
  getDefaultReminderTimesForSessions,
  parseTimesOfDay,
  refreshHabitNotifications,
} from '@/utils/notifications';
import {
  completeOnboarding,
  DEFAULT_ONBOARDING_DRAFT,
  getSavedOnboardingDraft,
  getSavedOnboardingStep,
  OnboardingHabitDraft,
  OnboardingStep,
  saveOnboardingDraft,
  saveOnboardingStep,
} from '@/utils/onboarding';
import { getBasePoints } from '@/utils/points';

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Make it yours',
    subtitle: 'Give your first habit a name and identity.',
  },
  2: {
    title: 'Schedule it',
    subtitle: 'When does this fit into your life?',
  },
  3: {
    title: 'Define success',
    subtitle: 'What does success look like for this habit?',
  },
  4: {
    title: 'Stay on track',
    subtitle: 'Want a little nudge to keep your momentum?',
  },
  5: {
    title: 'Review your habit',
    subtitle: 'Confirm your ritual before you begin.',
  },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [draft, setDraft] = useState<OnboardingHabitDraft>(DEFAULT_ONBOARDING_DRAFT);
  const [isRestored, setIsRestored] = useState(false);
  const [isSavingHabit, setIsSavingHabit] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';
  const { setActiveColor, resetColor } = useAppTheme();
  const { signInWithGoogle, signInAsGuest, user } = useAuth();

  const queryClient = useQueryClient();
  const { mutate: mutateCreateHabit } = useMeridianMutation({
    invalidateKeys: [['habits']],
  });

  // Restore persisted state on mount
  useEffect(() => {
    async function restoreState() {
      try {
        const savedStep = await getSavedOnboardingStep();
        const savedDraft = await getSavedOnboardingDraft();
        if (savedDraft) {
          setDraft(savedDraft);
          if (savedDraft.color) {
            setActiveColor(savedDraft.color);
          }
        }
        if (savedStep) {
          setStep(savedStep);
        }
      } catch (e) {
        console.warn('Failed to restore onboarding state:', e);
      } finally {
        setIsRestored(true);
      }
    }
    restoreState();
  }, []);

  // Persist step and draft on changes
  const updateStep = (newStep: OnboardingStep) => {
    setStep(newStep);
    saveOnboardingStep(newStep).catch(() => { });
  };

  const updateDraft = (updater: (prev: OnboardingHabitDraft) => OnboardingHabitDraft) => {
    setDraft((prev) => {
      const next = updater(prev);
      saveOnboardingDraft(next).catch(() => { });
      return next;
    });
  };

  const selectedColorDef = HABIT_COLORS[draft.color] || HABIT_COLORS.purple;
  const accentColor = selectedColorDef.accent;

  // Direct sign in on Welcome screen
  const handleWelcomeSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Notice', error.message);
      } else {
        await completeOnboarding();
        resetColor();
        router.replace('/(tabs)/habits');
      }
    } catch (e: any) {
      Alert.alert('Sign In Error', e.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSelectTemplate = (template: HabitTemplate) => {
    const timesOfDay = parseTimesOfDay(template.time_of_day);
    const defaultDates = getDefaultReminderTimesForSessions(timesOfDay);

    updateDraft((d) => ({
      ...d,
      icon: template.icon || 'SparklesIcon',
      name: template.name,
      description: template.description || '',
      color: template.color || 'purple',
      times_of_day: timesOfDay,
      frequency: template.frequency || 'daily',
      target_days: template.target_days || [1, 2, 3, 4, 5],
      interval: 1,
      completion_type: template.completion_type || 'check',
      planned_time_minutes: template.planned_time_minutes || 0,
      target_value: template.target_value || 0,
      target_unit: template.target_unit || '',
      notify: false,
      notify_times: defaultDates.map((date) => date.toISOString()),
      reminder_message: template.reminder_message || '',
    }));

    setActiveColor(template.color || 'purple');
    updateStep('step1');
  };

  // Custom habit chosen
  const handleSelectCustom = () => {
    updateDraft(() => DEFAULT_ONBOARDING_DRAFT);
    setActiveColor('purple');
    updateStep('step1');
  };

  // Final habit creation handler
  const finalizeHabitAndExit = async (assignedUserId?: string | null) => {
    setIsSavingHabit(true);
    try {
      let points = 15;
      try {
        points = await getBasePoints(
          draft.name,
          draft.completion_type === 'time' ? draft.planned_time_minutes : 0
        );
      } catch { }

      const formattedNotifyTime = draft.notify && draft.notify_times.length > 0
        ? JSON.stringify(draft.notify_times)
        : null;

      const formattedTimeOfDay = JSON.stringify(draft.times_of_day);

      const notificationIds = await refreshHabitNotifications(
        {
          name: draft.name,
          notify: draft.notify ? 1 : 0,
          notify_time: formattedNotifyTime,
          planned_time_minutes: draft.planned_time_minutes,
          target_days: JSON.stringify(draft.target_days),
          reminder_message: draft.reminder_message,
        },
        0
      );

      const newHabit = await createHabit({
        user_id: assignedUserId || null,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        color: draft.color,
        frequency: draft.frequency,
        planned_time_minutes: draft.completion_type === 'time' ? Number(draft.planned_time_minutes) : 0,
        interval: Number(draft.interval) || 1,
        target_days: JSON.stringify(draft.target_days),
        notify: draft.notify ? 1 : 0,
        notify_time: formattedNotifyTime,
        start_date: new Date().toISOString(),
        base_points: points,
        notification_ids: JSON.stringify(notificationIds),
        time_of_day: formattedTimeOfDay,
        icon: draft.icon,
        completion_type: draft.completion_type,
        target_value: draft.target_value ? Number(draft.target_value) : null,
        target_unit: draft.target_unit || null,
        reminder_message: draft.reminder_message.trim() || null,
      });

      queryClient.invalidateQueries({ queryKey: ['habits'] });
      await mutateCreateHabit('create_habit', newHabit);

      // Mark onboarding completed and route to Home screen!
      await completeOnboarding();
      resetColor();
      router.replace('/(tabs)/habits');
    } catch (error: any) {
      console.error('Error saving onboarding habit:', error);
      Alert.alert('Error saving habit', error.message || 'Please try again.');
    } finally {
      setIsSavingHabit(false);
    }
  };

  // Google sign in on ready screen
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Notice', error.message);
      } else {
        const currentUserId = user?.id || null;
        await finalizeHabitAndExit(currentUserId);
      }
    } catch (e: any) {
      Alert.alert('Sign In Error', e.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Guest continue on ready screen
  const handleContinueAsGuest = async () => {
    await signInAsGuest();
    await finalizeHabitAndExit(null);
  };

  if (!isRestored) {
    return (
      <View
        style={{ backgroundColor: Colors[currentTheme].background }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#4655E0" />
      </View>
    );
  }

  if (step === 'welcome') {
    return (
      <OnboardingWelcome
        onGetStarted={() => updateStep('choose')}
        onSignIn={handleWelcomeSignIn}
        isSigningIn={isSigningIn}
      />
    );
  }

  if (step === 'choose') {
    return (
      <OnboardingChoose
        onSelectTemplate={handleSelectTemplate}
        onSelectCustom={handleSelectCustom}
        onBack={() => updateStep('welcome')}
        accentColor={accentColor}
      />
    );
  }

  // FIRST HABIT READY (Save with Google or Continue as Guest directly)
  if (step === 'ready') {
    return (
      <OnboardingReady
        draft={draft}
        onGoogleSignIn={handleGoogleSignIn}
        onContinueAsGuest={handleContinueAsGuest}
        isSubmitting={isSigningIn || isSavingHabit}
        accentColor={accentColor}
      />
    );
  }

  // SCREEN 3: 4 or 5-STEP WIZARD (step1, step2, step3, step4, step5)
  const numericStep =
    step === 'step1'
      ? 1
      : step === 'step2'
      ? 2
      : step === 'step3'
      ? 3
      : step === 'step4'
      ? 4
      : step === 'step5'
      ? 5
      : 1;
  const totalSteps = draft.notify ? 5 : 4;
  const currentTitle = STEP_TITLES[numericStep];

  const handleNext = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    if (numericStep === 1 && !draft.name.trim()) return;
    if (numericStep === 1) updateStep('step2');
    else if (numericStep === 2) updateStep('step3');
    else if (numericStep === 3) updateStep('step4');
    else if (numericStep === 4 && draft.notify) updateStep('step5');
    else if (numericStep === 4 && !draft.notify) updateStep('ready');
    else if (numericStep === 5) updateStep('ready');
  };

  const handleBack = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    if (numericStep === 5) updateStep('step4');
    else if (numericStep === 4) updateStep('step3');
    else if (numericStep === 3) updateStep('step2');
    else if (numericStep === 2) updateStep('step1');
    else if (numericStep === 1) updateStep('choose');
  };

  const isNextDisabled = numericStep === 1 && !draft.name.trim();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <StepProgressHeader
          currentStep={numericStep}
          totalSteps={totalSteps}
          title={
            numericStep === 4 && !draft.notify
              ? 'Review your habit'
              : currentTitle?.title || 'Create habit'
          }
          subtitle={
            numericStep === 4 && !draft.notify
              ? 'Review details or enable reminders.'
              : currentTitle?.subtitle || ''
          }
          accentColor={accentColor}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* STEP 1: IDENTITY */}
          {numericStep === 1 && (
            <StepIdentity
              icon={draft.icon}
              onChangeIcon={(icon) => updateDraft((d) => ({ ...d, icon }))}
              name={draft.name}
              onChangeName={(name) => updateDraft((d) => ({ ...d, name }))}
              description={draft.description}
              onChangeDescription={(description) =>
                updateDraft((d) => ({ ...d, description }))
              }
              color={draft.color}
              onChangeColor={(color) => {
                updateDraft((d) => ({ ...d, color }));
                setActiveColor(color);
              }}
            />
          )}

          {/* STEP 2: SCHEDULE */}
          {numericStep === 2 && (
            <StepSchedule
              timesOfDay={draft.times_of_day}
              onChangeTimesOfDay={(times_of_day) => {
                const defaultDates = getDefaultReminderTimesForSessions(times_of_day);
                updateDraft((d) => ({
                  ...d,
                  times_of_day,
                  notify_times: defaultDates.map((date) => date.toISOString()),
                }));
              }}
              frequency={draft.frequency}
              onChangeFrequency={(frequency) =>
                updateDraft((d) => ({ ...d, frequency }))
              }
              targetDays={draft.target_days}
              onChangeTargetDays={(target_days) =>
                updateDraft((d) => ({ ...d, target_days }))
              }
              interval={draft.interval}
              onChangeInterval={(interval) =>
                updateDraft((d) => ({ ...d, interval }))
              }
              accentColor={accentColor}
            />
          )}

          {/* STEP 3: GOAL */}
          {numericStep === 3 && (
            <StepGoal
              completionType={draft.completion_type}
              onChangeCompletionType={(completion_type) =>
                updateDraft((d) => ({ ...d, completion_type }))
              }
              plannedMinutes={draft.planned_time_minutes}
              onChangePlannedMinutes={(planned_time_minutes) =>
                updateDraft((d) => ({ ...d, planned_time_minutes }))
              }
              targetValue={draft.target_value}
              onChangeTargetValue={(target_value) =>
                updateDraft((d) => ({ ...d, target_value }))
              }
              targetUnit={draft.target_unit}
              onChangeTargetUnit={(target_unit) =>
                updateDraft((d) => ({ ...d, target_unit }))
              }
              accentColor={accentColor}
            />
          )}

          {/* STEP 4: REMINDER (Shows inline summary when notify is false) */}
          {numericStep === 4 && (
            <StepReminder
              notify={draft.notify}
              onChangeNotify={(notify) => updateDraft((d) => ({ ...d, notify }))}
              notifyTimes={draft.notify_times.map((t) => new Date(t))}
              onChangeNotifyTimes={(dates) =>
                updateDraft((d) => ({
                  ...d,
                  notify_times: dates.map((date) => date.toISOString()),
                }))
              }
              reminderMessage={draft.reminder_message}
              onChangeReminderMessage={(reminder_message) =>
                updateDraft((d) => ({ ...d, reminder_message }))
              }
              name={draft.name}
              accentColor={accentColor}
              icon={draft.icon}
              description={draft.description}
              color={draft.color}
              timesOfDay={draft.times_of_day}
              frequency={draft.frequency}
              targetDays={draft.target_days}
              interval={draft.interval}
              completionType={draft.completion_type}
              plannedMinutes={draft.planned_time_minutes}
              targetValue={draft.target_value}
              targetUnit={draft.target_unit}
              onJumpToStep={(s) => updateStep(`step${s}` as OnboardingStep)}
            />
          )}

          {/* STEP 5: DEDICATED REVIEW SCREEN (Only when reminders are enabled) */}
          {numericStep === 5 && (
            <StepSummary
              icon={draft.icon}
              name={draft.name}
              description={draft.description}
              color={draft.color}
              timesOfDay={draft.times_of_day}
              frequency={draft.frequency}
              targetDays={draft.target_days}
              interval={draft.interval}
              completionType={draft.completion_type}
              plannedMinutes={draft.planned_time_minutes}
              targetValue={draft.target_value}
              targetUnit={draft.target_unit}
              notify={draft.notify}
              notifyTimes={draft.notify_times.map((t) => new Date(t))}
              reminderMessage={draft.reminder_message}
              accentColor={accentColor}
              onJumpToStep={(s) => updateStep(`step${s}` as OnboardingStep)}
            />
          )}
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-12 border-t border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#191A1D]">
          <Button
            variant="ghost"
            size="md"
            title={numericStep === 1 ? 'Cancel' : 'Back'}
            onPress={handleBack}
            className="px-3"
            textClassName="font-psemibold text-neutral-500 dark:text-neutral-400"
            leftIcon={
              numericStep > 1 ? (
                <ChevronIcon
                  direction="left"
                  size={16}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
              ) : undefined
            }
          />

          <Button
            variant="accent"
            size="md"
            accentColor={accentColor}
            title={
              numericStep < totalSteps
                ? numericStep === 4 && draft.notify
                  ? 'Review'
                  : 'Next'
                : 'Finish Setup'
            }
            onPress={handleNext}
            disabled={isNextDisabled}
            className="min-w-[120px] px-6"
            rightIcon={
              !isNextDisabled ? (
                <ChevronIcon
                  direction="right"
                  size={16}
                  color={getContrastTextColor(accentColor)}
                />
              ) : undefined
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
