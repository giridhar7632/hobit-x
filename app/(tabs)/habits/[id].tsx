import { formatRelative } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useMeridianMutation, useQuery, useQueryClient } from 'meridian-lite';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Heatmap from '@/components/heat-map';
import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/button';
import { getHabitColor } from '@/constants/habit-colors';
import {
  BellDisabledIcon,
  BellIcon,
  BinIcon,
  CalendarIcon,
  CancelIcon,
  ChevronIcon,
  ClockIcon,
  EditIcon,
  FlameIcon,
  renderHabitIcon,
  SkipIcon,
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
} from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { formatTimesOfDay, getHabitTotalReminders, parseNotifyTimes, refreshHabitNotifications } from '@/utils/notifications';
import { Habit, HabitEntry } from '@/utils/types';

function formatCreatedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function formatBackdateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export default function HabitScreen() {
  const { id } = useLocalSearchParams();
  const habitId = id?.toString() ?? '';
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';
  const { setActiveColor } = useAppTheme();

  const [backdateModalVisible, setBackdateModalVisible] = useState(false);
  const [pendingBackdate, setPendingBackdate] = useState<{ dateStr: string; displayDate: string } | null>(null);

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['habit_entries', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habit-dates', habitId] });
  };

  const onDeleteEntry = async (entry_id: string) => {
    if (!habitId) return;
    try {
      const result = await deleteEntry(entry_id, habitId);
      invalidateAll();
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
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (habit?.color) {
        setActiveColor(habit.color);
      }
    }, [habit, setActiveColor])
  );

  const parsedNotifyTimes = useMemo(() => parseNotifyTimes(habit?.notify_time), [habit?.notify_time]);
  const totalDailyTarget = useMemo(() => getHabitTotalReminders(habit), [habit]);

  const handleTrackToday = async () => {
    if (!habit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const totalMinutesToday = (habit.today_tracked_minutes || 0) + (habit.planned_time_minutes || 0);
    const currentCompletedCount = (habit.today_completed_count || 0) + 1;
    const isFullyDone = currentCompletedCount >= totalDailyTarget;

    const newNotificationIds = await refreshHabitNotifications(habit, totalMinutesToday, isFullyDone);

    const trackedResult = await trackHabit({
      habit_id: habit.id,
      actual_time_minutes: habit.planned_time_minutes ?? undefined,
      status: 'Completed',
      entry_date: new Date().toISOString(),
      notification_ids: JSON.stringify(newNotificationIds),
      note: '',
    });

    invalidateAll();
    await mutateOutbox('track_habit', trackedResult);
  };

  const handleUntrackToday = async () => {
    if (!habit) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await untrackHabitToday(habit.id);
      if (result) {
        await refreshHabitNotifications(habit, 0, false);
        invalidateAll();
        await mutateOutbox('delete_entry', result);
      }
    } catch (e: any) {
      console.error('Error untracking:', e);
      Alert.alert('Error', e?.message || 'Failed to untrack');
    }
  };

  const handleHeatmapDatePress = (dateStr: string, status: string | null, displayDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr > today) return;

    if (isToday(dateStr)) return;

    if (status === 'Completed') {
      Alert.alert(displayDate, '✅ You completed this habit on this day.');
      return;
    }

    if (status === 'Skipped') {
      Alert.alert(displayDate, '⏭ You skipped this habit on this day.');
      return;
    }

    setPendingBackdate({ dateStr, displayDate });
    setBackdateModalVisible(true);
  };

  const handleConfirmBackdate = async () => {
    if (!habit || !pendingBackdate) return;
    setBackdateModalVisible(false);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const trackedResult = await trackHabit({
        habit_id: habit.id,
        actual_time_minutes: habit.planned_time_minutes ?? undefined,
        status: 'Completed',
        entry_date: new Date(`${pendingBackdate.dateStr}T12:00:00.000Z`).toISOString(),
        note: 'Logged retroactively',
      });

      invalidateAll();
      await mutateOutbox('track_habit', trackedResult);
    } catch (e: any) {
      console.error('Backdate error:', e);
      Alert.alert('Error', e.message);
    }

    setPendingBackdate(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <TickIcon color={accentColor} size={16} />;
      case 'Skipped': return <SkipIcon color={Colors[currentTheme].icon} size={16} />;
      default: return <CancelIcon color={Colors[currentTheme].icon} size={16} />;
    }
  };

  if (isLoadingHabit) {
    return (
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: Colors[currentTheme].background }}
      >
        <ActivityIndicator size="large" color={Colors[currentTheme].tint} />
      </View>
    );
  }

  if (isErrorHabit || !habit) {
    return (
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: Colors[currentTheme].background }}
      >
        <ThemedText className="text-xl font-pbold mb-4 text-center">
          {(errorHabit as any)?.message || 'Habit not found.'}
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.replace('/habits')}
          className="p-3 rounded-[14px]"
          style={{ backgroundColor: Colors[currentTheme].tint }}
        >
          <Text className="font-pbold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colorDef = getHabitColor(habit.color);
  const accentColor = colorDef.accent;
  const heroBg = isDark ? colorDef.pastelBgDark : colorDef.pastelBg;
  const contentBg = isDark ? '#18191B' : '#FFFFFF';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? '#232428' : '#F6F8FA';

  const isFullyDoneToday = (habit.today_completed_count || 0) >= totalDailyTarget;

  const timesOfDayLabel = formatTimesOfDay(habit.time_of_day);
  const frequencyLabel =
    habit.frequency === 'daily'
      ? 'Every day'
      : habit.frequency === 'weekly'
        ? `${habit.target_days?.length ?? 5} days/week`
        : `Every ${habit.interval} days`;

  const goalLabel =
    habit.completion_type === 'time'
      ? `${habit.planned_time_minutes || 20} min`
      : habit.completion_type === 'quantity'
        ? `${habit.target_value || 10} ${habit.target_unit || 'units'}`
        : 'Check-off';

  const reminderLabel =
    habit.notify === 1 && parsedNotifyTimes.length > 0
      ? parsedNotifyTimes.length === 1
        ? new Date(parsedNotifyTimes[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : `${parsedNotifyTimes.length} daily reminders`
      : 'Off';

  const bottomPad = insets.bottom > 0 ? insets.bottom + 12 : 20;

  return (
    <View className="flex-1" style={{ backgroundColor: heroBg }}>
      <View
        className="h-[30%] min-h-[200px] justify-center items-center relative"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/habits');
          }}
          className="absolute w-11 h-11 rounded-full items-center justify-center shadow-sm z-10"
          style={{
            left: 20,
            top: insets.top + (Platform.OS === 'ios' ? 8 : 16),
            backgroundColor: isDark ? 'rgba(30,30,35,0.85)' : '#FFFFFF',
            elevation: 3,
            shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8
          }}
        >
          <ChevronIcon direction="left" size={20} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onDeleteHabit(habitId)}
          className="absolute w-11 h-11 rounded-full items-center justify-center shadow-sm z-10"
          style={{
            right: 20,
            top: insets.top + (Platform.OS === 'ios' ? 8 : 16),
            backgroundColor: isDark ? 'rgba(30,30,35,0.85)' : '#FFFFFF',
            elevation: 3,
            shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8
          }}
        >
          <BinIcon size={18} color="#EF4444" />
        </TouchableOpacity>

        <View className="items-center justify-center">
          <View
            className="w-[132px] h-[132px] rounded-full border-2 items-center justify-center"
            style={{ borderColor: `${accentColor}30` }}
          >
            <View
              className="w-24 h-24 rounded-full border-[1.5px] items-center justify-center"
              style={{
                backgroundColor: isDark ? '#232428' : '#FFFFFF',
                borderColor: `${accentColor}50`,
                elevation: 3,
                shadowColor: '#000000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10
              }}
            >
              {renderHabitIcon(habit.icon, accentColor, 46)}
            </View>
          </View>
        </View>
      </View>

      <View
        className="flex-1 rounded-t-[32px] -mt-7 overflow-hidden"
        style={{
          backgroundColor: contentBg,
          elevation: 6,
          shadowColor: '#000000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: -4 }, shadowRadius: 16
        }}
      >
        <ScrollView
          contentContainerClassName="px-5 pt-6 gap-5"
          contentContainerStyle={{ paddingBottom: bottomPad + 88 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start gap-3">
            <View className="flex-1 gap-1">
              <Text
                numberOfLines={2}
                className="font-pbold text-[26px] tracking-[-0.5px]"
                style={{ color: textColor }}
              >
                {habit.name}
              </Text>
              {habit.description ? (
                <Text className="font-pregular text-[13px] leading-[19px]" style={{ color: mutedColor }}>
                  {habit.description}
                </Text>
              ) : (
                <Text className="font-pregular text-[13px] leading-[19px]" style={{ color: mutedColor }}>
                  Since {formatCreatedDate(habit.created_at)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/habits/edit?id=${id}`);
              }}
              className="w-[38px] h-[38px] rounded-full items-center justify-center mt-1"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F4F7' }}
            >
              <EditIcon size={17} color={accentColor} />
            </TouchableOpacity>
          </View>

          <View
            className="flex-row items-center p-4 rounded-[22px] border gap-4 shadow-sm"
            style={{
              backgroundColor: isDark ? '#232428' : '#F6F8FA',
              borderColor: borderColor,
              elevation: 1,
            }}
          >
            <View className="relative w-[52px] h-[52px]">
              <View
                className="w-[52px] h-[52px] rounded-[18px] items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <FlameIcon size={26} color={accentColor} />
              </View>

              <View
                className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] rounded-full px-[5px] items-center justify-center border-2"
                style={{
                  backgroundColor: accentColor,
                  borderColor: isDark ? '#232428' : '#F6F8FA',
                }}
              >
                <Text className="font-pbold text-white text-[11px]">
                  {habit.current_streak || 0}
                </Text>
              </View>
            </View>

            <View className="flex-1 gap-0.5">
              <Text
                className="font-pbold text-base tracking-[-0.2px]"
                style={{ color: textColor }}
              >
                Streak
              </Text>
              <Text
                className="font-pregular text-[13px] leading-[18px]"
                style={{ color: mutedColor }}
              >
                {habit.current_streak > 0
                  ? `${habit.current_streak} days in a row. ${STREAK_MESSAGES[habit.current_streak % STREAK_MESSAGES.length]}`
                  : "0 days in a row. Start your streak today!"}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-pbold text-base tracking-[-0.3px]" style={{ color: textColor }}>Activity</Text>
              <Text className="font-pmedium text-xs" style={{ color: mutedColor }}>Tap a past day to log</Text>
            </View>

            {!isLoadingDates ? (
              <Heatmap
                completedDates={completedDates}
                onDayPress={handleHeatmapDatePress}
              />
            ) : (
              <ActivityIndicator color={accentColor} size="small" />
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/habits/edit?id=${id}`);
            }}
            className="rounded-[20px] border overflow-hidden py-1"
            style={{ backgroundColor: cardBg, borderColor }}
          >
            <View className="flex-row items-center px-3.5 py-3 gap-3">
              <View
                className="w-[30px] h-[30px] rounded-[10px] items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <CalendarIcon size={15} color={accentColor} />
              </View>
              <View className="flex-1">
                <Text className="font-pbold text-[10px] tracking-[0.7px] mb-0.5" style={{ color: mutedColor }}>SCHEDULE</Text>
                <Text className="font-psemibold text-[13px]" style={{ color: textColor }}>
                  {timesOfDayLabel} · {frequencyLabel}
                </Text>
              </View>
            </View>

            <View className="h-[1px] mx-3.5" style={{ backgroundColor: borderColor }} />

            <View className="flex-row items-center px-3.5 py-3 gap-3">
              <View
                className="w-[30px] h-[30px] rounded-[10px] items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <ClockIcon size={15} color={accentColor} />
              </View>
              <View className="flex-1">
                <Text className="font-pbold text-[10px] tracking-[0.7px] mb-0.5" style={{ color: mutedColor }}>TARGET</Text>
                <Text className="font-psemibold text-[13px]" style={{ color: textColor }}>{goalLabel}</Text>
              </View>
            </View>

            <View className="h-[1px] mx-3.5" style={{ backgroundColor: borderColor }} />

            <View className="flex-row items-center px-3.5 py-3 gap-3">
              <View
                className="w-[30px] h-[30px] rounded-[10px] items-center justify-center"
                style={{
                  backgroundColor: habit.notify === 1
                    ? `${accentColor}15`
                    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                }}
              >
                {habit.notify === 1
                  ? <BellIcon size={15} color={accentColor} />
                  : <BellDisabledIcon size={15} color={mutedColor} />
                }
              </View>
              <View className="flex-1">
                <Text className="font-pbold text-[10px] tracking-[0.7px] mb-0.5" style={{ color: mutedColor }}>REMINDER</Text>
                <Text className="font-psemibold text-[13px]" style={{ color: textColor }}>{reminderLabel}</Text>
              </View>
              <ChevronIcon direction="right" size={14} color={mutedColor} />
            </View>
          </TouchableOpacity>

          <View className="gap-3">
            <Text className="font-pbold text-base tracking-[-0.3px]" style={{ color: textColor }}>History</Text>

            {isLoadingActivity ? (
              <ActivityIndicator color={accentColor} size="small" />
            ) : activity.length === 0 ? (
              <Text className="font-pregular text-[13px] leading-[18px]" style={{ color: mutedColor }}>
                No entries yet. Track your first session!
              </Text>
            ) : (
              activity.slice(0, 12).map((entry: any) => (
                <View
                  key={entry.id || entry.entry_date}
                  className="flex-row items-center p-3 rounded-2xl border gap-2.5 mb-1.5"
                  style={{ backgroundColor: cardBg, borderColor }}
                >
                  <View
                    className="w-8 h-8 rounded-[10px] items-center justify-center"
                    style={{
                      backgroundColor: entry.status === 'Completed'
                        ? `${accentColor}18`
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    {getStatusIcon(entry.status || 'Missed')}
                  </View>

                  <View className="flex-1">
                    <Text className="font-pbold text-[13px]" style={{ color: textColor }}>{entry.status}</Text>
                    <Text className="font-pregular text-[11px] mt-[1px]" style={{ color: mutedColor }}>
                      {entry?.entry_date
                        ? formatRelative(new Date(entry.entry_date), new Date())
                        : ''}
                      {entry.note === 'Logged retroactively' ? ' · retroactive' : ''}
                    </Text>
                  </View>

                  {entry.actual_time_minutes ? (
                    <Text className="font-pbold text-xs mr-1" style={{ color: accentColor }}>
                      {entry.actual_time_minutes}m
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onDeleteEntry(entry.id)}
                    className="p-1.5"
                  >
                    <BinIcon size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 pt-3 px-5 border-t"
          style={{
            paddingBottom: bottomPad,
            backgroundColor: contentBg,
            borderTopColor: borderColor,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={isFullyDoneToday ? handleUntrackToday : handleTrackToday}
            className="flex-row items-center justify-center gap-2.5 py-4 rounded-[18px]"
            style={{
              backgroundColor: isFullyDoneToday
                ? (isDark ? 'rgba(255,255,255,0.08)' : '#F2F4F7')
                : accentColor,
            }}
          >
            {isFullyDoneToday ? (
              <>
                <TickIcon size={18} color={mutedColor} />
                <Text className="font-pbold text-base tracking-[-0.2px]" style={{ color: mutedColor }}>
                  Completed today · Undo
                </Text>
              </>
            ) : (
              <>
                <TickIcon size={18} color="#FFFFFF" />
                <Text className="font-pbold text-base tracking-[-0.2px]" style={{ color: '#FFFFFF' }}>
                  {(habit.today_completed_count || 0) > 0
                    ? `Track Again · ${habit.today_completed_count || 0}/${totalDailyTarget} done`
                    : 'Mark as Done'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={backdateModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setBackdateModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setBackdateModalVisible(false)}
          className="flex-1 bg-black/50 items-center justify-end pb-7 px-4"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => { }}>
            <View
              className="w-full rounded-[28px] p-6 items-center gap-2.5"
              style={{
                backgroundColor: contentBg,
                shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: -4 }, shadowRadius: 20, elevation: 20
              }}
            >
              <View
                className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-1"
                style={{ backgroundColor: `${accentColor}18` }}
              >
                <CalendarIcon size={28} color={accentColor} />
              </View>

              <Text className="font-pbold text-xl tracking-[-0.4px]" style={{ color: textColor }}>Log Past Day</Text>
              <Text className="font-pbold text-[15px]" style={{ color: accentColor }}>
                {pendingBackdate ? formatBackdateLabel(pendingBackdate.dateStr) : ''}
              </Text>

              <Text className="font-pregular text-sm leading-[21px] text-center mt-1 mb-2" style={{ color: mutedColor }}>
                Did you complete this habit?
                {'\n\n'}
                <Text className="font-pbold" style={{ color: textColor }}>
                  Note:{' '}
                </Text>
                Your current streak won&apos;t change.
              </Text>

              <Button
                variant='accent'
                accentColor={accentColor}
                title='Yes, Log It'
                onPress={handleConfirmBackdate}
              />
              <Button
                variant='ghost'
                title='Cancel'
                onPress={() => {
                  setBackdateModalVisible(false);
                  setPendingBackdate(null);
                }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}