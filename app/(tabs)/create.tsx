import { useMeridianMutation, useQueryClient } from "meridian-lite";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CustomAlert as Alert } from "@/utils/custom-alert";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DurationSelector } from "@/components/duration";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CustomTimePicker } from "@/components/time-picker";
import Button from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import { CustomActionSheetPicker } from "@/components/ui/picker";
import { CustomSwitch } from "@/components/ui/switch";
import { HABIT_COLORS, PASTEL_PALETTE } from "@/constants/habit-colors";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { createHabit } from "@/utils/actions";
import { refreshHabitNotifications } from "@/utils/notifications";
import { getBasePoints } from "@/utils/points";

const WEEK_DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly (Specific Days)', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function CreateScreen() {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notifyTimes, setNotifyTimes] = useState<Date[]>([
    (() => {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      return d;
    })(),
  ]);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";
  const { setActiveColor, resetColor } = useAppTheme();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      planned_time_minutes: "",
      frequency: "weekly",
      color: "lime", // Changed default to lime
      target_days: [1, 2, 3, 4, 5],
      interval: 1,
      notify: false,
    },
  });

  const frequencyWatch = watch("frequency");
  const selectedColorId = watch("color");
  const selectedTheme = HABIT_COLORS[selectedColorId] || HABIT_COLORS.lime;

  useEffect(() => {
    setActiveColor(selectedColorId);
  }, [selectedColorId, setActiveColor]);

  useFocusEffect(
    useCallback(() => {
      return () => resetColor();
    }, [resetColor])
  );

  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: mutateCreateHabit } = useMeridianMutation({
    invalidateKeys: [["habits"]],
  });

  const handleAddTime = () => {
    if (notifyTimes.length >= 5) {
      Alert.alert("Limit Reached", "You can set up to 5 reminders per habit.");
      return;
    }
    setEditingTimeIndex(null);
    setShowTimePicker(true);
  };

  const handleRemoveTime = (indexToRemove: number) => {
    if (notifyTimes.length <= 1) {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      setNotifyTimes([d]);
      setValue("notify", false);
    } else {
      setNotifyTimes(notifyTimes.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const onCreateTodo = async (formData: any) => {
    setIsCreating(true);
    try {
      let points = 15;
      try {
        points = await getBasePoints(formData.name, Number(formData.planned_time_minutes));
      } catch (error) {
        console.log("Error getting AI points, falling back to 15.");
      }

      const formattedNotifyTime = formData.notify
        ? JSON.stringify(notifyTimes.map(d => d.toISOString()))
        : null;

      const notificationIds = await refreshHabitNotifications(
        {
          ...formData,
          notification_ids: "[]",
          notify_time: formattedNotifyTime,
        },
        0
      );

      // 1. Optimistic write to local SQLite database
      const newHabit = await createHabit({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        frequency: formData.frequency,
        planned_time_minutes: Number(formData.planned_time_minutes),
        interval: Number(formData.interval),
        target_days: JSON.stringify(formData.target_days),
        notify: formData.notify ? 1 : 0,
        notify_time: formattedNotifyTime,
        start_date: new Date().toISOString(),
        base_points: points,
        notification_ids: JSON.stringify(notificationIds)
      });

      // 2. Refresh local queries & reset form
      reset();
      queryClient.invalidateQueries({ queryKey: ["habits"] });

      // 3. Enqueue to Meridian Lite outbox for cloud sync
      await mutateCreateHabit("create_habit", newHabit);

      // 4. Navigate to details
      router.push(`/habits/${newHabit.id}`);
    } catch (error: any) {
      console.error("Error creating habit:", error);
      Alert.alert("Error creating habit:", error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 110, paddingTop: 16 }}>
        <ThemedView className="flex-1 flex-col space-y-4 p-4" style={{ backgroundColor: 'transparent' }}>

          <View className="flex-row justify-between items-center mb-4">
            <ThemedText className="text-3xl font-pbold">New Habit</ThemedText>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/habits')}>
              <Text className="text-base font-pmedium opacity-60" style={{ color: selectedTheme.accent }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name & Description */}
          <Controller
            control={control}
            name="name"
            rules={{ required: "Habit name is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                handleBlur={onBlur}
                handleChangeText={onChange}
                value={value}
                label="Habit name"
                placeholder="e.g., Read a book"
                error={errors.name?.message as string}
                accentColor={selectedTheme.accent}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                handleBlur={onBlur}
                handleChangeText={onChange}
                value={value}
                label="Description (Optional)"
                placeholder="A short and sweet description"
                error={errors.description?.message as string}
                accentColor={selectedTheme.accent}
              />
            )}
          />

          {/* Frequency Type */}
          <View className="mx-4 mt-4">
            <ThemedText className="text-sm opacity-70 mb-2 ml-1">Frequency</ThemedText>
            <Controller
              control={control}
              name="frequency"
              render={({ field: { onChange, value } }) => (
                <CustomActionSheetPicker
                  label="Frequency"
                  value={value}
                  options={FREQUENCY_OPTIONS}
                  onValueChange={onChange}
                  accentColor={selectedTheme.accent}
                />
              )}
            />
          </View>

          {/* Target Days (Week of Dots) */}
          {frequencyWatch !== "monthly" && (
            <View className="mx-4 mt-4">
              <ThemedText className="text-sm opacity-70 mb-3">Target Days</ThemedText>
              <Controller
                control={control}
                name="target_days"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row justify-between items-center">
                    {WEEK_DAYS.map((day) => {
                      const isActive = value.includes(day.value);

                      return (
                        <TouchableOpacity
                          key={day.label + day.value}
                          onPress={() => {
                            if (isActive) {
                              onChange(value.filter((v: number) => v !== day.value));
                            } else {
                              onChange([...value, day.value]);
                            }
                          }}
                          style={{
                            backgroundColor: currentTheme === 'dark'
                              ? (isActive ? `${selectedTheme.accent}40` : 'transparent')
                              : (isActive ? selectedTheme.hex : 'transparent'),
                            borderColor: currentTheme === 'dark'
                              ? (isActive ? selectedTheme.accent : '#404040')
                              : (isActive ? `${selectedTheme.accent}40` : '#d4d4d8'),
                            borderWidth: isActive ? (currentTheme === 'dark' ? 2 : 3) : 1,
                          }}
                          className="w-10 h-10 rounded-full items-center justify-center"
                        >
                          <Text style={{ zIndex: 1, color: isActive ? selectedTheme.accent : (currentTheme === 'dark' ? selectedTheme.hex : selectedTheme.accent) }} className="font-pbold text-sm">
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          )}

          {/* Repeat Interval */}
          <View className="mx-4 mt-4 flex-row items-center justify-between">
            <ThemedText className="text-sm opacity-70">Repeat every</ThemedText>
            <Controller
              control={control}
              name="interval"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => onChange(Math.max(1, value - 1))}
                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
                  >
                    <Text className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>-</Text>
                  </TouchableOpacity>

                  <ThemedText className="font-pbold text-lg">{value}</ThemedText>

                  <TouchableOpacity
                    onPress={() => onChange(value + 1)}
                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
                  >
                    <Text className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>+</Text>
                  </TouchableOpacity>

                  <ThemedText className="text-sm opacity-70 w-12">
                    {frequencyWatch === 'daily' ? 'days' : frequencyWatch === 'monthly' ? 'months' : 'weeks'}
                  </ThemedText>
                </View>
              )}
            />
          </View>

          {/* Planned Time */}
          <View className="mx-4 mt-4">
            <ThemedText className="text-sm opacity-70 mb-2 ml-1">Planned time</ThemedText>
            <Controller
              control={control}
              name="planned_time_minutes"
              rules={{ required: "Please select a duration" }}
              render={({ field: { onChange, value } }) => (
                <DurationSelector
                  value={value}
                  onChange={onChange}
                  accentColor={selectedTheme.accent}
                />
              )}
            />
            {errors.planned_time_minutes && (
              <ThemedText className="text-red-500 text-xs mt-2 ml-1">
                {errors.planned_time_minutes.message as string}
              </ThemedText>
            )}
          </View>

          {/* Notifications */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">

            <View className="flex-row items-center justify-between">
              <ThemedText className="text-base font-pmedium">Enable Notifications</ThemedText>
              <Controller
                control={control}
                name="notify"
                render={({ field: { onChange, value } }) => (
                  <CustomSwitch
                    value={value}
                    onValueChange={onChange}
                    activeColor={selectedTheme.accent}
                  />
                )}
              />
            </View>

            {watch("notify") && (
              <View className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <ThemedText className="text-sm font-pmedium dark:text-gray-300">Reminders</ThemedText>
                    <ThemedText className="text-xs opacity-50 mt-0.5">Alerts fire 5 min before planned time</ThemedText>
                  </View>
                  {notifyTimes.length < 5 ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleAddTime}
                      className="px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5"
                      style={{
                        backgroundColor: `${selectedTheme.accent}15`,
                        borderColor: `${selectedTheme.accent}30`,
                        borderWidth: 1
                      }}
                    >
                      <Text style={{ color: selectedTheme.accent }} className="font-pbold text-xs">
                        + Add Time
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg">
                      <Text className="text-[10px] font-pbold opacity-60">Max 5</Text>
                    </View>
                  )}
                </View>

                {/* List of reminder chips */}
                <View className="flex-row flex-wrap gap-2 pt-1">
                  {notifyTimes.map((time, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center rounded-xl border pl-3 pr-2 py-1.5 gap-2"
                      style={{
                        backgroundColor: `${selectedTheme.accent}10`,
                        borderColor: `${selectedTheme.accent}35`,
                        borderWidth: 1
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setEditingTimeIndex(idx);
                          setShowTimePicker(true);
                        }}
                      >
                        <ThemedText style={{ color: selectedTheme.accent }} className="font-psemibold text-sm">
                          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </TouchableOpacity>

                      {notifyTimes.length > 1 && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveTime(idx)}
                          className="w-5 h-5 rounded-full items-center justify-center bg-neutral-200 dark:bg-neutral-800 ml-1"
                        >
                          <Text className="text-neutral-600 dark:text-neutral-400 font-bold text-[10px]">✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            <CustomTimePicker
              visible={showTimePicker}
              onClose={() => {
                setShowTimePicker(false);
                setEditingTimeIndex(null);
              }}
              initialTime={editingTimeIndex !== null && notifyTimes[editingTimeIndex] ? notifyTimes[editingTimeIndex] : new Date()}
              onSave={(newTime) => {
                if (editingTimeIndex !== null) {
                  const updated = [...notifyTimes];
                  updated[editingTimeIndex] = newTime;
                  updated.sort((a, b) => a.getHours() * 60 + a.getMinutes() - (b.getHours() * 60 + b.getMinutes()));
                  setNotifyTimes(updated);
                } else {
                  const updated = [...notifyTimes, newTime];
                  updated.sort((a, b) => a.getHours() * 60 + a.getMinutes() - (b.getHours() * 60 + b.getMinutes()));
                  setNotifyTimes(updated);
                }
                setEditingTimeIndex(null);
                setShowTimePicker(false);
              }}
              accentColor={selectedTheme.accent}
            />

          </View>

          {/* Theme Color Picker */}
          <View className="mx-4 mt-4">
            <ThemedText className="text-sm opacity-70 mb-3 ml-1">Color Theme</ThemedText>
            <View className="flex-row justify-between items-center px-2">
              {PASTEL_PALETTE.map((item) => {
                const isSelected = selectedColorId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setValue("color", item.id)}
                    style={{
                      backgroundColor: currentTheme === 'dark' ? `${item.accent}70` : item.hex,
                      borderColor: isSelected ? `${item.accent}` : 'transparent',
                      borderWidth: 3
                    }}
                    className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? "scale-110" : ""}`}
                  />
                );
              })}
            </View>
          </View>

          <View className="w-full px-4 mt-6">
            <Button
              title={isCreating ? "Creating..." : "Create Habit"}
              handlePress={handleSubmit(onCreateTodo)}
              loading={isCreating}
              style={{ backgroundColor: selectedTheme.accent }}
            />
          </View>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}