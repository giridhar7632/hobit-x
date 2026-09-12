import { CustomAlert as Alert } from "@/utils/custom-alert";
import { router, useLocalSearchParams } from "expo-router";
import { useMeridianMutation, useQuery, useQueryClient } from "meridian-lite";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import { HABIT_COLORS } from "@/constants/habit-colors";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { getHabitById, trackHabit } from "@/utils/actions";
import { refreshHabitNotifications } from "@/utils/notifications";
import { Habit } from "@/utils/types";

function TrackForm({ habit }: { habit: Habit }) {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";

  const [actualTime, setActualTime] = useState<number>(() => habit.planned_time_minutes || 0);
  const [status, setStatus] = useState<'Completed' | 'Skipped'>('Completed');
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const { mutate: mutateOutbox } = useMeridianMutation({
    invalidateKeys: [["habits"], ["habit_entries", habit.id], ["habit-dates", habit.id]],
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const totalMinutesToday = actualTime;
      const isDone = status === 'Completed' || status === 'Skipped';
      const newNotificationIds = await refreshHabitNotifications(habit, totalMinutesToday, isDone);

      const trackedResult = await trackHabit({
        habit_id: habit.id,
        actual_time_minutes: actualTime,
        status: status,
        entry_date: new Date().toISOString(),
        notification_ids: JSON.stringify(newNotificationIds),
        note: note.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit_entries", habit.id] });
      queryClient.invalidateQueries({ queryKey: ["habit-dates", habit.id] });

      await mutateOutbox("track_habit", trackedResult);

      router.back();
    } catch (error: any) {
      Alert.alert("Error logging habit:", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const theme = HABIT_COLORS[habit.color || "purple"] || HABIT_COLORS.purple;

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}>
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </View>

        <View className={`p-6 mt-4 rounded-3xl mb-8 ${theme.bg}`}>
          <Text className={`text-sm font-pbold uppercase tracking-widest opacity-60 mb-2 ${theme.text}`}>
            Detailed Log
          </Text>
          <Text className={`text-3xl font-pbold ${theme.text}`}>
            {habit.name}
          </Text>
        </View>

        <ThemedText className="text-base font-pmedium opacity-70 mb-3">
          How did it go today?
        </ThemedText>
        <View className="flex-row gap-3 mb-8">
          <Button
            title="Completed"
            variant={status === 'Completed' ? 'accent' : 'outline'}
            accentColor={theme.accent}
            size="md"
            onPress={() => setStatus('Completed')}
            className="flex-1"
          />

          <Button
            title="Skipped"
            variant={status === 'Skipped' ? 'secondary' : 'outline'}
            size="md"
            onPress={() => setStatus('Skipped')}
            className="flex-1"
          />
        </View>

        {status === 'Completed' && (
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3">
              <ThemedText className="text-base font-pmedium opacity-70">
                Time spent (minutes)
              </ThemedText>
              <ThemedText className="text-xs opacity-50 font-pregular">
                Planned: {habit.planned_time_minutes}m
              </ThemedText>
            </View>

            <View className="flex-row items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-[18px] p-2 border border-neutral-200 dark:border-neutral-800">
              <TouchableOpacity
                onPress={() => setActualTime(Math.max(1, actualTime - 5))}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${theme.accent}15` }}
              >
                <Text style={{ color: theme.accent }} className="text-2xl font-pbold">−</Text>
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-3xl font-pbold" style={{ color: Colors[currentTheme].text }}>{actualTime}</Text>
                <Text className="text-xs opacity-40 font-pregular" style={{ color: Colors[currentTheme].text }}>min</Text>
              </View>

              <TouchableOpacity
                onPress={() => setActualTime(actualTime + 5)}
                className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center active:scale-95"
              >
                <Text style={{ color: theme.accent }} className="text-2xl font-pbold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mb-8">
          <FormInput
            label="Add a note (Optional)"
            multiline
            numberOfLines={4}
            placeholder="How did you feel? Any roadblocks?"
            value={note}
            onChangeText={setNote}
            accentColor={theme.accent}
          />
        </View>

        <Button
          title={isSaving ? "Saving..." : "Save Log"}
          variant="accent"
          accentColor={theme.accent}
          size="default"
          onPress={handleSave}
          loading={isSaving}
          className="w-full"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TrackScreen() {
  const { id } = useLocalSearchParams();
  const habitId = id?.toString() ?? "";
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";
  const { activeColor } = useAppTheme();

  const habitKey = useMemo(() => ["habit", habitId], [habitId]);

  const { data: habit, isLoading } = useQuery<Habit | null>({
    queryKey: habitKey,
    queryFn: async () => {
      const h = await getHabitById(habitId);
      if (!h) throw new Error("Habit not found");
      return h;
    },
  });

  if (isLoading || !habit) {
    return (
      <SafeAreaView style={{ backgroundColor: Colors[currentTheme].background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={activeColor.accent} />
      </SafeAreaView>
    );
  }

  return <TrackForm habit={habit} />;
}