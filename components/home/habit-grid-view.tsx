import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CompletionIndicator } from '@/components/home/completion-indicator';
import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import { ClockIcon, FlameIcon, renderHabitIcon, TimerIcon } from '@/constants/icons';
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

export function HabitGridView({
  habits,
  onPressHabit,
  onTrackHabit,
  onUntrackHabit,
  onTimerPress,
  isFullyCompleted,
}: HabitGridViewProps) {
  return (
    <View className="flex-row flex-wrap px-4 gap-3">
      {habits.map((habit) => {
        const colorDef = getHabitColor(habit.color);
        const completed = isFullyCompleted(habit);
        const totalReminders = getHabitTotalReminders(habit);
        const completedCount = habit.today_completed_count || 0;

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
                borderColor: cardBorder,
              },
              completed && { opacity: 0.65 },
            ]}
            className="rounded-[22px] border p-3.5 min-h-[146px] justify-between shadow-sm shadow-black/5"
          >
            {/* Top Row: Icon + Indicator */}
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

            {/* Middle: Habit Name */}
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

              {habit.description ? (
                <Text
                  numberOfLines={1}
                  style={{ color: subtextColor }}
                  className="font-pregular text-[11px] mt-0.5"
                >
                  {habit.description}
                </Text>
              ) : null}
            </View>

            {/* Bottom Row: Badges / Timer Action */}
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

              {habit.planned_time_minutes && !completed ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onTimerPress(habit);
                  }}
                  style={{ backgroundColor: timerBg }}
                  className="w-7 h-7 rounded-lg items-center justify-center"
                >
                  <TimerIcon size={14} color={contrastColor} />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
