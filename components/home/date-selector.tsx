import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getContrastTextColor } from '@/constants/habit-colors';
import { ChevronIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DateSelectorProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateISO: string) => void;
  tintColor?: string;
}

interface DayItem {
  dateISO: string;
  dayNumber: number;
  dayLabel: string;
  isToday: boolean;
  dateObj: Date;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  tintColor = '#4655E0',
}: DateSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const contrastText = getContrastTextColor(tintColor);

  const [weekOffset, setWeekOffset] = useState<number>(0);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const todayISO = useMemo(() => formatDateISO(today), [today]);

  // Current displayed Monday based on weekOffset
  const currentMonday = useMemo(() => {
    const mon = getMonday(today);
    mon.setDate(mon.getDate() + weekOffset * 7);
    return mon;
  }, [today, weekOffset]);

  // 7 days of this week (Mon to Sun)
  const weekDays: DayItem[] = useMemo(() => {
    const days: DayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      const dateISO = formatDateISO(d);
      const dayLabel = d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase()
        .slice(0, 3);
      days.push({
        dateISO,
        dayNumber: d.getDate(),
        dayLabel,
        isToday: dateISO === todayISO,
        dateObj: d,
      });
    }
    return days;
  }, [currentMonday, todayISO]);

  // Header Title e.g. "This Week (Sep 8 - 14)" or "Aug 31 - Sep 6"
  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    if (weekOffset === 1) return 'Next Week';
    const startStr = currentMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [weekOffset, currentMonday]);

  const handleSelect = (dateISO: string) => {
    Haptics.selectionAsync();
    onSelectDate(dateISO);
  };

  const handlePrevWeek = () => {
    Haptics.selectionAsync();
    setWeekOffset((w) => w - 1);
  };

  const handleNextWeek = () => {
    Haptics.selectionAsync();
    setWeekOffset((w) => w + 1);
  };

  const handleResetToday = () => {
    Haptics.selectionAsync();
    setWeekOffset(0);
    onSelectDate(todayISO);
  };

  return (
    <View className="my-2.5 px-5">
      {/* Week Navigation Header */}
      <View className="flex-row items-center justify-between mb-2 px-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-pbold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            {weekLabel}
          </Text>
          {weekOffset !== 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetToday}
              className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10"
            >
              <Text className="text-[10px] font-psemibold text-neutral-600 dark:text-neutral-300">
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevWeek}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-full items-center justify-center bg-black/5 dark:bg-white/5"
          >
            <ChevronIcon direction="left" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNextWeek}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-7 h-7 rounded-full items-center justify-center bg-black/5 dark:bg-white/5"
          >
            <ChevronIcon direction="right" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7 Days Row */}
      <View className="flex-row justify-between items-center">
        {weekDays.map((item) => {
          const isSelected = item.dateISO === selectedDate;

          const itemBg = isSelected
            ? tintColor
            : isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.03)';

          const labelColor = isSelected
            ? contrastText
            : isDark
            ? 'rgba(255,255,255,0.45)'
            : 'rgba(0,0,0,0.4)';

          const numberColor = isSelected
            ? contrastText
            : isDark
            ? '#ECEDEE'
            : '#11181C';

          return (
            <TouchableOpacity
              key={item.dateISO}
              activeOpacity={0.7}
              onPress={() => handleSelect(item.dateISO)}
              style={{
                backgroundColor: itemBg,
                borderColor: isSelected
                  ? 'transparent'
                  : item.isToday
                  ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')
                  : 'transparent',
                borderWidth: item.isToday && !isSelected ? 1 : 0,
              }}
              className="w-[12.8%] h-[60px] rounded-2xl items-center justify-center py-2"
            >
              <Text
                style={{ color: labelColor }}
                className="font-psemibold text-[10px] tracking-wider mb-1"
              >
                {item.dayLabel}
              </Text>
              <Text
                style={{ color: numberColor }}
                className="font-pbold text-base leading-none"
              >
                {item.dayNumber}
              </Text>

              {/* Today indicator dot if not selected */}
              {item.isToday && !isSelected && (
                <View
                  style={{ backgroundColor: tintColor }}
                  className="w-1 h-1 rounded-full mt-1"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
