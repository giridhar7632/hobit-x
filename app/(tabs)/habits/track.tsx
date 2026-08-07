import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/button";
import { HABIT_COLORS } from "@/constants/habit-colors";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { getHabitById, trackHabit } from "@/utils/actions";
import { refreshHabitNotifications } from "@/utils/notifications";
import { Habit } from "@/utils/types";

export default function TrackScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";
  const { activeColor } = useAppTheme();

  const [actualTime, setActualTime] = useState<number>(0);
  const [status, setStatus] = useState<'Completed' | 'Skipped'>('Completed');
  const [note, setNote] = useState("");

  const { data: habit, isLoading } = useQuery<Habit, Error>({
    queryKey: ["habit", id],
    queryFn: async () => {
      const habit = await getHabitById(id?.toString() ?? "");
      if (!habit) throw new Error("Habit not found");
      return habit;
    },
  });

  useEffect(() => {
    if (habit && actualTime === 0) {
      setActualTime(habit.planned_time_minutes || 0);
    }
  }, [habit]);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: trackHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit-dates", id] });
      router.back(); // Go back to the details screen
    },
    onError: (error: any) => {
      Alert.alert("Error logging habit:", error.message);
    },
  });

  const handleSave = async () => {
    const totalMinutesToday = actualTime;
    const newNotificationIds = await refreshHabitNotifications(habit as Habit, totalMinutesToday);

    await mutation.mutateAsync({
      habit_id: Number(id),
      actual_time_minutes: actualTime,
      status: status,
      entry_date: new Date().toISOString(),
      notification_ids: JSON.stringify(newNotificationIds),
      note: note.trim(),
    });
  };

  if (isLoading || !habit) {
    return (
      <SafeAreaView style={{ backgroundColor: Colors[currentTheme].background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={activeColor.accent} />
      </SafeAreaView>
    );
  }

  const theme = HABIT_COLORS[habit.color || "lime"] || HABIT_COLORS.lime;

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>

        {/* Drag indicator */}
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </View>

        {/* Themed Header */}
        <View className={`p-6 mt-4 rounded-3xl mb-8 ${theme.bg}`}>
          <Text className={`text-sm font-pbold uppercase tracking-widest opacity-60 mb-2 ${theme.text}`}>
            Detailed Log
          </Text>
          <Text className={`text-3xl font-pbold ${theme.text}`}>
            {habit.name}
          </Text>
        </View>

        {/* 1. Status Selection */}
        <ThemedText className="text-base font-pmedium opacity-70 mb-3">
          How did it go today?
        </ThemedText>
        <View className="flex-row gap-3 mb-8">
          <TouchableOpacity
            onPress={() => setStatus('Completed')}
            style={status === 'Completed' ? { backgroundColor: theme.accent } : {}}
            className={`flex-1 py-3 rounded-xl items-center border ${status === 'Completed' ? 'border-transparent' : 'border-neutral-300 dark:border-neutral-700'
              }`}
          >
            <Text className={`font-pbold ${status === 'Completed' ? 'text-white' : ''}`}
              style={status !== 'Completed' ? { color: Colors[currentTheme].text } : undefined}
            >
              ✓ Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatus('Skipped')}
            className={`flex-1 py-3 rounded-xl items-center border ${status === 'Skipped' ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-200 dark:bg-neutral-800' : 'border-neutral-300 dark:border-neutral-700'
              }`}
          >
            <Text className="font-pbold" style={{ color: Colors[currentTheme].text }}>
              ✗ Skipped
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Actual Time Stepper (Only show if completed) */}
        {status === 'Completed' && (
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3">
              <ThemedText className="text-base font-pmedium opacity-70">
                Time spent (minutes)
              </ThemedText>
              <ThemedText className="text-xs opacity-50">
                Planned: {habit.planned_time_minutes}m
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-2 border border-neutral-200 dark:border-neutral-800">
              <TouchableOpacity
                onPress={() => setActualTime(Math.max(1, actualTime - 5))}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${theme.accent}15` }}
              >
                <Text style={{ color: theme.accent }} className="text-2xl font-bold">−</Text>
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-3xl font-pbold" style={{ color: Colors[currentTheme].text }}>{actualTime}</Text>
                <Text className="text-xs opacity-40 font-pregular" style={{ color: Colors[currentTheme].text }}>min</Text>
              </View>

              <TouchableOpacity
                onPress={() => setActualTime(actualTime + 5)}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${theme.accent}15` }}
              >
                <Text style={{ color: theme.accent }} className="text-2xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. Notes / Journaling */}
        <ThemedText className="text-base font-pmedium opacity-70 mb-3">
          Add a note (Optional)
        </ThemedText>
        <TextInput
          multiline
          numberOfLines={4}
          placeholder="How did you feel? Any roadblocks?"
          placeholderTextColor={currentTheme === 'dark' ? '#737373' : '#a3a3a3'}
          value={note}
          onChangeText={setNote}
          className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-base font-pregular mb-8"
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          style={{
            color: currentTheme === 'dark' ? '#fff' : '#000',
            textAlignVertical: 'top',
            minHeight: 120
          }}
        />

        <Button
          title={mutation.isPending ? "Saving..." : "Save Log"}
          handlePress={handleSave}
          loading={mutation.isPending}
          style={{ backgroundColor: theme.accent }}
        />

      </ScrollView>
    </SafeAreaView>
  );
}