import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useMeridianMutation, useQuery, useQueryClient } from 'meridian-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { dismissFirstHint, hasDismissedFirstHint } from '@/utils/onboarding';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlertProvider } from '@/components/custom-alert-provider';
import { HabitTimerScreen } from '@/components/habit-timer';
import { DateSelector } from '@/components/home/date-selector';
import { HabitCardView } from '@/components/home/habit-card-view';
import { HabitGridView } from '@/components/home/habit-grid-view';
import { HabitListView } from '@/components/home/habit-list-view';
import {
  VIEW_MODE_STORAGE_KEY,
  ViewMode,
  ViewModeMenu,
} from '@/components/home/view-mode-menu';
import { ThemedText } from '@/components/themed-text';
import { FONTS } from '@/constants/fonts';
import { HABIT_COLORS, getContrastTextColor } from '@/constants/habit-colors';
import { PlusIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getHabits,
  isHabitScheduledForDate,
  trackHabit,
  untrackHabitToday,
  updateHabitNotificationIds,
} from '@/utils/actions';
import {
  getHabitTotalReminders,
  refreshHabitNotifications,
} from '@/utils/notifications';
import { Habit } from '@/utils/types';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getGreeting(name?: string): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 || hour < 5) {
    timeGreeting = 'Good evening';
  }

  const title = name ? `${timeGreeting}, ${name}` : timeGreeting;
  const subtitle = 'Make each day count';

  return { greeting: title, subtitle };
}

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { resetColor, activeColor } = useAppTheme();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [timerHabit, setTimerHabit] = useState<any>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [showFirstHint, setShowFirstHint] = useState(false);
  const hasSyncedNotifications = useRef(false);

  // Check if first-time track hint has been dismissed
  useEffect(() => {
    hasDismissedFirstHint().then((dismissed) => {
      if (!dismissed) {
        setShowFirstHint(true);
      }
    });
  }, []);

  // Load persisted view mode on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (saved === 'list' || saved === 'grid' || saved === 'card') {
          setViewMode(saved);
        }
      } catch (e) {
        console.error('Failed to load view mode from storage', e);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetColor();
    }, [resetColor])
  );

  const habitsQueryKey = useMemo(() => ['habits'], []);

  const {
    data: habits,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: habitsQueryKey,
    queryFn: getHabits,
  });

  // Background notification sync
  useEffect(() => {
    if (habits && !hasSyncedNotifications.current) {
      hasSyncedNotifications.current = true;

      const silentlyRefreshNotifications = async () => {
        try {
          const habitsToNotify = habits.filter((h: any) => h.notify === 1);
          const todayISO = getTodayISO();

          for (const habit of habitsToNotify) {
            const isDone =
              (habit as Habit).last_completed_date?.startsWith(todayISO) ?? false;
            const newIds = await refreshHabitNotifications(
              habit,
              (habit as any).today_tracked_minutes || 0,
              isDone
            );

            await updateHabitNotificationIds({
              id: (habit as Habit).id,
              notification_ids: JSON.stringify(newIds),
            });
          }
        } catch (error) {
          console.error('Failed to background sync notifications:', error);
        }
      };

      silentlyRefreshNotifications();
    }
  }, [habits]);

  const queryClient = useQueryClient();

  const { mutate: mutateQuickTrack } = useMeridianMutation({
    invalidateKeys: [['habits']],
  });

  const handleQuickTrack = async (habit: any) => {
    if (showFirstHint) {
      setShowFirstHint(false);
      dismissFirstHint();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const totalMinutesToday =
      (habit.today_tracked_minutes || 0) + (habit.planned_time_minutes || 0);
    const currentCompletedCount = (habit.today_completed_count || 0) + 1;
    const totalReminders = getHabitTotalReminders(habit);
    const isFullyDone = currentCompletedCount >= totalReminders;

    const newNotificationIds = await refreshHabitNotifications(
      habit,
      totalMinutesToday,
      isFullyDone
    );

    const trackedResult = await trackHabit({
      habit_id: habit.id,
      actual_time_minutes: habit.planned_time_minutes,
      status: 'Completed',
      entry_date: new Date().toISOString(),
      notification_ids: JSON.stringify(newNotificationIds),
      note: '',
    });

    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['habit_entries', habit.id] });
    queryClient.invalidateQueries({ queryKey: ['habit-dates', habit.id] });

    await mutateQuickTrack('track_habit', trackedResult);
  };

  const handleUntrack = async (habit: any) => {
    if (showFirstHint) {
      setShowFirstHint(false);
      dismissFirstHint();
    }
    try {
      const result = await untrackHabitToday(habit.id);
      if (result) {
        const newNotificationIds = await refreshHabitNotifications(habit, 0, false);
        await updateHabitNotificationIds({
          id: habit.id,
          notification_ids: JSON.stringify(newNotificationIds),
        });

        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['habit_entries', habit.id] });
        queryClient.invalidateQueries({ queryKey: ['habit-dates', habit.id] });

        await mutateQuickTrack('delete_entry', result);
      }
    } catch (error) {
      console.error('Error untracking habit:', error);
    }
  };

  const handleOpenTimer = (habit: any) => {
    setTimerHabit(habit);
    setIsTimerVisible(true);
  };

  const handleCloseTimer = () => {
    setIsTimerVisible(false);
    setTimeout(() => {
      setTimerHabit(null);
    }, 400);
  };

  const isFullyCompletedToday = (habit: any) => {
    const total = getHabitTotalReminders(habit);
    const count = habit.today_completed_count ?? 0;
    return count >= total;
  };

  // Filter habits for the selected date
  const scheduledHabits = useMemo(() => {
    if (!habits) return [];
    return habits.filter((h) => isHabitScheduledForDate(h, selectedDate));
  }, [habits, selectedDate]);

  // Sort: incomplete first, then completed
  const sortedHabits = useMemo(() => {
    return scheduledHabits.slice().sort((a, b) => {
      const aDone = isFullyCompletedToday(a) ? 1 : 0;
      const bDone = isFullyCompletedToday(b) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aDate = a.last_completed_date || '';
      const bDate = b.last_completed_date || '';
      return bDate.localeCompare(aDate);
    });
  }, [scheduledHabits]);

  const completedCount = scheduledHabits.filter(isFullyCompletedToday).length;
  const totalCount = scheduledHabits.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Derive user name for greeting
  const displayName = useMemo(() => {
    if (!user) return undefined;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) return fullName.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return undefined;
  }, [user]);

  const { greeting, subtitle } = getGreeting(displayName);
  const themeColors = Colors[currentTheme];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Greeting & + New Habit */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text
              style={[
                styles.greetingTitle,
                { color: currentTheme === 'dark' ? '#FFFFFF' : '#11181C' },
              ]}
            >
              {greeting}
            </Text>
            <Text
              style={[
                styles.greetingSubtitle,
                { color: currentTheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' },
              ]}
            >
              {subtitle}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/create');
            }}
            style={[
              styles.newHabitBtn,
              {
                backgroundColor: activeColor.accent,
              },
            ]}
            className='h-16 rounded-[18px]'
          >
            <PlusIcon size={14} color={getContrastTextColor(activeColor.accent)} />
            <Text
              style={[
                styles.newHabitBtnText,
                { color: getContrastTextColor(activeColor.accent) },
              ]}
            >
              New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector Strip */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tintColor={themeColors.tint}
        />

        {/* Daily Progress Summary Bar */}
        {/*totalCount > 0 && (
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: currentTheme === 'dark' ? '#1E1F22' : '#FFFFFF',
                borderColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              },
            ]}
          >
            <View style={styles.progressTextRow}>
              <Text
                style={[
                  styles.progressLabel,
                  { color: currentTheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
                ]}
              >
                Daily Goal
              </Text>
              <Text
                style={[
                  styles.progressValue,
                  { color: currentTheme === 'dark' ? '#ECEDEE' : '#11181C' },
                ]}
              >
                {completedCount} of {totalCount} completed
              </Text>
            </View>

            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: currentTheme === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: themeColors.tint,
                  },
                ]}
              />
            </View>
          </View>
        )*/}

        {/* First-time Track Hint Banner */}
        {showFirstHint && totalCount > 0 && (
          <View
            style={[
              styles.firstHintBanner,
              {
                backgroundColor: currentTheme === 'dark' ? '#1B2433' : '#F0F7FF',
                borderColor: currentTheme === 'dark' ? '#2563EB40' : '#BAE6FD',
              },
            ]}
          >
            <View style={styles.firstHintTextWrap}>
              <Text
                style={[
                  styles.firstHintTitle,
                  { color: currentTheme === 'dark' ? '#93C5FD' : '#0284C7' },
                ]}
              >
                💡 Tap the circle when you're done
              </Text>
              <Text
                style={[
                  styles.firstHintDesc,
                  { color: currentTheme === 'dark' ? '#CBD5E1' : '#475569' },
                ]}
              >
                Mark your habit session as completed to start building your streak!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowFirstHint(false);
                dismissFirstHint();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.firstHintCloseBtn}
            >
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 15,
                  color: currentTheme === 'dark' ? '#94A3B8' : '#64748B',
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Habits Section Header (Title & View Switcher) */}
        {totalCount > 0 && !isLoading && !isError && (
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Text
                style={[
                  styles.sectionHeadingText,
                  { color: currentTheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' },
                ]}
              >
                HABITS
              </Text>
              <Text
                style={[
                  styles.sectionCountText,
                  { color: currentTheme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' },
                ]}
              >
                · {totalCount}
              </Text>
            </View>

            <ViewModeMenu
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              tintColor={activeColor.accent}
            />
          </View>
        )}

        {/* Main Habits Content Area */}
        <View style={styles.habitsArea}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={themeColors.tint} size="large" />
            </View>
          ) : isError ? (
            <ThemedText type="default" style={styles.errorText}>
              {error?.message}
            </ThemedText>
          ) : totalCount === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <ThemedText style={styles.emptyTitle}>
                {habits && habits.length > 0 ? 'No habits for this day' : 'Start your journey'}
              </ThemedText>
              <ThemedText style={styles.emptyDesc}>
                {habits && habits.length > 0
                  ? 'None of your habits are scheduled for this day. Relax and recharge!'
                  : 'Create your first habit to begin building your daily rituals.'}
              </ThemedText>
              {(!habits || habits.length === 0) && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(tabs)/create');
                  }}
                  style={[styles.emptyCreateBtn, { backgroundColor: activeColor.accent }]}
                >
                  <PlusIcon size={16} color={getContrastTextColor(activeColor.accent)} />
                  <Text
                    style={[
                      styles.emptyCreateBtnText,
                      { color: getContrastTextColor(activeColor.accent) },
                    ]}
                  >
                    Create First Habit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {viewMode === 'list' && (
                <HabitListView
                  habits={sortedHabits}
                  onPressHabit={(h) => router.push(`/habits/${h.id}`)}
                  onTrackHabit={handleQuickTrack}
                  onUntrackHabit={handleUntrack}
                  onTimerPress={handleOpenTimer}
                  isFullyCompleted={isFullyCompletedToday}
                />
              )}

              {viewMode === 'grid' && (
                <HabitGridView
                  habits={sortedHabits}
                  onPressHabit={(h) => router.push(`/habits/${h.id}`)}
                  onTrackHabit={handleQuickTrack}
                  onUntrackHabit={handleUntrack}
                  onTimerPress={handleOpenTimer}
                  isFullyCompleted={isFullyCompletedToday}
                />
              )}

              {viewMode === 'card' && (
                <HabitCardView
                  habits={sortedHabits}
                  onPressHabit={(h) => router.push(`/habits/${h.id}`)}
                  onTrackHabit={handleQuickTrack}
                  onUntrackHabit={handleUntrack}
                  onTimerPress={handleOpenTimer}
                  isFullyCompleted={isFullyCompletedToday}
                />
              )}
            </>
          )}
        </View>

        {/* Timer Modal */}
        <Modal
          visible={isTimerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseTimer}
        >
          {timerHabit && (
            <CustomAlertProvider
              overrideTheme={HABIT_COLORS[timerHabit.color] || HABIT_COLORS.purple}
            >
              <HabitTimerScreen habit={timerHabit} onClose={handleCloseTimer} />
            </CustomAlertProvider>
          )}
        </Modal>
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
    marginBottom: 4,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  greetingTitle: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    marginTop: 2,
  },
  progressCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 1,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  progressValue: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  habitsArea: {
    flex: 1,
  },
  centerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 40,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeadingText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  sectionCountText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  newHabitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  newHabitBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  emptyCreateBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  firstHintBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  firstHintTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  firstHintTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginBottom: 3,
  },
  firstHintDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  firstHintCloseBtn: {
    padding: 4,
  },
});