import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CompletionIndicator } from '@/components/home/completion-indicator';
import { useTimer } from '@/context/timer-context';
import { getHabitColor, getReadableAccentColor } from '@/constants/habit-colors';
import {
  ClockIcon,
  FlameIcon,
  MoonIcon,
  renderHabitIcon,
  SparklesIcon,
  SunIcon,
  SunsetIcon,
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

/** Animated "breathing" dot shown while a timer is running */
function ActiveDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 1.1 ? 0.6 : 1,
  }));

  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, style]} />
  );
}

function formatActiveMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

/** The inline timer row shown below a habit name when timer is active */
function InlineTimerRow({ habit, colorDef }: { habit: Habit; colorDef: any }) {
  const { secondsElapsed, isRunning, pauseTimer, resumeTimer, cancelTimer } = useTimer();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const color = getReadableAccentColor(habit.color, isDark);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(250).easing(Easing.inOut(Easing.ease))}
      className="flex-row items-center gap-2 mt-1.5"
    >
      {isRunning ? <ActiveDot color={color} /> : (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: 0.4 }} />
      )}

      <Text className="font-psemibold text-xs" style={{ color }}>
        Active · {formatActiveMinutes(secondsElapsed)}
      </Text>

      {/* Pause / Resume */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={isRunning ? pauseTimer : resumeTimer}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          backgroundColor: isDark ? `${color}25` : `${color}15`,
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text className="font-psemibold text-[11px]" style={{ color }}>
          {isRunning ? 'Pause' : 'Resume'}
        </Text>
      </TouchableOpacity>

      {/* Stop */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={cancelTimer}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text className="font-psemibold text-[11px]" style={{ color: '#ef4444' }}>
          Stop
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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
  const { habit: activeHabit, startTimer } = useTimer();

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
                const readableAccent = getReadableAccentColor(habit.color, isDark);
                const completed = isFullyCompleted(habit);
                const totalReminders = getHabitTotalReminders(habit);
                const completedCount = habit.today_completed_count || 0;
                const isThisActive = activeHabit?.id === habit.id;

                return (
                  <Animated.View
                    key={`${section.key}-${habit.id}`}
                    layout={LinearTransition.duration(300).easing(Easing.inOut(Easing.ease))}
                    className={`overflow-visible ${
                      idx === 0 ? 'rounded-t-[20px]' : ''
                    } ${idx === sectionHabits.length - 1 ? 'rounded-b-[20px]' : 'border-b border-black/[0.05] dark:border-white/[0.06]'}`}
                    style={isThisActive ? {
                      backgroundColor: isDark
                        ? `${colorDef.accent}12`
                        : `${colorDef.accent}08`,
                    } : undefined}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onPressHabit(habit)}
                      className={`flex-row items-center py-3.5 px-4 gap-3.5 overflow-visible`}
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

                        {isThisActive ? (
                          <InlineTimerRow habit={habit} colorDef={colorDef} />
                        ) : (
                          <View className="flex-row items-center gap-2.5 mt-0.5">
                            {habit.planned_time_minutes ? (
                              <View className="flex-row items-center gap-1">
                                <ClockIcon size={11} color={readableAccent} />
                                <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                                  {habit.planned_time_minutes}m
                                </Text>
                              </View>
                            ) : null}

                            {habit.current_streak > 0 ? (
                              <View className="flex-row items-center gap-1">
                                <FlameIcon size={11} color={readableAccent} />
                                <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                                  {habit.current_streak}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center gap-2 overflow-visible z-[9999]">
                        {/* Timer start button — only when no active timer for this habit and not completed */}
                        {habit.planned_time_minutes && !completed && !isThisActive && !activeHabit ? (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              startTimer(habit);
                            }}
                            className="h-[34px] px-3 rounded-xl items-center justify-center bg-black/[0.04] dark:bg-white/[0.06]"
                          >
                            <Text
                              className="font-psemibold text-[12px]"
                              style={{ color: readableAccent }}
                            >
                              Start
                            </Text>
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
                  </Animated.View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
