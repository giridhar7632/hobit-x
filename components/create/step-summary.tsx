import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { HABIT_COLORS } from '@/constants/habit-colors';
import {
  BellDisabledIcon,
  BellIcon,
  ChevronIcon,
  ClockIcon,
  EditIcon,
  renderHabitIcon,
  SparklesIcon,
  SunIcon,
  TickIcon,
} from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatTimesOfDay } from '@/utils/notifications';

interface StepSummaryProps {
  icon: string;
  name: string;
  description?: string;
  color: string;
  timeOfDay?: string;
  timesOfDay?: string[];
  frequency: string;
  targetDays?: number[];
  interval?: number;
  completionType: string;
  plannedMinutes: number;
  targetValue: number;
  targetUnit: string;
  notify: boolean;
  notifyTimes?: Date[];
  notifyTime?: Date;
  reminderMessage: string;
  accentColor?: string;
  onJumpToStep: (step: number) => void;
}

export function StepSummary({
  icon,
  name,
  description,
  color,
  timeOfDay,
  timesOfDay,
  frequency,
  targetDays = [],
  interval = 1,
  completionType,
  plannedMinutes,
  targetValue,
  targetUnit,
  notify,
  notifyTimes,
  notifyTime,
  reminderMessage,
  accentColor = '#4655E0',
  onJumpToStep,
}: StepSummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const colorDef = HABIT_COLORS[color] || HABIT_COLORS.purple;

  // Format schedule text
  const frequencyLabel =
    frequency === 'daily'
      ? 'Every day'
      : frequency === 'weekly'
        ? `${targetDays.length || 5} days a week`
        : `Every ${interval || 1} days`;

  const timesOfDayLabel = formatTimesOfDay(timesOfDay || timeOfDay || 'anytime');

  // Format goal text
  const goalSummary =
    completionType === 'time'
      ? `${plannedMinutes || 20} minutes duration`
      : completionType === 'quantity'
        ? `${targetValue || 10} ${targetUnit || 'units'} target`
        : 'Daily check-off';

  // Format notify times
  const currentNotifyTimes: Date[] = React.useMemo(() => {
    if (notifyTimes && notifyTimes.length > 0) return notifyTimes;
    if (notifyTime) return [notifyTime];
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return [d];
  }, [notifyTimes, notifyTime]);

  const remindersSummary = !notify
    ? 'No reminders scheduled'
    : currentNotifyTimes.length === 1
      ? `Daily at ${currentNotifyTimes[0].toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : `${currentNotifyTimes.length} daily reminders (${currentNotifyTimes.map((t) => t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })).join(', ')})`;

  return (
    <View className="px-5 gap-3">
      {/* 1. HERO HABIT CARD */}
      <View
        className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1F2023] shadow-sm shadow-black/5"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              backgroundColor: isDark
                ? colorDef.pastelBgDark
                : colorDef.pastelBg,
              borderColor: `${accentColor}30`,
            }}
            className="w-[52px] h-[52px] rounded-2xl border items-center justify-center"
          >
            {renderHabitIcon(icon, '#1C1C1E', 32)}
          </View>

          <View className="flex-1 gap-0.5">
            <Text
              style={{ color: textColor }}
              className="font-pbold text-base tracking-tight"
              numberOfLines={2}
            >
              {name || 'Untitled Habit'}
            </Text>
            {description ? (
              <Text
                className="font-pregular text-xs text-neutral-400 dark:text-neutral-500"
                numberOfLines={2}
              >
                {description}
              </Text>
            ) : (
              <Text style={{ color: accentColor }} className="font-psemibold text-xs">
                {colorDef.name || 'Custom Ritual'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              onJumpToStep(1);
            }}
            style={{
              backgroundColor: isDark
                ? `${accentColor}18`
                : `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border"
          >
            <EditIcon size={12} color={accentColor} />
            <Text style={{ color: accentColor }} className="font-pbold text-xs">Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DETAILED BREAKDOWN ITEMS */}
      <View className="gap-2">
        {/* Schedule Row */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onJumpToStep(2);
          }}
          className="flex-row items-center px-3.5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1F2023] gap-3"
        >
          <View
            style={{
              backgroundColor: isDark
                ? `${accentColor}18`
                : `${accentColor}10`,
            }}
            className="w-9 h-9 rounded-xl items-center justify-center"
          >
            <SunIcon size={18} color={accentColor} />
          </View>

          <View className="flex-1 gap-0.5">
            <Text className="font-pbold text-[10px] tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              SCHEDULE
            </Text>
            <Text style={{ color: textColor }} className="font-psemibold text-sm">
              {timesOfDayLabel} · {frequencyLabel}
            </Text>
          </View>

          <ChevronIcon direction="right" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        {/* Goal / Target Row */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onJumpToStep(3);
          }}
          className="flex-row items-center px-3.5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1F2023] gap-3"
        >
          <View
            style={{
              backgroundColor: isDark
                ? `${accentColor}18`
                : `${accentColor}10`,
            }}
            className="w-9 h-9 rounded-xl items-center justify-center"
          >
            {completionType === 'time' ? (
              <ClockIcon size={18} color={accentColor} />
            ) : completionType === 'quantity' ? (
              <SparklesIcon size={18} color={accentColor} />
            ) : (
              <TickIcon size={18} color={accentColor} />
            )}
          </View>

          <View className="flex-1 gap-0.5">
            <Text className="font-pbold text-[10px] tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              DAILY TARGET
            </Text>
            <Text style={{ color: textColor }} className="font-psemibold text-sm">
              {goalSummary}
            </Text>
          </View>

          <ChevronIcon direction="right" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        {/* Reminder Row */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onJumpToStep(4);
          }}
          className="flex-row items-center px-3.5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1F2023] gap-3"
        >
          <View
            style={{
              backgroundColor: notify
                ? isDark
                  ? `${accentColor}18`
                  : `${accentColor}10`
                : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
            }}
            className="w-9 h-9 rounded-xl items-center justify-center"
          >
            {notify ? (
              <BellIcon size={18} color={accentColor} />
            ) : (
              <BellDisabledIcon size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            )}
          </View>

          <View className="flex-1 gap-0.5">
            <Text className="font-pbold text-[10px] tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              REMINDERS
            </Text>
            <Text style={{ color: textColor }} className="font-psemibold text-sm">
              {remindersSummary}
            </Text>
            {notify && (
              <Text
                style={{
                  color: reminderMessage.trim() ? (isDark ? '#9CA3AF' : '#6B7280') : accentColor,
                  fontStyle: reminderMessage.trim() ? 'normal' : 'italic',
                }}
                className="font-pregular text-xs mt-0.5"
                numberOfLines={1}
              >
                {reminderMessage.trim()
                  ? `"${reminderMessage.trim()}"`
                  : 'Dynamic encouragement active'}
              </Text>
            )}
          </View>

          <ChevronIcon direction="right" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* 3. ENCOURAGING FOOTER NOTE */}
      <View
        className="flex-row items-center px-3.5 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] gap-2 bg-black/[0.02] dark:bg-white/[0.03]"
      >
        <SparklesIcon size={16} color={accentColor} />
        <Text className="font-pmedium text-xs flex-1 text-neutral-400 dark:text-neutral-500">
          Small, repeated actions shape lasting transformation.
        </Text>
      </View>
    </View>
  );
}
