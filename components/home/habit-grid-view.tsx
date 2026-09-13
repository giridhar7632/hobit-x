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
import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import { ClockIcon, FlameIcon, PauseIcon, PlayIcon, renderHabitIcon, StopIcon } from '@/constants/icons';
import { getHabitTotalReminders } from '@/utils/notifications';
import { Habit } from '@/utils/types';

interface HabitGridViewProps {
  habits: Habit[];
  onPressHabit: (habit: Habit) => void;
  onTrackHabit: (habit: Habit) => void;
  onUntrackHabit: (habit: Habit) => void;
  onTimerPress: (habit: Habit) => void;
  isFullyCompleted: (habit: Habit) => boolean;
}

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
  }));

  return (
    <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, style]} />
  );
}

function formatActiveMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export function HabitGridView({
  habits,
  onPressHabit,
  onTrackHabit,
  onUntrackHabit,
  onTimerPress,
  isFullyCompleted,
}: HabitGridViewProps) {
  const { habit: activeHabit, secondsElapsed, isRunning, startTimer, pauseTimer, resumeTimer, cancelTimer } = useTimer();

  const sortedHabits = React.useMemo(() => {
    if (!activeHabit) return habits;
    return [...habits].sort((a, b) => {
      if (a.id === activeHabit.id) return -1;
      if (b.id === activeHabit.id) return 1;
      return 0;
    });
  }, [habits, activeHabit]);

  return (
    <View className="flex-row flex-wrap px-4 gap-3">
      {sortedHabits.map((habit) => {
        const colorDef = getHabitColor(habit.color);
        const completed = isFullyCompleted(habit);
        const totalReminders = getHabitTotalReminders(habit);
        const completedCount = habit.today_completed_count || 0;
        const isThisActive = activeHabit?.id === habit.id;

        const cardBg = colorDef.hex;
        const contrastColor = getContrastTextColor(colorDef.hex);
        const isWhiteText = contrastColor === '#FFFFFF';

        const subtextColor = isWhiteText ? 'rgba(255, 255, 255, 0.75)' : 'rgba(28, 28, 30, 0.7)';
        const tileBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const badgeBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const timerBg = isWhiteText ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.12)';
        const cardBorder = isWhiteText ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';

        return (
          <TouchableOpacity
            key={habit.id}
            activeOpacity={0.8}
            onPress={() => onPressHabit(habit)}
            style={[
              {
                width: '48%',
                backgroundColor: cardBg,
                borderColor: isThisActive ? contrastColor : cardBorder,
                borderWidth: isThisActive ? 1.5 : 1,
              },
              completed && { opacity: 0.65 },
            ]}
            className="rounded-[22px] border p-3.5 min-h-[146px] justify-between shadow-sm shadow-black/5"
          >
            <View className="flex-row items-center justify-between">
              <View
                style={{ backgroundColor: tileBg }}
                className="w-9 h-9 rounded-xl items-center justify-center"
              >
                {renderHabitIcon(habit.icon, contrastColor, 20)}
              </View>

              <CompletionIndicator
                isCompleted={completed}
                completedCount={completedCount}
                totalCount={totalReminders}
                accentColor={contrastColor}
                size={34}
                onTrack={() => onTrackHabit(habit)}
                onUntrack={() => onUntrackHabit(habit)}
              />
            </View>

            <View className="my-2.5">
              <Text
                numberOfLines={2}
                style={[
                  {
                    color: contrastColor,
                    textDecorationLine: completed ? 'line-through' : 'none',
                  },
                ]}
                className="font-pbold text-[15px] tracking-tight leading-5"
              >
                {habit.name}
              </Text>

              {/* Active timer indicator */}
              {isThisActive ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  className="flex-row items-center gap-1.5 mt-1"
                >
                  {isRunning
                    ? <ActiveDot color={contrastColor} />
                    : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: contrastColor, opacity: 0.4 }} />
                  }
                  <Text className="font-psemibold text-[11px]" style={{ color: contrastColor }}>
                    {formatActiveMinutes(secondsElapsed)}
                  </Text>
                </Animated.View>
              ) : (
                habit.description ? (
                  <Text
                    numberOfLines={1}
                    style={{ color: subtextColor }}
                    className="font-pregular text-[11px] mt-0.5"
                  >
                    {habit.description}
                  </Text>
                ) : null
              )}
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {habit.planned_time_minutes ? (
                  <View
                    style={{ backgroundColor: badgeBg }}
                    className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg"
                  >
                    <ClockIcon size={11} color={contrastColor} />
                    <Text
                      style={{ color: contrastColor }}
                      className="font-psemibold text-[11px]"
                    >
                      {habit.planned_time_minutes}m
                    </Text>
                  </View>
                ) : null}

                {habit.current_streak > 0 ? (
                  <View
                    style={{ backgroundColor: badgeBg }}
                    className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg"
                  >
                    <FlameIcon size={11} color={contrastColor} />
                    <Text
                      style={{ color: contrastColor }}
                      className="font-psemibold text-[11px]"
                    >
                      {habit.current_streak}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Timer controls */}
              {habit.planned_time_minutes && !completed ? (
                isThisActive ? (
                  <View className="flex-row items-center gap-1.5">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        isRunning ? pauseTimer() : resumeTimer();
                      }}
                      style={{ backgroundColor: timerBg }}
                      className="w-7 h-7 rounded-lg items-center justify-center"
                    >
                      {isRunning ? (
                        <PauseIcon size={12} color={contrastColor} />
                      ) : (
                        <PlayIcon size={12} color={contrastColor} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        cancelTimer();
                      }}
                      style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                      className="w-7 h-7 rounded-lg items-center justify-center"
                    >
                      <StopIcon size={11} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : !activeHabit ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      startTimer(habit);
                    }}
                    style={{ backgroundColor: timerBg }}
                    className="px-2.5 py-1 rounded-xl items-center justify-center"
                  >
                    <Text className="font-psemibold text-[11px]" style={{ color: contrastColor }}>
                      Start
                    </Text>
                  </TouchableOpacity>
                ) : null
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
