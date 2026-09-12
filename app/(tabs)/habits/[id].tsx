import { formatRelative } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMeridianMutation, useQuery, useQueryClient } from 'meridian-lite';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Heatmap from '@/components/heat-map';
import { CompletionIndicator } from '@/components/home/completion-indicator';
import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/button';
import { CustomSwitch } from '@/components/ui/switch';
import { FONTS } from '@/constants/fonts';
import { getHabitColor } from '@/constants/habit-colors';
import {
  BinIcon,
  CancelIcon,
  ChevronIcon,
  EditIcon,
  FlameIcon,
  renderHabitIcon,
  SkipIcon,
  SunIcon,
  TickIcon
} from '@/constants/icons';
import { STREAK_MESSAGES } from '@/constants/messages';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import {
  deleteEntry,
  deleteHabit,
  getHabitActivity,
  getHabitById,
  getHabitCompletedDates,
  trackHabit,
  untrackHabitToday,
  updateHabit,
} from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { getHabitTotalReminders, parseNotifyTimes, parseTimesOfDay, refreshHabitNotifications } from '@/utils/notifications';
import { Habit, HabitEntry } from '@/utils/types';

const WEEK_DAYS = [
  { label: 'Mon', dayNumber: 1 },
  { label: 'Tue', dayNumber: 2 },
  { label: 'Wed', dayNumber: 3 },
  { label: 'Thu', dayNumber: 4 },
  { label: 'Fri', dayNumber: 5 },
  { label: 'Sat', dayNumber: 6 },
  { label: 'Sun', dayNumber: 0 },
];

const DAILY_SCHEDULE_OPTIONS = [
  { key: 'morning', label: 'Morning Circle' },
  { key: 'noon', label: 'Noon Circle' },
  { key: 'evening', label: 'Evening Circle' },
  { key: 'anytime', label: 'Always Active' },
];

function formatCreatedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}



export default function HabitScreen() {
  const { id } = useLocalSearchParams();
  const habitId = id?.toString() ?? '';
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';
  const { setActiveColor } = useAppTheme();

  // Mocked state for interactive daily schedule partition
  const [selectedDailySchedule, setSelectedDailySchedule] = useState<string>('morning');

  const habitKey = useMemo(() => ['habit', habitId], [habitId]);
  const entriesKey = useMemo(() => ['habit_entries', habitId], [habitId]);
  const datesKey = useMemo(() => ['habit-dates', habitId], [habitId]);

  const {
    data: habit,
    isLoading: isLoadingHabit,
    isError: isErrorHabit,
    error: errorHabit,
  } = useQuery<Habit | null>({
    queryKey: habitKey,
    queryFn: async () => {
      const h = await getHabitById(habitId);
      if (!h) throw new Error('Habit not found');
      return h;
    },
  });

  const {
    data: activity = [],
    isLoading: isLoadingActivity,
    isError: isErrorActivity,
    error: errorActivity,
  } = useQuery<HabitEntry[]>({
    queryKey: entriesKey,
    queryFn: () => getHabitActivity(habitId),
  });

  const { data: completedDates = [], isLoading: isLoadingDates } = useQuery<
    { date: string; status: string }[]
  >({
    queryKey: datesKey,
    queryFn: () => getHabitCompletedDates(habitId),
  });

  const queryClient = useQueryClient();

  const { mutate: mutateOutbox } = useMeridianMutation({
    invalidateKeys: [['habits'], ['habit_entries', habitId], ['habit-dates', habitId]],
  });

  const onDeleteEntry = async (entry_id: string) => {
    if (!habitId) return;
    try {
      const result = await deleteEntry(entry_id, habitId);
      queryClient.invalidateQueries({ queryKey: ['habit_entries', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit-dates', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      await mutateOutbox('delete_entry', result);
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', error.message);
    }
  };

  const onDeleteHabit = (hId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Habit',
      'Are you sure? This will delete all activity data for this habit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(hId);
              queryClient.invalidateQueries({ queryKey: ['habits'] });
              queryClient.invalidateQueries({ queryKey: ['habit_entries', hId] });
              queryClient.invalidateQueries({ queryKey: ['habit-dates', hId] });
              await mutateOutbox('delete_habit', { id: hId });
              router.replace('/(tabs)/habits');
            } catch (error: any) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Toggle notification logic
  const onToggleNotification = async (newVal: boolean) => {
    if (!habit) return;
    try {
      Haptics.selectionAsync();
      const notifyVal = newVal ? 1 : 0;
      let notificationIds: string[] = [];

      if (newVal) {
        notificationIds = await refreshHabitNotifications(
          { ...habit, notify: 1 },
          habit.today_tracked_minutes || 0,
          false
        );
      } else {
        await refreshHabitNotifications(
          { ...habit, notify: 0 },
          0,
          true
        );
      }

      const updatedData = {
        ...habit,
        notify: notifyVal,
        notification_ids: JSON.stringify(notificationIds),
      };

      await updateHabit(updatedData);
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      await mutateOutbox('update_habit', updatedData);
    } catch (error: any) {
      console.error('Error toggling notification:', error);
      Alert.alert('Notification Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (habit?.color) {
        setActiveColor(habit.color);
      }
    }, [habit?.color, setActiveColor])
  );

  const habitTimesOfDay = useMemo(() => parseTimesOfDay(habit?.time_of_day), [habit?.time_of_day]);
  const parsedNotifyTimes = useMemo(() => parseNotifyTimes(habit?.notify_time), [habit?.notify_time]);
  const totalDailyTarget = useMemo(() => getHabitTotalReminders(habit), [habit]);

  const handleQuickTrackCurrentHabit = async () => {
    if (!habit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const totalMinutesToday = (habit.today_tracked_minutes || 0) + (habit.planned_time_minutes || 0);
    const currentCompletedCount = (habit.today_completed_count || 0) + 1;
    const isFullyDone = currentCompletedCount >= totalDailyTarget;

    const newNotificationIds = await refreshHabitNotifications(
      habit,
      totalMinutesToday,
      isFullyDone
    );

    const trackedResult = await trackHabit({
      habit_id: habit.id,
      actual_time_minutes: habit.planned_time_minutes ?? undefined,
      status: 'Completed',
      entry_date: new Date().toISOString(),
      notification_ids: JSON.stringify(newNotificationIds),
      note: '',
    });

    queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['habit_entries', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habit-dates', habitId] });
    await mutateOutbox('track_habit', trackedResult);
  };

  const handleQuickUntrackCurrentHabit = async () => {
    if (!habit) return;
    try {
      const result = await untrackHabitToday(habit.id);
      if (result) {
        const newNotificationIds = await refreshHabitNotifications(habit, 0, false);
        queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['habit_entries', habitId] });
        queryClient.invalidateQueries({ queryKey: ['habit-dates', habitId] });
        await mutateOutbox('delete_entry', result);
      }
    } catch (e) {
      console.error('Error untracking in detail screen:', e);
    }
  };

  // Parse target days
  const parsedTargetDays: number[] = useMemo(() => {
    if (!habit?.target_days) return [1, 2, 3, 4, 5];
    try {
      const days =
        typeof habit.target_days === 'string'
          ? JSON.parse(habit.target_days)
          : habit.target_days;
      return Array.isArray(days) ? days : [];
    } catch {
      return [];
    }
  }, [habit?.target_days]);

  // Formatted reminder time
  const formattedNotifyTime = useMemo(() => {
    if (!habit?.notify_time) return '07:30';
    const times = parseNotifyTimes(habit.notify_time);
    if (times.length === 0) return '07:30';
    const first = new Date(times[0]);
    if (isNaN(first.getTime())) return '07:30';
    const timeStr = first.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return times.length > 1 ? `${timeStr} (+${times.length - 1})` : timeStr;
  }, [habit?.notify_time]);

  if (isLoadingHabit) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[currentTheme].background }]}>
        <ActivityIndicator size="large" color={Colors[currentTheme].tint} />
      </View>
    );
  }

  if (isErrorHabit || !habit) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors[currentTheme].background }]}>
        <ThemedText className="text-xl font-pbold mb-2 text-center">
          {errorHabit?.message || 'Habit not found.'}
        </ThemedText>
        <Button title="Go Back" handlePress={() => router.replace('/habits')} />
      </View>
    );
  }

  const colorDef = getHabitColor(habit.color);
  const accentColor = colorDef.accent;

  // Colors for presentation
  const heroBg = isDark ? colorDef.pastelBgDark : colorDef.pastelBg;
  const contentBg = isDark ? '#18191B' : '#FFFFFF';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const pillInactiveBg = isDark ? 'rgba(255,255,255,0.06)' : '#F2F4F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Slider calculation
  const plannedMinutes = habit.planned_time_minutes || 0;
  const sliderPercent = Math.min(100, Math.max(8, (plannedMinutes / 120) * 100));

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Completed':
        return <TickIcon color={accentColor} size={18} />;
      case 'Skipped':
        return <SkipIcon color={Colors[currentTheme].icon} size={18} />;
      case 'Missed':
        return <CancelIcon color={Colors[currentTheme].icon} size={18} />;
      default:
        return <Text style={{ color: accentColor, fontFamily: FONTS.bold }}>•</Text>;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: heroBg }]}>
      {/* 1. TOP 35% HERO SECTION */}
      <View style={[styles.heroArea, { paddingTop: insets.top }]}>
        {/* Circular Back Button Top Left */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/habits');
            }
          }}
          style={[
            styles.floatingNavBtn,
            styles.backBtnPosition,
            {
              top: insets.top + (Platform.OS === 'ios' ? 8 : 16),
              backgroundColor: isDark ? 'rgba(30,30,35,0.85)' : '#FFFFFF',
            },
          ]}
        >
          <ChevronIcon direction="left" size={20} color={textColor} />
        </TouchableOpacity>

        {/* Circular Delete Button Top Right */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onDeleteHabit(habitId)}
          style={[
            styles.floatingNavBtn,
            styles.deleteBtnPosition,
            {
              top: insets.top + (Platform.OS === 'ios' ? 8 : 16),
              backgroundColor: isDark ? 'rgba(30,30,35,0.85)' : '#FFFFFF',
            },
          ]}
        >
          <BinIcon size={18} color="#EF4444" />
        </TouchableOpacity>

        {/* Hero Illustration / Icon Graphic */}
        <View style={styles.heroGraphicWrapper}>
          <View
            style={[
              styles.concentricOuterRing,
              { borderColor: `${accentColor}30` },
            ]}
          >
            <View
              style={[
                styles.concentricInnerCircle,
                {
                  backgroundColor: isDark ? '#232428' : '#FFFFFF',
                  borderColor: `${accentColor}50`,
                },
              ]}
            >
              {renderHabitIcon(habit.icon, accentColor, 46)}
            </View>
          </View>
        </View>
      </View>

      {/* 2. BOTTOM 65% CONTENT CARD */}
      <View style={[styles.bottomSheetContainer, { backgroundColor: contentBg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER & INFO SECTION */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={2}
                style={[styles.habitName, { color: textColor }]}
              >
                {habit.name}
              </Text>

              {/* Circular Edit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/habits/edit?id=${id}`);
                }}
                style={[
                  styles.editButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#F2F4F7',
                  },
                ]}
              >
                <EditIcon size={18} color={accentColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.createdDateText, { color: mutedColor }]}>
              Created On: {formatCreatedDate(habit.created_at)}
            </Text>

            {habit.description ? (
              <Text style={[styles.descriptionText, { color: mutedColor }]}>
                {habit.description}
              </Text>
            ) : null}
          </View>

          {/* 3. STREAK TILE */}
          <View
            style={[
              styles.streakTile,
              {
                backgroundColor: isDark ? '#232428' : '#F6F8FA',
                borderColor: borderColor,
              },
            ]}
          >
            {/* Left: Flame Icon with Overlapping Circular Badge */}
            <View style={styles.streakBadgeWrapper}>
              <View
                style={[
                  styles.streakIconBox,
                  { backgroundColor: `${accentColor}20` },
                ]}
              >
                <FlameIcon size={26} color={accentColor} />
              </View>

              <View
                style={[
                  styles.streakCountBadge,
                  { backgroundColor: accentColor },
                ]}
              >
                <Text style={styles.streakCountText}>
                  {habit.current_streak || 0}
                </Text>
              </View>
            </View>

            {/* Right: Text block */}
            <View style={styles.streakTextWrap}>
              <Text style={[styles.streakTitle, { color: textColor }]}>
                Streak
              </Text>
              <Text style={[styles.streakSubtitle, { color: mutedColor }]}>
                {habit.current_streak > 0
                  ? `${habit.current_streak} days in a row. ${STREAK_MESSAGES[habit.current_streak % STREAK_MESSAGES.length]}`
                  : "0 days in a row. Start your streak today!"}
              </Text>
            </View>
          </View>

          {/* 4. WEEKLY SCHEDULE (TARGET DAYS) */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Weekly Schedule
            </Text>

            <View style={styles.daysRow}>
              {WEEK_DAYS.map((d) => {
                const isActive = parsedTargetDays.includes(d.dayNumber);

                return (
                  <View
                    key={d.label}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? `${accentColor}25`
                            : `${accentColor}18`
                          : pillInactiveBg,
                        borderColor: isActive ? accentColor : borderColor,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        {
                          color: isActive
                            ? isDark
                              ? '#FFFFFF'
                              : '#11181C'
                            : mutedColor,
                          fontFamily: isActive ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 5. DAILY SCHEDULE (TIME PARTITION) */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Daily Schedule
            </Text>

            <View style={styles.dailyScheduleGrid}>
              {DAILY_SCHEDULE_OPTIONS.map((item) => {
                const isSelected = item.key === 'noon'
                  ? habitTimesOfDay.includes('afternoon')
                  : habitTimesOfDay.includes(item.key as any);

                return (
                  <View
                    key={item.key}
                    style={[
                      styles.dailyPillButton,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? `${accentColor}25`
                            : `${accentColor}15`
                          : pillInactiveBg,
                        borderColor: isSelected ? accentColor : borderColor,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dailyPillText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#FFFFFF'
                              : '#11181C'
                            : mutedColor,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 6. PROGRESS/GOAL SLIDER */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Planned Time (Minutes)
            </Text>

            <View style={styles.sliderContainer}>
              {/* Slider Track */}
              <View
                style={[
                  styles.sliderTrackBg,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#EAECF0',
                  },
                ]}
              >
                {/* Active Fill */}
                <View
                  style={[
                    styles.sliderTrackFill,
                    {
                      width: `${sliderPercent}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />

                {/* Slider Thumb */}
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      left: `${Math.max(0, Math.min(sliderPercent - 3, 93))}%`,
                      borderColor: accentColor,
                      backgroundColor: isDark ? '#232428' : '#FFFFFF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.sliderThumbDot,
                      { backgroundColor: accentColor },
                    ]}
                  />
                </View>
              </View>

              {/* Slider Value Label Below Thumb */}
              <View style={styles.sliderLabelsRow}>
                <Text style={[styles.sliderNumericValue, { color: accentColor }]}>
                  {plannedMinutes} min
                </Text>
                <Text style={[styles.sliderCapText, { color: mutedColor }]}>
                  Session target
                </Text>
              </View>
            </View>
          </View>

          {/* 7. REMINDER SECTION */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Reminders {parsedNotifyTimes.length > 1 ? `(${parsedNotifyTimes.length} daily)` : ''}
            </Text>

            <View
              style={[
                styles.reminderRow,
                {
                  backgroundColor: isDark ? '#232428' : '#F6F8FA',
                  borderColor: borderColor,
                },
              ]}
            >
              {/* Left: Time Pills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1, marginRight: 12 }}>
                {parsedNotifyTimes.length > 0 ? (
                  parsedNotifyTimes.map((timeStr, idx) => {
                    const d = new Date(timeStr);
                    const formatted = !isNaN(d.getTime())
                      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : timeStr;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.reminderTimePill,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : '#EAECEF',
                          },
                        ]}
                      >
                        <SunIcon size={14} color={accentColor} />
                        <Text style={[styles.reminderTimeText, { color: textColor }]}>
                          {formatted}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View
                    style={[
                      styles.reminderTimePill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : '#EAECEF',
                      },
                    ]}
                  >
                    <SunIcon size={16} color={accentColor} />
                    <Text style={[styles.reminderTimeText, { color: textColor }]}>
                      {formattedNotifyTime}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right: Native Switch */}
              <CustomSwitch
                value={habit.notify === 1}
                onValueChange={onToggleNotification}
                activeColor={accentColor}
              />
            </View>
          </View>

          {/* TODAY'S COMPLETION STATUS */}
          <View
            style={[
              styles.todayStatusCard,
              {
                backgroundColor: isDark ? '#232428' : '#F6F8FA',
                borderColor: borderColor,
              },
            ]}
          >
            <View style={styles.todayStatusLeft}>
              <Text style={[styles.todayStatusLabel, { color: mutedColor }]}>
                TODAY'S PROGRESS
              </Text>
              <Text style={[styles.todayStatusValue, { color: textColor }]}>
                {(habit.today_completed_count || 0) >= totalDailyTarget
                  ? `Completed for today! (${habit.today_completed_count}/${totalDailyTarget})`
                  : `${habit.today_completed_count || 0}/${totalDailyTarget} sessions completed`}
              </Text>
            </View>

            <CompletionIndicator
              isCompleted={(habit.today_completed_count || 0) >= totalDailyTarget}
              completedCount={habit.today_completed_count || 0}
              totalCount={totalDailyTarget}
              accentColor={accentColor}
              size={42}
              onTrack={handleQuickTrackCurrentHabit}
              onUntrack={handleQuickUntrackCurrentHabit}
            />
          </View>

          {/* 8. TRACK ACTIVITY ACTION BUTTON */}
          <View style={styles.trackActionSection}>
            <Button
              title="Track Activity"
              handlePress={() =>
                router.push(
                  `/habits/track?id=${id}&name=${encodeURIComponent(
                    habit.name
                  )}&frequency=${habit.frequency}&planned_time=${habit.planned_time_minutes
                  }&to=${id}`
                )
              }
              style={{ backgroundColor: accentColor, borderRadius: 18 }}
              textStyle={{ color: '#FFFFFF', fontFamily: FONTS.bold }}
            />
          </View>

          {/* 9. ACTIVITY HEATMAP */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              Activity
            </Text>

            {!isLoadingDates && completedDates?.length !== 0 ? (
              <Heatmap completedDates={completedDates} />
            ) : (
              <Text style={[styles.noActivityText, { color: mutedColor }]}>
                No completion history yet.
              </Text>
            )}
          </View>

          {/* 10. RECENT ENTRIES LIST */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: textColor }]}>
              History Logs
            </Text>

            {isLoadingActivity ? (
              <ActivityIndicator color={accentColor} size="small" />
            ) : activity?.length === 0 ? (
              <View style={styles.emptyActivityBox}>
                <Text style={[styles.noActivityText, { color: mutedColor }]}>
                  No activity logged yet. Tap "Track Activity" to begin.
                </Text>
              </View>
            ) : (
              activity.map((entry: any) => (
                <View
                  key={entry.id || entry.entry_date}
                  style={[
                    styles.historyItemRow,
                    {
                      backgroundColor: isDark ? '#232428' : '#F6F8FA',
                      borderColor: borderColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusCircle,
                      {
                        backgroundColor:
                          entry.status === 'Completed'
                            ? `${accentColor}20`
                            : 'rgba(150,150,150,0.15)',
                      },
                    ]}
                  >
                    {getStatusEmoji(entry.status || 'Missed')}
                  </View>

                  <View style={styles.entryTextWrap}>
                    <Text style={[styles.entryStatusText, { color: textColor }]}>
                      {entry.status}
                    </Text>
                    <Text style={[styles.entryDateText, { color: mutedColor }]}>
                      {entry?.entry_date
                        ? formatRelative(new Date(entry.entry_date), new Date())
                        : ''}
                    </Text>
                  </View>

                  {entry.actual_time_minutes ? (
                    <Text style={[styles.entryMinutesText, { color: accentColor }]}>
                      {entry.actual_time_minutes}m
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onDeleteEntry(entry.id)}
                    style={styles.trashEntryBtn}
                  >
                    <BinIcon size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // HERO SECTION
  heroArea: {
    height: '35%',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingNavBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  backBtnPosition: {
    left: 20,
  },
  deleteBtnPosition: {
    right: 20,
  },
  heroGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  concentricOuterRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  concentricInnerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  heroEmojiText: {
    fontSize: 46,
  },

  // BOTTOM SHEET
  bottomSheetContainer: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 6,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 110,
    gap: 22,
  },

  // HEADER & INFO
  headerSection: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  habitName: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    letterSpacing: -0.6,
    flex: 1,
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdDateText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  descriptionText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  // STREAK TILE
  streakTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  streakBadgeWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  streakIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  streakCountText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  streakTextWrap: {
    flex: 1,
    gap: 2,
  },
  streakTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  streakSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
  },

  // COMMON SECTION HEADINGS
  sectionBlock: {
    gap: 12,
  },
  sectionHeading: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },

  // WEEKLY SCHEDULE
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },

  // DAILY SCHEDULE (TIME PARTITION)
  dailyScheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dailyPillButton: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyPillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },

  // PROGRESS/GOAL SLIDER
  sliderContainer: {
    gap: 10,
    marginTop: 4,
  },
  sliderTrackBg: {
    height: 10,
    borderRadius: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 5,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sliderThumbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sliderNumericValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  sliderCapText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },

  // REMINDER
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  reminderTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  reminderTimeText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },

  // TODAY STATUS CARD
  todayStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  todayStatusLeft: {
    flex: 1,
    marginRight: 12,
  },
  todayStatusLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  todayStatusValue: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },

  // TRACK BUTTON
  trackActionSection: {
    marginTop: 4,
  },

  // ACTIVITY & LOGS
  noActivityText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyActivityBox: {
    paddingVertical: 16,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  statusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTextWrap: {
    flex: 1,
    gap: 2,
  },
  entryStatusText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  entryDateText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
  },
  entryMinutesText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    marginRight: 6,
  },
  trashEntryBtn: {
    padding: 6,
  },
});