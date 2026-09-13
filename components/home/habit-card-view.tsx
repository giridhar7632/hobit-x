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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CompletionIndicator } from '@/components/home/completion-indicator';
import { useTimer } from '@/context/timer-context';
import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import {
  BellIcon,
  ClockIcon,
  FlameIcon,
  renderHabitIcon,
} from '@/constants/icons';
import { getHabitTotalReminders, parseNotifyTimes } from '@/utils/notifications';
import { Habit } from '@/utils/types';

interface HabitCardViewProps {
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

export function HabitCardView({
  habits,
  onPressHabit,
  onTrackHabit,
  onUntrackHabit,
  onTimerPress,
  isFullyCompleted,
}: HabitCardViewProps) {
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
    <View className="px-5 gap-3.5">
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
        const iconWrapBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const badgeBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const timerBg = isWhiteText ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.12)';
        const cardBorder = isWhiteText ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';
        const dividerColor = isWhiteText ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)';
        const activeGlow = isWhiteText ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';

        const notifyTimeStr = (() => {
          if (!habit.notify || !habit.notify_time) return null;
          const times = parseNotifyTimes(habit.notify_time);
          if (times.length === 0) return null;
          const first = new Date(times[0]);
          if (isNaN(first.getTime())) return null;
          const formatted = first.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return times.length > 1 ? `${formatted} (+${times.length - 1})` : formatted;
        })();

        return (
          <TouchableOpacity
            key={habit.id}
            activeOpacity={0.8}
            onPress={() => onPressHabit(habit)}
            style={[
              {
                backgroundColor: cardBg,
                borderColor: isThisActive ? contrastColor : cardBorder,
                borderWidth: isThisActive ? 1.5 : 1,
              },
              completed && { opacity: 0.65 },
            ]}
            className="rounded-[24px] border px-4 py-6 shadow-sm shadow-black/5"
          >
            <View className="flex-row items-center gap-3.5">
              <View
                style={{ backgroundColor: iconWrapBg }}
                className="w-11 h-11 rounded-[14px] items-center justify-center"
              >
                {renderHabitIcon(habit.icon, contrastColor, 24)}
              </View>

              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  style={[
                    {
                      color: contrastColor,
                      textDecorationLine: completed ? 'line-through' : 'none',
                    },
                  ]}
                  className="font-pbold text-[17px] tracking-tight"
                >
                  {habit.name}
                </Text>

                {habit.description ? (
                  <Text
                    numberOfLines={1}
                    style={{ color: subtextColor }}
                    className="font-pregular text-xs mt-0.5"
                  >
                    {habit.description}
                  </Text>
                ) : null}
              </View>

              <CompletionIndicator
                isCompleted={completed}
                completedCount={completedCount}
                totalCount={totalReminders}
                accentColor={contrastColor}
                size={40}
                onTrack={() => onTrackHabit(habit)}
                onUntrack={() => onUntrackHabit(habit)}
              />
            </View>

            {/* Active timer bar */}
            {isThisActive ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                className="mt-4 pt-3 border-t flex-row items-center gap-3"
                style={{ borderTopColor: dividerColor }}
              >
                <View style={{ backgroundColor: activeGlow }} className="flex-1 flex-row items-center gap-2 px-3 py-2 rounded-[12px]">
                  {isRunning
                    ? <ActiveDot color={contrastColor} />
                    : <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: contrastColor, opacity: 0.4 }} />
                  }
                  <Text className="font-psemibold text-xs flex-1" style={{ color: contrastColor }}>
                    Active · {formatActiveMinutes(secondsElapsed)}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => { e.stopPropagation?.(); isRunning ? pauseTimer() : resumeTimer(); }}
                  style={{ backgroundColor: timerBg }}
                  className="px-3 py-2 rounded-[12px] items-center justify-center"
                >
                  <Text className="font-psemibold text-xs" style={{ color: contrastColor }}>
                    {isRunning ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => { e.stopPropagation?.(); cancelTimer(); }}
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
                  className="px-3 py-2 rounded-[12px] items-center justify-center"
                >
                  <Text className="font-psemibold text-xs" style={{ color: '#ef4444' }}>Stop</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View
                style={{ borderTopColor: dividerColor }}
                className="flex-row items-center justify-between mt-4 pt-3 border-t"
              >
                <View className="flex-row items-center flex-wrap gap-2">
                  {habit.planned_time_minutes ? (
                    <View
                      style={{ backgroundColor: badgeBg }}
                      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-[10px]"
                    >
                      <ClockIcon size={12} color={contrastColor} />
                      <Text
                        style={{ color: contrastColor }}
                        className="font-psemibold text-[11px]"
                      >
                        {habit.planned_time_minutes} min
                      </Text>
                    </View>
                  ) : null}

                  {habit.current_streak > 0 ? (
                    <View
                      style={{ backgroundColor: badgeBg }}
                      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-[10px]"
                    >
                      <FlameIcon size={12} color={contrastColor} />
                      <Text
                        style={{ color: contrastColor }}
                        className="font-psemibold text-[11px]"
                      >
                        {habit.current_streak}
                      </Text>
                    </View>
                  ) : null}

                  {notifyTimeStr ? (
                    <View
                      style={{ backgroundColor: badgeBg }}
                      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-[10px]"
                    >
                      <BellIcon size={12} color={contrastColor} />
                      <Text
                        style={{ color: contrastColor }}
                        className="font-psemibold text-[11px]"
                      >
                        {notifyTimeStr}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {habit.planned_time_minutes && !completed && !activeHabit ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      startTimer(habit);
                    }}
                    style={{ backgroundColor: timerBg }}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  >
                    <Text className="font-psemibold text-[12px]" style={{ color: contrastColor }}>
                      Start
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
