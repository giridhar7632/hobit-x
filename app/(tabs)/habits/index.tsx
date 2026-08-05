import { HabitCard } from "@/components/habit-card";
import { HabitTimerScreen } from "@/components/habit-timer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getHabits, trackHabit } from "@/utils/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { resetColor } = useAppTheme();

  const [timerHabit, setTimerHabit] = useState<any>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      resetColor();
    }, [resetColor])
  );

  const {
    data: habits,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["habits"],
    queryFn: getHabits,
  });

  const queryClient = useQueryClient();
  const quickTrackMutation = useMutation({
    mutationFn: trackHabit,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit_entries", variables.habit_id] });
      queryClient.invalidateQueries({ queryKey: ["habit-dates", variables.habit_id] });
    }
  });

  const handleQuickTrack = (habit: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    quickTrackMutation.mutate({
      habit_id: habit.id,
      actual_time_minutes: habit.planned_time_minutes,
      status: 'Completed',
      entry_date: new Date().toISOString(),
      note: "",
    });
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

  const todayISO = getTodayISO();
  const isCompletedToday = (habit: any) => habit.last_completed_date?.startsWith(todayISO);
  const completedCount = habits?.filter(isCompletedToday).length || 0;
  const totalCount = habits?.length || 0;

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}>
        <ThemedView className="flex-1 px-5" style={{ backgroundColor: 'transparent' }}>

          {/* Header */}
          <View className="mb-6">
            <ThemedText type="title" className="font-pbold">
              Today
            </ThemedText>
            <Text className="text-sm font-pregular opacity-50 mt-1" style={{ color: Colors[currentTheme].text }}>
              {formatDate()}
            </Text>
          </View>

          {/* Progress summary */}
          {totalCount > 0 && (
            <View
              className="rounded-2xl p-4 mb-5 flex-row items-center justify-between"
              style={{
                backgroundColor: currentTheme === 'dark' ? '#1c1c1e' : '#f5f5f4',
              }}
            >
              <View>
                <Text className="text-sm font-pregular opacity-60" style={{ color: Colors[currentTheme].text }}>
                  Progress
                </Text>
                <Text className="text-lg font-pbold mt-1" style={{ color: Colors[currentTheme].text }}>
                  {completedCount} of {totalCount} done
                </Text>
              </View>

              {/* Mini progress bar */}
              <View className="w-20 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    backgroundColor: '#84cc16',
                  }}
                />
              </View>
            </View>
          )}

          {/* Habits list */}
          <View>
            {isLoading ? (
              <View className="mt-10 items-center">
                <ActivityIndicator color={Colors[currentTheme].tint} size="large" />
              </View>
            ) : isError ? (
              <ThemedText type="default" className="text-center opacity-50 font-pmedium mt-10">
                {error.message}
              </ThemedText>
            ) : habits?.length === 0 ? (
              <View className="mt-16 items-center px-8">
                <Text className="text-5xl mb-4">🌱</Text>
                <ThemedText className="text-lg font-pbold text-center mb-2">
                  Start your journey
                </ThemedText>
                <ThemedText className="text-sm font-pregular text-center opacity-50">
                  Tap the + tab to create your first habit and begin building better routines.
                </ThemedText>
              </View>
            ) : (
              habits
                ?.slice()
                .sort((a: any, b: any) => {
                  const aDone = isCompletedToday(a) ? 1 : 0;
                  const bDone = isCompletedToday(b) ? 1 : 0;
                  if (aDone !== bDone) return aDone - bDone;
                  // Within the completed group, most recent first
                  const aDate = a.last_completed_date || '';
                  const bDate = b.last_completed_date || '';
                  return bDate.localeCompare(aDate);
                })
                .map((habit: any) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completedToday={isCompletedToday(habit)}
                    onPress={() => router.push(`/habits/${habit.id}`)}
                    onTrack={() => handleQuickTrack(habit)}
                    onTimerPress={() => handleOpenTimer(habit)}
                  />
                ))
            )}
          </View>
          <Modal
            visible={isTimerVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCloseTimer}
          >
            {timerHabit && (
              <HabitTimerScreen
                habit={timerHabit}
                onClose={handleCloseTimer}
              />
            )}
          </Modal>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}