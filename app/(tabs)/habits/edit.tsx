import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMeridianMutation, useQuery, useQueryClient } from 'meridian-lite';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepGoal } from '@/components/create/step-goal';
import { StepIdentity } from '@/components/create/step-identity';
import { StepProgressHeader } from '@/components/create/step-progress-header';
import { StepReminder } from '@/components/create/step-reminder';
import { StepSchedule } from '@/components/create/step-schedule';
import { StepSummary } from '@/components/create/step-summary';
import Button from '@/components/ui/button';
import { getContrastTextColor, HABIT_COLORS } from '@/constants/habit-colors';
import { ChevronIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getHabitById, updateHabit } from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import {
  getDefaultReminderTimesForSessions,
  parseNotifyTimes,
  parseTimesOfDay,
  refreshHabitNotifications,
  TimeOfDay,
} from '@/utils/notifications';
import { getBasePoints } from '@/utils/points';
import { Habit } from '@/utils/types';

type WizardStage = 1 | 2 | 3 | 4 | 5;

interface HabitDraft {
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
  notify_times: Date[];
  reminder_message: string;
}

const DEFAULT_DRAFT: HabitDraft = {
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
  notify_times: getDefaultReminderTimesForSessions(['anytime']),
  reminder_message: '',
};

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Edit your habit',
    subtitle: 'Update the basics.',
  },
  2: {
    title: 'When does it happen?',
    subtitle: 'Choose when this habit fits into your routine.',
  },
  3: {
    title: 'What does success look like?',
    subtitle: 'Choose how you want to track this habit.',
  },
  4: {
    title: 'Want a reminder?',
    subtitle: 'A little nudge can help you stay consistent.',
  },
  5: {
    title: 'Review your habit',
    subtitle: 'Confirm your changes before saving.',
  },
};

export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const habitId = id?.toString() ?? '';

  const [stage, setStage] = useState<WizardStage>(1);
  const [draft, setDraft] = useState<HabitDraft>(DEFAULT_DRAFT);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';
  const { setActiveColor, resetColor } = useAppTheme();

  // Reset theme color on unmount
  useEffect(() => {
    return () => {
      resetColor();
    };
  }, [resetColor]);

  const habitKey = useMemo(() => ['habit', habitId], [habitId]);

  const { data: habit, isLoading } = useQuery<Habit | null>({
    queryKey: habitKey,
    queryFn: async () => {
      const h = await getHabitById(habitId);
      if (!h) throw new Error('Habit not found');
      return h;
    },
  });

  // Pre-fill draft from habit data
  useEffect(() => {
    if (habit && !isInitialized) {
      let parsedTargetDays: number[] = [1, 2, 3, 4, 5];
      if (habit.target_days) {
        try {
          const days =
            typeof habit.target_days === 'string'
              ? JSON.parse(habit.target_days)
              : habit.target_days;
          if (Array.isArray(days)) {
            parsedTargetDays = days;
          }
        } catch {
          // Keep defaults
        }
      }

      let parsedNotifyTimes: Date[] = [];
      if (habit.notify_time) {
        const parsed = parseNotifyTimes(habit.notify_time);
        parsedNotifyTimes = parsed
          .map((t) => new Date(t))
          .filter((d) => !isNaN(d.getTime()));
      }
      if (parsedNotifyTimes.length === 0) {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        parsedNotifyTimes = [d];
      }

      const validFrequency: 'daily' | 'weekly' | 'interval' =
        habit.frequency === 'weekly' || habit.frequency === 'interval'
          ? habit.frequency
          : 'daily';

      setDraft({
        icon: habit.icon || 'SproutIcon',
        name: habit.name || '',
        description: habit.description || '',
        color: habit.color || 'purple',
        times_of_day: parseTimesOfDay(habit.time_of_day),
        frequency: validFrequency,
        target_days: parsedTargetDays,
        interval: habit.interval || 1,
        completion_type:
          (habit.completion_type as any) || (habit.planned_time_minutes ? 'time' : 'check'),
        planned_time_minutes: habit.planned_time_minutes || 0,
        target_value: (habit.target_value as number) || 0,
        target_unit: habit.target_unit || '',
        notify: habit.notify === 1,
        notify_times: parsedNotifyTimes,
        reminder_message: habit.reminder_message || '',
      });

      if (habit.color) {
        setActiveColor(habit.color);
      }
      setIsInitialized(true);
    }
  }, [habit, isInitialized, setActiveColor]);

  const selectedColorDef = HABIT_COLORS[draft.color] || HABIT_COLORS.purple;
  const accentColor = selectedColorDef.accent;

  const queryClient = useQueryClient();
  const { mutate: mutateOutbox } = useMeridianMutation({
    invalidateKeys: [
      ['habits'],
      ['habit', habitId],
      ['habit_entries', habitId],
      ['habit-dates', habitId],
    ],
  });

  const totalSteps = draft.notify ? 5 : 4;

  const handleNext = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    if (stage === 1 && !draft.name.trim()) return;
    if (stage === 1) setStage(2);
    else if (stage === 2) setStage(3);
    else if (stage === 3) setStage(4);
    else if (stage === 4 && draft.notify) setStage(5);
  };

  const handleBack = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    if (stage === 5) setStage(4);
    else if (stage === 4) setStage(3);
    else if (stage === 3) setStage(2);
    else if (stage === 2) setStage(1);
    else if (stage === 1) {
      resetColor();
      router.back();
    }
  };

  const handleSaveHabit = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Missing Name', 'Please give your habit a name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const points = getBasePoints(
        draft.name,
        draft.completion_type === 'time' ? Number(draft.planned_time_minutes) : 0
      );

      const formattedNotifyTime = draft.notify
        ? JSON.stringify(draft.notify_times.map((d) => d.toISOString()))
        : null;

      const formattedTimeOfDay = JSON.stringify(draft.times_of_day);

      const todayISO = new Date().toISOString().split('T')[0];
      const isDone = habit?.last_completed_date?.startsWith(todayISO) ?? false;

      const notificationIds = await refreshHabitNotifications(
        {
          ...habit,
          name: draft.name,
          notify: draft.notify ? 1 : 0,
          notify_time: formattedNotifyTime,
          planned_time_minutes: draft.planned_time_minutes,
          target_days: JSON.stringify(draft.target_days),
          reminder_message: draft.reminder_message,
        },
        (habit as any)?.today_tracked_minutes || 0,
        isDone
      );

      const updatedHabitData = {
        id: habitId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        color: draft.color,
        frequency: draft.frequency,
        planned_time_minutes:
          draft.completion_type === 'time' ? Number(draft.planned_time_minutes) : 0,
        interval: Number(draft.interval) || 1,
        target_days: JSON.stringify(draft.target_days),
        notify: draft.notify ? 1 : 0,
        notify_time: formattedNotifyTime,
        base_points: points,
        notification_ids: JSON.stringify(notificationIds),
        time_of_day: formattedTimeOfDay,
        icon: draft.icon,
        sort_order: habit?.sort_order ?? 0,
        completion_type: draft.completion_type,
        target_value: draft.target_value ? Number(draft.target_value) : null,
        target_unit: draft.target_unit || null,
        reminder_message: draft.reminder_message.trim() || null,
      };

      // 1. Update SQLite locally
      await updateHabit(updatedHabitData);

      // 2. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit_entries', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit-dates', habitId] });

      // 3. Enqueue to Meridian Lite outbox
      await mutateOutbox('update_habit', updatedHabitData);

      router.back();
    } catch (error: any) {
      console.error('Error updating habit:', error);
      Alert.alert('Error updating habit', error.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insets = useSafeAreaInsets();
  const bgColor = Colors[currentTheme].background;
  const isNextDisabled = stage === 1 && !draft.name.trim();

  if (isLoading || !habit) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={{
          backgroundColor: bgColor,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors[currentTheme].tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{ backgroundColor: bgColor, flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Progress & Heading */}
            <StepProgressHeader
              currentStep={stage}
              totalSteps={totalSteps}
              title={
                stage === 4 && !draft.notify
                  ? 'Review your habit'
                  : STEP_TITLES[stage]?.title || 'Edit habit'
              }
              subtitle={
                stage === 4 && !draft.notify
                  ? 'Review details or enable reminders.'
                  : STEP_TITLES[stage]?.subtitle || ''
              }
              accentColor={accentColor}
            />

            {/* STEP 1: IDENTITY */}
            {stage === 1 && (
              <StepIdentity
                icon={draft.icon}
                onChangeIcon={(icon) => setDraft((d) => ({ ...d, icon }))}
                name={draft.name}
                onChangeName={(name) => setDraft((d) => ({ ...d, name }))}
                description={draft.description}
                onChangeDescription={(description) =>
                  setDraft((d) => ({ ...d, description }))
                }
                color={draft.color}
                onChangeColor={(color) => {
                  setDraft((d) => ({ ...d, color }));
                  setActiveColor(color);
                }}
              />
            )}

            {/* STEP 2: SCHEDULE */}
            {stage === 2 && (
              <StepSchedule
                timesOfDay={draft.times_of_day}
                onChangeTimesOfDay={(times_of_day) => {
                  const defaultDates = getDefaultReminderTimesForSessions(times_of_day);
                  setDraft((d) => ({
                    ...d,
                    times_of_day,
                    notify_times: defaultDates,
                  }));
                }}
                frequency={draft.frequency}
                onChangeFrequency={(frequency) =>
                  setDraft((d) => ({ ...d, frequency }))
                }
                targetDays={draft.target_days}
                onChangeTargetDays={(target_days) =>
                  setDraft((d) => ({ ...d, target_days }))
                }
                interval={draft.interval}
                onChangeInterval={(interval) =>
                  setDraft((d) => ({ ...d, interval }))
                }
                accentColor={accentColor}
              />
            )}

            {/* STEP 3: GOAL */}
            {stage === 3 && (
              <StepGoal
                completionType={draft.completion_type}
                onChangeCompletionType={(completion_type) =>
                  setDraft((d) => ({ ...d, completion_type }))
                }
                plannedMinutes={draft.planned_time_minutes}
                onChangePlannedMinutes={(planned_time_minutes) =>
                  setDraft((d) => ({ ...d, planned_time_minutes }))
                }
                targetValue={draft.target_value}
                onChangeTargetValue={(target_value) =>
                  setDraft((d) => ({ ...d, target_value }))
                }
                targetUnit={draft.target_unit}
                onChangeTargetUnit={(target_unit) =>
                  setDraft((d) => ({ ...d, target_unit }))
                }
                accentColor={accentColor}
              />
            )}

            {/* STEP 4: REMINDER (Shows inline summary when notify is false) */}
            {stage === 4 && (
              <StepReminder
                notify={draft.notify}
                onChangeNotify={(notify) => setDraft((d) => ({ ...d, notify }))}
                notifyTimes={draft.notify_times}
                onChangeNotifyTimes={(notify_times) =>
                  setDraft((d) => ({ ...d, notify_times }))
                }
                reminderMessage={draft.reminder_message}
                onChangeReminderMessage={(reminder_message) =>
                  setDraft((d) => ({ ...d, reminder_message }))
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
                onJumpToStep={(s) => setStage(s as WizardStage)}
              />
            )}

            {/* STEP 5: DEDICATED REVIEW SCREEN (When reminders are enabled) */}
            {stage === 5 && (
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
                notifyTimes={draft.notify_times}
                reminderMessage={draft.reminder_message}
                accentColor={accentColor}
                onJumpToStep={(s) => setStage(s as WizardStage)}
              />
            )}
          </ScrollView>

          {/* Bottom Action Navigation Bar */}
          <View
            style={{
              paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
              backgroundColor: isDark ? '#191A1D' : '#FFFFFF',
              borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderTopWidth: 1,
            }}
            className="flex-row items-center justify-between px-5 pt-3.5 shadow-md shadow-black/5"
          >
            {/* Back / Cancel */}
            <Button
              title={stage === 1 ? 'Cancel' : 'Back'}
              variant="ghost"
              size="md"
              onPress={handleBack}
              leftIcon={
                stage > 1 ? (
                  <ChevronIcon
                    direction="left"
                    size={16}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                ) : undefined
              }
            />

            {stage < totalSteps ? (
              <Button
                title={stage === 4 && draft.notify ? 'Review' : 'Next'}
                variant="accent"
                accentColor={accentColor}
                size="md"
                disabled={isNextDisabled}
                onPress={handleNext}
                rightIcon={
                  <ChevronIcon
                    direction="right"
                    size={16}
                    color={getContrastTextColor(accentColor)}
                  />
                }
                className="min-w-[120px]"
              />
            ) : (
              <Button
                title="Save Habit"
                variant="accent"
                accentColor={accentColor}
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSaveHabit}
                rightIcon={
                  !isSubmitting ? (
                    <ChevronIcon
                      direction="right"
                      size={16}
                      color={getContrastTextColor(accentColor)}
                    />
                  ) : undefined
                }
                className="min-w-[150px]"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
