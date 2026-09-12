import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CompletionIndicator } from '@/components/home/completion-indicator';
import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import {
  BellIcon,
  ClockIcon,
  FlameIcon,
  renderHabitIcon,
  TimerIcon,
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

export function HabitCardView({
  habits,
  onPressHabit,
  onTrackHabit,
  onUntrackHabit,
  onTimerPress,
  isFullyCompleted,
}: HabitCardViewProps) {
  return (
    <View className="px-5 gap-3.5">
      {habits.map((habit) => {
        const colorDef = getHabitColor(habit.color);
        const completed = isFullyCompleted(habit);
        const totalReminders = getHabitTotalReminders(habit);
        const completedCount = habit.today_completed_count || 0;

        const cardBg = colorDef.hex;
        const contrastColor = getContrastTextColor(colorDef.hex);
        const isWhiteText = contrastColor === '#FFFFFF';

        const subtextColor = isWhiteText ? 'rgba(255, 255, 255, 0.75)' : 'rgba(28, 28, 30, 0.7)';
        const iconWrapBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const badgeBg = isWhiteText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
        const timerBg = isWhiteText ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.12)';
        const cardBorder = isWhiteText ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';
        const dividerColor = isWhiteText ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)';

        // Notification formatted string
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
                borderColor: cardBorder,
              },
              completed && { opacity: 0.65 },
            ]}
            className="rounded-[24px] border px-4 py-6 shadow-sm shadow-black/5"
          >
            {/* Top row: Icon + Name + Completion */}
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

            {/* Bottom Row: Metadata Badges & Timer Button */}
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

              {habit.planned_time_minutes && !completed ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onTimerPress(habit);
                  }}
                  style={{ backgroundColor: timerBg }}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                >
                  <TimerIcon size={16} color={contrastColor} />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
