import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONTS } from '@/constants/fonts';
import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import {
  ChevronIcon,
  ClockIcon,
  FlameIcon,
  SkipIcon,
  TickIcon,
  renderHabitIcon
} from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getCalendarMonthData,
  getHabitsWithEntriesForDate,
} from '@/utils/actions';
import { Habit, HabitEntry } from '@/utils/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

interface DayHabitDetail {
  habit: Habit;
  entries: HabitEntry[];
  isCompleted: boolean;
  isSkipped: boolean;
  totalTimeMinutes: number;
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[isDark ? 'dark' : 'light'];
  const { activeColor } = useAppTheme();

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => getTodayISO(), []);

  // Earliest allowable month: 3 months prior to today
  const minDate = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    return d;
  }, [today]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  const [monthData, setMonthData] = useState<
    Record<string, { completedCount: number; totalScheduled: number; pointsEarned: number }>
  >({});
  const [dayDetails, setDayDetails] = useState<DayHabitDetail[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const currentYear = currentMonthDate.getFullYear();
  const currentMonthIndex = currentMonthDate.getMonth();

  const canGoPrev = useMemo(() => {
    const prevMonthDate = new Date(currentYear, currentMonthIndex - 1, 1);
    return prevMonthDate >= minDate;
  }, [currentYear, currentMonthIndex, minDate]);

  const canGoNext = useMemo(() => {
    const nextMonthDate = new Date(currentYear, currentMonthIndex + 1, 1);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return nextMonthDate <= thisMonthStart;
  }, [currentYear, currentMonthIndex, today]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonthDate(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonthDate(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const handleJumpToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayISO);
  };

  // Load monthly overview data
  const loadMonthOverview = useCallback(async () => {
    setIsLoadingMonth(true);
    try {
      const startOfMonth = formatISODate(currentYear, currentMonthIndex, 1);
      const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
      const endOfMonth = formatISODate(currentYear, currentMonthIndex, daysInMonth);

      const data = await getCalendarMonthData(startOfMonth, endOfMonth);
      const map: Record<string, { completedCount: number; totalScheduled: number; pointsEarned: number }> = {};
      data.forEach((item) => {
        map[item.date] = {
          completedCount: item.completedCount,
          totalScheduled: item.totalScheduled,
          pointsEarned: item.pointsEarned,
        };
      });
      setMonthData(map);
    } catch (e) {
      console.error('Error loading month overview:', e);
    } finally {
      setIsLoadingMonth(false);
    }
  }, [currentYear, currentMonthIndex]);

  // Load details for selected day
  const loadDayDetails = useCallback(async (dateISO: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await getHabitsWithEntriesForDate(dateISO);
      setDayDetails(details);
    } catch (e) {
      console.error('Error loading day details:', e);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonthOverview();
      loadDayDetails(selectedDate);
    }, [loadMonthOverview, loadDayDetails, selectedDate])
  );

  // Month grid days builder (Monday to Sunday)
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
    // Monday as 0, Sunday as 6
    const offset = (firstDayOfWeek + 6) % 7;

    const days: Array<{
      dayNumber: number;
      dateISO: string;
      isCurrentMonth: boolean;
    }> = [];

    // Leading padding from previous month
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
      const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
      days.push({
        dayNumber: dayNum,
        dateISO: formatISODate(prevYear, prevMonth, dayNum),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dayNumber: d,
        dateISO: formatISODate(currentYear, currentMonthIndex, d),
        isCurrentMonth: true,
      });
    }

    // Trailing padding to fill complete rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
      const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
      days.push({
        dayNumber: i,
        dateISO: formatISODate(nextYear, nextMonth, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonthIndex]);

  // Selected date formatted for display
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Stats for selected day
  const selectedDayStats = useMemo(() => {
    const total = dayDetails.length;
    const completed = dayDetails.filter((d) => d.isCompleted).length;
    const skipped = dayDetails.filter((d) => d.isSkipped).length;
    const totalMinutes = dayDetails.reduce((acc, d) => acc + d.totalTimeMinutes, 0);
    const points = dayDetails.reduce((acc, d) => {
      const entryPoints = d.entries.reduce((p, e) => p + (e.points || 0), 0);
      return acc + entryPoints;
    }, 0);

    return { total, completed, skipped, totalMinutes, points };
  }, [dayDetails]);

  const isTodayInView =
    today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#11181C' },
              ]}
            >
              Activity
            </Text>
            {/* <Text
              style={[
                styles.subtitle,
                { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' },
              ]}
            >
              Review your habits and completion streaks
            </Text> */}
          </View>

          {(!isTodayInView || selectedDate !== todayISO) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleJumpToToday}
              style={[
                styles.todayJumpBtn,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.todayJumpBtnText,
                  { color: activeColor.accent },
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Month Navigator */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              disabled={!canGoPrev}
              style={[
                styles.arrowBtn,
                { opacity: canGoPrev ? 1 : 0.25 },
              ]}
            >
              <ChevronIcon
                direction="left"
                size={20}
                color={isDark ? '#FFFFFF' : '#11181C'}
              />
            </TouchableOpacity>

            <View style={styles.monthTitleWrap}>
              <Text
                style={[
                  styles.monthTitleText,
                  { color: isDark ? '#FFFFFF' : '#11181C' },
                ]}
              >
                {MONTH_NAMES[currentMonthIndex]} {currentYear}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              disabled={!canGoNext}
              style={[
                styles.arrowBtn,
                { opacity: canGoNext ? 1 : 0.25 },
              ]}
            >
              <ChevronIcon
                direction="right"
                size={20}
                color={isDark ? '#FFFFFF' : '#11181C'}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday Header */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  {
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    fontFamily: idx >= 5 ? FONTS.bold : FONTS.semibold,
                  },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Month Grid */}
          <View style={styles.gridContainer}>
            {calendarDays.map((item, index) => {
              const isSelected = item.dateISO === selectedDate;
              const isToday = item.dateISO === todayISO;
              const dayStat = monthData[item.dateISO];

              const totalSched = dayStat?.totalScheduled ?? 0;
              const completedSched = dayStat?.completedCount ?? 0;

              const isFutureDate = item.dateISO > todayISO;
              const isAllDone = totalSched > 0 && completedSched >= totalSched;
              const isPartDone = totalSched > 0 && completedSched > 0 && completedSched < totalSched;

              const selectedContrastText = getContrastTextColor(activeColor.accent);

              return (
                <TouchableOpacity
                  key={`${item.dateISO}-${index}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDate(item.dateISO);
                    loadDayDetails(item.dateISO);
                  }}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayContent,
                      isSelected && {
                        backgroundColor: activeColor.accent,
                        shadowColor: activeColor.accent,
                        shadowOpacity: 0.35,
                        shadowOffset: { width: 0, height: 3 },
                        shadowRadius: 6,
                        elevation: 4,
                      },
                      isToday &&
                      !isSelected && {
                        borderWidth: 1.5,
                        borderColor: activeColor.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        {
                          color: isSelected
                            ? selectedContrastText
                            : !item.isCurrentMonth
                              ? isDark
                                ? 'rgba(255,255,255,0.2)'
                                : 'rgba(0,0,0,0.2)'
                              : isDark
                                ? '#FFFFFF'
                                : '#11181C',
                          fontFamily: isSelected || isToday ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {item.dayNumber}
                    </Text>

                    {/* Completion Indicators */}
                    <View style={styles.indicatorContainer}>
                      {item.isCurrentMonth && !isFutureDate && totalSched > 0 ? (
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isSelected
                                ? selectedContrastText
                                : isAllDone
                                  ? '#10B981'
                                  : isPartDone
                                    ? '#F59E0B'
                                    : isDark
                                      ? 'rgba(255,255,255,0.2)'
                                      : 'rgba(0,0,0,0.18)',
                            },
                          ]}
                        />
                      ) : (
                        <View style={styles.statusDotPlaceholder} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Habit Status Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderLeft}>
              <Text
                style={[
                  styles.detailsDateTitle,
                  { color: isDark ? '#FFFFFF' : '#11181C' },
                ]}
              >
                {formattedSelectedDate}
              </Text>
              <Text
                style={[
                  styles.detailsSubtitle,
                  { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
                ]}
              >
                {selectedDayStats.total > 0
                  ? `${selectedDayStats.completed} of ${selectedDayStats.total} completed`
                  : 'No scheduled habits'}
              </Text>
            </View>

            {selectedDayStats.totalMinutes > 0 && (
              <View
                style={[
                  styles.timeBadge,
                  {
                    backgroundColor: isDark ? '#2A2B2E' : '#F4F4F5',
                  },
                ]}
              >
                <ClockIcon size={13} color={isDark ? '#A1A1AA' : '#71717A'} />
                <Text
                  style={[
                    styles.timeBadgeText,
                    { color: isDark ? '#ECEDEE' : '#27272A' },
                  ]}
                >
                  {selectedDayStats.totalMinutes}m tracked
                </Text>
              </View>
            )}
          </View>

          {/* List of Habits for selected day */}
          {isLoadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={activeColor.accent} size="small" />
            </View>
          ) : dayDetails.length === 0 ? (
            <View
              style={[
                styles.emptyDayCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text style={styles.emptyEmoji}>🍃</Text>
              <Text
                style={[
                  styles.emptyDayTitle,
                  { color: isDark ? '#FFFFFF' : '#11181C' },
                ]}
              >
                No habits scheduled
              </Text>
              <Text
                style={[
                  styles.emptyDaySubtitle,
                  { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' },
                ]}
              >
                There were no habits planned for this date.
              </Text>
            </View>
          ) : (
            <View className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1C1D20] shadow-sm shadow-black/5 overflow-visible">
              {dayDetails.map((item, idx) => {
                const habitDef = getHabitColor(item.habit.color);
                const isCompleted = item.isCompleted;
                const isSkipped = item.isSkipped;
                const note = item.entries.find((e) => e.note)?.note;

                return (
                  <TouchableOpacity
                    key={item.habit.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/habits/${item.habit.id}`);
                    }}
                    className={`flex-row items-center py-3.5 px-4 gap-3.5 overflow-visible ${
                      idx === 0 ? 'rounded-t-[20px]' : ''
                    } ${
                      idx === dayDetails.length - 1
                        ? 'rounded-b-[20px]'
                        : 'border-b border-black/[0.05] dark:border-white/[0.06]'
                    }`}
                    style={isCompleted ? { opacity: 0.65 } : undefined}
                  >
                    {/* Icon Square */}
                    <View
                      style={{
                        backgroundColor: isDark
                          ? habitDef.pastelBgDark
                          : habitDef.pastelBg,
                      }}
                      className="w-[38px] h-[38px] rounded-xl items-center justify-center"
                    >
                      {renderHabitIcon(item.habit.icon, '#1C1C1E', 18)}
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`font-psemibold text-[15px] tracking-tight ${
                          isCompleted ? 'line-through opacity-70' : ''
                        } text-neutral-900 dark:text-neutral-100`}
                      >
                        {item.habit.name}
                      </Text>

                      {/* Badges / Subtitle */}
                      <View className="flex-row items-center gap-2.5 mt-0.5">
                        {item.totalTimeMinutes > 0 ? (
                          <View className="flex-row items-center gap-1">
                            <ClockIcon size={11} color={habitDef.accent} />
                            <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                              {item.totalTimeMinutes}m
                            </Text>
                          </View>
                        ) : item.habit.planned_time_minutes ? (
                          <View className="flex-row items-center gap-1">
                            <ClockIcon size={11} color={habitDef.accent} />
                            <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                              {item.habit.planned_time_minutes}m
                            </Text>
                          </View>
                        ) : null}

                        {item.habit.current_streak > 0 ? (
                          <View className="flex-row items-center gap-1">
                            <FlameIcon size={11} color={habitDef.accent} />
                            <Text className="font-pmedium text-xs text-neutral-500 dark:text-neutral-400">
                              {item.habit.current_streak}
                            </Text>
                          </View>
                        ) : null}

                        {note ? (
                          <Text
                            numberOfLines={1}
                            className="font-pregular text-xs text-neutral-400 dark:text-neutral-500 flex-1 italic"
                          >
                            "{note}"
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Right Status Indicator */}
                    <View className="flex-row items-center gap-2 overflow-visible">
                      {isCompleted ? (
                        <View
                          style={{ backgroundColor: habitDef.accent }}
                          className="w-[34px] h-[34px] rounded-full items-center justify-center shadow-sm"
                        >
                          <TickIcon size={16} color={getContrastTextColor(habitDef.accent)} />
                        </View>
                      ) : isSkipped ? (
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                          }}
                          className="px-2.5 py-1 rounded-full border"
                        >
                          <Text className="text-[#F59E0B] font-psemibold text-xs">
                            Skipped
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
                          }}
                          className="w-[34px] h-[34px] rounded-full border-[2.5px] items-center justify-center"
                        >
                          <View
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            }}
                            className="w-[12px] h-[12px] rounded-full"
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    marginTop: 2,
  },
  todayJumpBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  todayJumpBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  calendarCard: {
    marginHorizontal: 18,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekdayText: {
    fontFamily: FONTS.semibold,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayContent: {
    width: 38,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 3,
  },
  dayNumberText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  indicatorContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotPlaceholder: {
    width: 5,
    height: 5,
  },
  detailsSection: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailsHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  detailsDateTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  detailsSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyDayCard: {
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyDayTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginBottom: 4,
  },
  emptyDaySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  habitList: {
    gap: 10,
  },
  habitCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  habitCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  habitName: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  habitDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadgeWrap: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  noteBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: {
    fontFamily: FONTS.italic,
    fontSize: 12,
  },
});
