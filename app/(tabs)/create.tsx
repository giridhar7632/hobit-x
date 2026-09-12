import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMeridianMutation, useQueryClient } from 'meridian-lite';
import React, { useEffect, useState } from 'react';
import {
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
import { TemplatePickerScreen } from '@/components/create/template-picker-screen';
import Button from '@/components/ui/button';
import { getContrastTextColor, HABIT_COLORS } from '@/constants/habit-colors';
import { HabitTemplate } from '@/constants/habit-templates';
import { ChevronIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createHabit } from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import {
  getDefaultReminderTimesForSessions,
  parseTimesOfDay,
  refreshHabitNotifications,
  TimeOfDay,
} from '@/utils/notifications';
import { getBasePoints } from '@/utils/points';

type WizardStage = 'templates' | 1 | 2 | 3 | 4 | 5;

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
  icon: 'SparklesIcon',
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
    title: 'Create your habit',
    subtitle: 'Start with the basics.',
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
    subtitle: 'Confirm your ritual before you begin.',
  },
};

export default function CreateScreen() {
  const [stage, setStage] = useState<WizardStage>('templates');
  const [draft, setDraft] = useState<HabitDraft>(DEFAULT_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();
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

  const selectedColorDef = HABIT_COLORS[draft.color] || HABIT_COLORS.purple;
  const accentColor = selectedColorDef.accent;

  // Handle template selection
  const handleSelectTemplate = (template: HabitTemplate) => {
    const timesOfDay = parseTimesOfDay(template.time_of_day);
    const defaultDates = getDefaultReminderTimesForSessions(timesOfDay);

    setDraft({
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
      notify_times: defaultDates,
      reminder_message: template.reminder_message || '',
    });

    if (template.color) {
      setActiveColor(template.color);
    }

    setStage(1);
  };

  // Handle custom habit selection
  const handleSelectCustom = () => {
    setDraft(DEFAULT_DRAFT);
    resetColor();
    setStage(1);
  };

  const queryClient = useQueryClient();
  const { mutate: mutateCreateHabit } = useMeridianMutation({
    invalidateKeys: [['habits']],
  });

  // Final submission
  const handleCreateHabit = async () => {
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

      const formattedNotifyTime = JSON.stringify(
        draft.notify_times.map((d) => d.toISOString())
      );

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

      // Reset and route to habit details
      setDraft(DEFAULT_DRAFT);
      setStage('templates');
      router.push(`/(tabs)/habits/${newHabit.id}`);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert('Error creating habit', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = draft.notify ? 5 : 4;

  const handleNext = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    const current = typeof stage === 'number' ? stage : 1;
    if (current === 1 && !draft.name.trim()) return;
    if (current === 1) setStage(2);
    else if (current === 2) setStage(3);
    else if (current === 3) setStage(4);
    else if (current === 4 && draft.notify) setStage(5);
  };

  const handleBack = () => {
    Keyboard.dismiss();
    Haptics.selectionAsync();
    const current = typeof stage === 'number' ? stage : 1;
    if (current === 5) setStage(4);
    else if (current === 4) setStage(3);
    else if (current === 3) setStage(2);
    else if (current === 2) setStage(1);
    else if (current === 1) {
      resetColor();
      setStage('templates');
    }
  };

  const bgColor = Colors[currentTheme].background;

  const isNextDisabled = stage === 1 && !draft.name.trim();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: bgColor }} className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {stage === 'templates' ? (
          <TemplatePickerScreen
            onSelectTemplate={handleSelectTemplate}
            onSelectCustom={handleSelectCustom}
            onBack={() => router.replace('/(tabs)/habits')}
            accentColor={accentColor}
          />
        ) : (
          <View className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              <StepProgressHeader
                currentStep={typeof stage === 'number' ? stage : 1}
                totalSteps={totalSteps}
                title={
                  stage === 4 && !draft.notify
                    ? 'Review your habit'
                    : STEP_TITLES[stage]?.title || 'Create habit'
                }
                subtitle={
                  stage === 4 && !draft.notify
                    ? 'Review details or enable reminders.'
                    : STEP_TITLES[stage]?.subtitle || ''
                }
                accentColor={accentColor}
              />

              {stage === 1 && (
                <StepIdentity
                  icon={draft.icon}
                  onChangeIcon={(icon, color) => {
                    setDraft((d) => ({ ...d, icon, ...(color ? { color } : {}) }));
                    if (color) {
                      setActiveColor(color);
                    }
                  }}
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

            <View
              style={{
                paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16,
                backgroundColor: isDark ? '#191A1D' : '#FFFFFF',
                borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderTopWidth: 1,
              }}
              className="flex-row items-center justify-between px-5 pt-3.5 shadow-md shadow-black/5"
            >
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
                  title="Create Habit"
                  variant="accent"
                  accentColor={accentColor}
                  size="md"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleCreateHabit}
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}