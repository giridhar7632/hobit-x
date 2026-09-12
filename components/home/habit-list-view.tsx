import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CompletionIndicator } from '@/components/home/completion-indicator';
import { getHabitColor } from '@/constants/habit-colors';
import {
  ClockIcon,
  FlameIcon,
  MoonIcon,
  renderHabitIcon,
  SparklesIcon,
  SunIcon,
  SunsetIcon,
  TimerIcon,
} from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getHabitTotalReminders, parseTimesOfDay, TimeOfDay } from '@/utils/notifications';
import { Habit } from '@/utils/types';

interface HabitListViewProps {
  habits: Habit[];
  onPressHabit: (habit: Habit) => void;
  onTrackHabit: (habit: Habit) => void;
  onUntrackHabit: (habit: Habit) => void;
  onTimerPress: (habit: Habit) => void;
  isFullyCompleted: (habit: Habit) => boolean;
}

const SECTIONS: { key: TimeOfDay; label: string; icon: (props: any) => React.ReactElement }[] = [
  { key: 'morning', label: 'MORNING', icon: SunIcon },
  { key: 'afternoon', label: 'AFTERNOON', icon: SunsetIcon },
  { key: 'evening', label: 'EVENING', icon: MoonIcon },
  { key: 'anytime', label: 'ANYTIME', icon: SparklesIcon },
];

export function HabitListView({
  habits,
  onPressHabit,
  onTrackHabit,
  onUntrackHabit,
  onTimerPress,
  isFullyCompleted,
}: HabitListViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Group habits by time_of_day (a habit can appear in multiple sections, e.g. morning & evening)
  const grouped = React.useMemo(() => {
    const map: Record<TimeOfDay, Habit[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };

    for (const habit of habits) {
      const tods = parseTimesOfDay(habit.time_of_day);
      for (const tod of tods) {
        if (map[tod]) {
          map[tod].push(habit);
        } else {
          map.anytime.push(habit);
        }
      }
    }

    return map;
  }, [habits]);

  return (
    <View className="px-5">
      {SECTIONS.map((section) => {
        const sectionHabits = grouped[section.key];
        if (!sectionHabits || sectionHabits.length === 0) return null;

        const SectionIcon = section.icon;

        return (
          <View key={section.key} className="mb-6">
            <View className="flex-row items-center gap-1.5 mb-2.5 px-1">
              <SectionIcon
                size={14}
                color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'}
              />
              <Text className="font-pbold text-[11px] tracking-wider text-neutral-500 dark:text-neutral-400">
                {section.label}
              </Text>
              <Text className="font-pmedium text-[11px] text-neutral-400 dark:text-neutral-600">
                · {sectionHabits.length}
              </Text>
            </View>

            <View className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1C1D20] shadow-sm shadow-black/5 overflow-visible">
              {sectionHabits.map((habit, idx) => {
                const colorDef = getHabitColor(habit.color);
                const completed = isFullyCompleted(habit);
                const totalReminders = getHabitTotalReminders(habit);
                const completedCount = habit.today_completed_count || 0;

                return (
                  <TouchableOpacity
                    key={`${section.key}-${habit.id}`}
                    activeOpacity={0.7}
                    onPress={() => onPressHabit(habit)}
                    className={`flex-row items-center py-3.5 px-4 gap-3.5 overflow-visible ${
                      idx === 0 ? 'rounded-t-[20px]' : ''
                    } ${idx === sectionHabits.length - 1 ? 'rounded-b-[20px]' : 'border-b border-black/[0.05] dark:border-white/[0.06]'}`}
                    style={completed ? { opacity: 0.65 } : undefined}
                  >
                    <View
                      style={{
                        backgroundColor: isDark
                          ? colorDef.pastelBgDark
                          : colorDef.pastelBg,
                      }}
                      className="w-[38px] h-[38px] rounded-xl items-center justify-center"
                    >
                      {renderHabitIcon(habit.icon, '#1C1C1E', 18)}
                    </View>

                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`font-psemibold text-[15px] tracking-tight ${
                          completed ? 'line-through opacity-70' : ''
                        } text-neutral-900 dark:text-neutral-100`}
                      >
                        {habit.name}
                      </Text>

                      <View className="flex-row items-center gap-2.5 mt-0.5">
                        {habit.planned_time_minutes ? (
                          <View className="flex-row items-center gap-1">
                            <ClockIcon size={11} color={colorDef.accent} />
                            <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                              {habit.planned_time_minutes}m
                            </Text>
                          </View>
                        ) : null}

                        {habit.current_streak > 0 ? (
                          <View className="flex-row items-center gap-1">
                            <FlameIcon size={11} color={colorDef.accent} />
                            <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                              {habit.current_streak}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 overflow-visible z-[9999]">
                      {habit.planned_time_minutes && !completed ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => onTimerPress(habit)}
                          className="w-[34px] h-[34px] rounded-xl items-center justify-center bg-black/[0.04] dark:bg-white/[0.06]"
                        >
                          <TimerIcon size={16} color={colorDef.accent} />
                        </TouchableOpacity>
                      ) : null}

                      <CompletionIndicator
                        isCompleted={completed}
                        completedCount={completedCount}
                        totalCount={totalReminders}
                        accentColor={colorDef.accent}
                        size={36}
                        onTrack={() => onTrackHabit(habit)}
                        onUntrack={() => onUntrackHabit(habit)}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
