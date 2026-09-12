import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getContrastTextColor } from '@/constants/habit-colors';
import {
  ChevronIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  SunsetIcon,
  TickIcon
} from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepScheduleProps {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  timesOfDay?: ('morning' | 'afternoon' | 'evening' | 'anytime')[];
  onChangeTimeOfDay?: (tod: 'morning' | 'afternoon' | 'evening' | 'anytime') => void;
  onChangeTimesOfDay?: (tods: ('morning' | 'afternoon' | 'evening' | 'anytime')[]) => void;
  frequency: 'daily' | 'weekly' | 'interval';
  onChangeFrequency: (freq: 'daily' | 'weekly' | 'interval') => void;
  targetDays: number[];
  onChangeTargetDays: (days: number[]) => void;
  interval: number;
  onChangeInterval: (interval: number) => void;
  accentColor?: string;
}

const TIME_OF_DAY_CARDS = [
  { key: 'morning', label: 'Morning', icon: SunIcon, period: '5 AM - 12 PM' },
  { key: 'afternoon', label: 'Afternoon', icon: SunsetIcon, period: '12 PM - 5 PM' },
  { key: 'evening', label: 'Evening', icon: MoonIcon, period: '5 PM - 11 PM' },
  { key: 'anytime', label: 'Anytime', icon: SparklesIcon, period: 'All day' },
] as const;

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Specific days',
  interval: 'Every X days',
};

const WEEK_DAYS = [
  { label: 'M', dayName: 'MON', value: 1 },
  { label: 'T', dayName: 'TUE', value: 2 },
  { label: 'W', dayName: 'WED', value: 3 },
  { label: 'T', dayName: 'THU', value: 4 },
  { label: 'F', dayName: 'FRI', value: 5 },
  { label: 'S', dayName: 'SAT', value: 6 },
  { label: 'S', dayName: 'SUN', value: 0 },
];

export function StepSchedule({
  timeOfDay,
  timesOfDay,
  onChangeTimeOfDay,
  onChangeTimesOfDay,
  frequency,
  onChangeFrequency,
  targetDays,
  onChangeTargetDays,
  interval,
  onChangeInterval,
  accentColor = '#4655E0',
}: StepScheduleProps) {
  const [isFreqPickerOpen, setIsFreqPickerOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  const selectedTimes: ('morning' | 'afternoon' | 'evening' | 'anytime')[] = React.useMemo(() => {
    if (timesOfDay && timesOfDay.length > 0) return timesOfDay;
    if (timeOfDay) return [timeOfDay];
    return ['anytime'];
  }, [timesOfDay, timeOfDay]);

  const handleToggleTimeOfDay = (key: 'morning' | 'afternoon' | 'evening' | 'anytime') => {
    Haptics.selectionAsync();
    let newTimes: ('morning' | 'afternoon' | 'evening' | 'anytime')[] = [];

    if (key === 'anytime') {
      newTimes = ['anytime'];
    } else {
      const withoutAnytime = selectedTimes.filter((t) => t !== 'anytime');
      if (withoutAnytime.includes(key)) {
        newTimes = withoutAnytime.filter((t) => t !== key);
        if (newTimes.length === 0) newTimes = ['anytime'];
      } else {
        newTimes = [...withoutAnytime, key];
      }
    }

    if (onChangeTimesOfDay) {
      onChangeTimesOfDay(newTimes);
    }
    if (onChangeTimeOfDay) {
      onChangeTimeOfDay(newTimes[0] || 'anytime');
    }
  };

  const handleToggleDay = (dayVal: number) => {
    Haptics.selectionAsync();
    if (targetDays.includes(dayVal)) {
      if (targetDays.length > 1) {
        onChangeTargetDays(targetDays.filter((d) => d !== dayVal));
      }
    } else {
      onChangeTargetDays([...targetDays, dayVal]);
    }
  };

  return (
    <View className="px-5 gap-6">
      {/* TIME OF DAY */}
      <View className="gap-2.5">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 pl-1">
            TIME OF DAY
          </Text>
          <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
            Select multiple if needed
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          {TIME_OF_DAY_CARDS.map((card) => {
            const isSelected = selectedTimes.includes(card.key);
            const IconComponent = card.icon;

            return (
              <TouchableOpacity
                key={card.key}
                activeOpacity={0.75}
                onPress={() => handleToggleTimeOfDay(card.key)}
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? `${accentColor}25`
                      : `${accentColor}18`
                    : isDark ? '#1F2023' : '#FFFFFF',
                  borderColor: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  borderWidth: isSelected ? 2 : 1,
                }}
                className="w-[48%] rounded-2xl p-3.5 gap-2.5 shadow-sm shadow-black/5"
              >
                <View
                  style={{
                    backgroundColor: isSelected
                      ? accentColor
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                  }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <IconComponent
                    size={20}
                    color={isSelected ? getContrastTextColor(accentColor) : textColor}
                  />
                </View>

                <View className="gap-0.5">
                  <Text
                    style={{
                      color: isSelected ? (isDark ? '#FFFFFF' : '#11181C') : textColor,
                    }}
                    className={`text-base ${isSelected ? 'font-pbold' : 'font-psemibold'}`}
                  >
                    {card.label}
                  </Text>
                  <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
                    {card.period}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* FREQUENCY SELECTOR */}
      <View className="gap-2.5">
        <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 pl-1">
          FREQUENCY
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsFreqPickerOpen(true)}
          className="flex-row items-center justify-between px-4 h-[52px] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1F2023]"
        >
          <Text className="font-psemibold text-base text-neutral-900 dark:text-neutral-100">
            {FREQUENCY_LABELS[frequency] || 'Every day'}
          </Text>
          <ChevronIcon direction="right" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        {/* PROGRESSIVE DISCLOSURE: Specific Days */}
        {frequency === 'weekly' && (
          <View className="mt-2.5 gap-2.5 px-0.5">
            <Text className="font-pmedium text-xs text-neutral-400 dark:text-neutral-500">
              Select specific days of the week
            </Text>
            <View className="flex-row justify-between">
              {WEEK_DAYS.map((d) => {
                const isActive = targetDays.includes(d.value);
                return (
                  <TouchableOpacity
                    key={`${d.dayName}-${d.value}`}
                    activeOpacity={0.7}
                    onPress={() => handleToggleDay(d.value)}
                    style={{
                      backgroundColor: isActive
                        ? accentColor
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      borderColor: isActive
                        ? accentColor
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center border"
                  >
                    <Text
                      style={{ color: isActive ? getContrastTextColor(accentColor) : textColor }}
                      className="font-pbold text-sm"
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* PROGRESSIVE DISCLOSURE: Every X Days */}
        {frequency === 'interval' && (
          <View className="mt-2.5 gap-2.5 px-0.5">
            <View className="flex-row items-center justify-between py-2">
              <Text className="font-psemibold text-sm text-neutral-900 dark:text-neutral-100">
                Repeat every
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeInterval(Math.max(1, interval - 1));
                  }}
                  className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.05] dark:bg-white/[0.08]"
                >
                  <Text className="font-pbold text-lg text-neutral-900 dark:text-neutral-100">−</Text>
                </TouchableOpacity>

                <Text style={{ color: accentColor }} className="font-pbold text-lg min-w-[24px] text-center">
                  {interval}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeInterval(interval + 1);
                  }}
                  className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.05] dark:bg-white/[0.08]"
                >
                  <Text className="font-pbold text-lg text-neutral-900 dark:text-neutral-100">+</Text>
                </TouchableOpacity>

                <Text className="font-pmedium text-sm text-neutral-400 dark:text-neutral-500">
                  {interval === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Frequency Options Modal */}
      <Modal
        visible={isFreqPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFreqPickerOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center p-6"
          onPress={() => setIsFreqPickerOpen(false)}
        >
          <View
            className="w-full max-w-[320px] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 gap-1 bg-white dark:bg-[#222326] shadow-xl shadow-black/10"
          >
            <Text className="font-pbold text-base text-neutral-900 dark:text-neutral-100 mb-2 px-2">
              Frequency
            </Text>

            {(['daily', 'weekly', 'interval'] as const).map((optKey) => {
              const isSelected = frequency === optKey;
              return (
                <TouchableOpacity
                  key={optKey}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeFrequency(optKey);
                    setIsFreqPickerOpen(false);
                  }}
                  style={{
                    backgroundColor: isSelected ? `${accentColor}15` : 'transparent',
                  }}
                  className="flex-row items-center justify-between py-3.5 px-3 rounded-2xl"
                >
                  <Text
                    style={{
                      color: isSelected ? accentColor : textColor,
                    }}
                    className={`text-base ${isSelected ? 'font-pbold' : 'font-pmedium'}`}
                  >
                    {FREQUENCY_LABELS[optKey]}
                  </Text>
                  {isSelected && <TickIcon size={18} color={accentColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
