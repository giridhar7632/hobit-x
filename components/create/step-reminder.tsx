import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { StepSummary } from '@/components/create/step-summary';
import { CustomTimePicker } from '@/components/time-picker';
import FormInput from '@/components/ui/form-input';
import { CustomSwitch } from '@/components/ui/switch';
import { getContrastTextColor } from '@/constants/habit-colors';
import { ClockIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepReminderProps {
  notify: boolean;
  onChangeNotify: (notify: boolean) => void;
  notifyTime?: Date;
  notifyTimes?: Date[];
  onChangeNotifyTime?: (time: Date) => void;
  onChangeNotifyTimes?: (times: Date[]) => void;
  reminderMessage: string;
  onChangeReminderMessage: (msg: string) => void;
  name?: string;
  accentColor?: string;
  // Summary props for inline display when notify is false
  icon?: string;
  description?: string;
  color?: string;
  timeOfDay?: string;
  timesOfDay?: string[];
  frequency?: string;
  targetDays?: number[];
  interval?: number;
  completionType?: string;
  plannedMinutes?: number;
  targetValue?: number;
  targetUnit?: string;
  onJumpToStep?: (step: number) => void;
  onFocusReminderMessage?: () => void;
}

export function StepReminder({
  notify,
  onChangeNotify,
  notifyTime,
  notifyTimes,
  onChangeNotifyTime,
  onChangeNotifyTimes,
  reminderMessage,
  onChangeReminderMessage,
  name,
  accentColor = '#4655E0',
  icon = 'SparklesIcon',
  description,
  color = 'purple',
  timeOfDay,
  timesOfDay,
  frequency = 'daily',
  targetDays = [],
  interval = 1,
  completionType = 'check',
  plannedMinutes = 0,
  targetValue = 0,
  targetUnit = '',
  onJumpToStep,
  onFocusReminderMessage,
}: StepReminderProps) {
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  const dynamicSuggestions = useMemo(() => {
    const label = name?.trim() || 'your habit';
    return [
      `Time for ${label}!`,
      `Ready to focus on ${label}?`,
      `Keep your ${label} streak alive!`,
      `Small steps: ${label} time`,
    ];
  }, [name]);

  // Normalize notify times array
  const currentNotifyTimes: Date[] = useMemo(() => {
    if (notifyTimes && notifyTimes.length > 0) return notifyTimes;
    if (notifyTime) return [notifyTime];
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return [d];
  }, [notifyTimes, notifyTime]);

  const handleAddTime = () => {
    if (currentNotifyTimes.length >= 5) return;
    Haptics.selectionAsync();
    setEditingIndex(null);
    setIsTimePickerVisible(true);
  };

  const handleEditTime = (idx: number) => {
    Haptics.selectionAsync();
    setEditingIndex(idx);
    setIsTimePickerVisible(true);
  };

  const handleRemoveTime = (idxToRemove: number) => {
    Haptics.selectionAsync();
    if (currentNotifyTimes.length <= 1) {
      return;
    }
    const updated = currentNotifyTimes.filter((_, idx) => idx !== idxToRemove);
    if (onChangeNotifyTimes) {
      onChangeNotifyTimes(updated);
    }
    if (onChangeNotifyTime && updated[0]) {
      onChangeNotifyTime(updated[0]);
    }
  };

  const handleSaveTime = (newDate: Date) => {
    let updated: Date[];
    if (editingIndex !== null && editingIndex < currentNotifyTimes.length) {
      updated = currentNotifyTimes.map((d, idx) => (idx === editingIndex ? newDate : d));
    } else {
      updated = [...currentNotifyTimes, newDate];
    }
    updated.sort((a, b) => a.getHours() * 60 + a.getMinutes() - (b.getHours() * 60 + b.getMinutes()));

    if (onChangeNotifyTimes) {
      onChangeNotifyTimes(updated);
    }
    if (onChangeNotifyTime && updated[0]) {
      onChangeNotifyTime(updated[0]);
    }
    setIsTimePickerVisible(false);
    setEditingIndex(null);
  };

  return (
    <View className="px-5 gap-5">
      <View
        style={{
          borderColor: notify ? `${accentColor}50` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
        }}
        className="flex-row items-center justify-between p-4 rounded-2xl border bg-white dark:bg-[#1F2023] shadow-sm shadow-black/5"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeNotify(!notify);
          }}
          className="flex-1 pr-3 gap-0.5"
        >
          <Text className="font-pbold text-base text-neutral-900 dark:text-neutral-100">
            Enable Reminders
          </Text>
          <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
            Receive notifications to stay consistent
          </Text>
        </TouchableOpacity>

        <CustomSwitch
          value={notify}
          onValueChange={onChangeNotify}
          activeColor={accentColor}
          accessibilityLabel="Enable Reminders"
          testID="enable-reminders-switch"
        />
      </View>

      {notify ? (
        <View className="gap-5">
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
                REMINDER TIMES
              </Text>
              {currentNotifyTimes.length < 5 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAddTime}
                  style={{
                    borderColor: `${accentColor}50`,
                    backgroundColor: isDark
                      ? `${accentColor}18`
                      : `${accentColor}10`,
                  }}
                  className="px-2.5 py-1 rounded-xl border"
                >
                  <Text style={{ color: accentColor }} className="font-pbold text-xs">
                    + Add Time
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of Time Items */}
            <View className="gap-2">
              {currentNotifyTimes.map((dateObj, idx) => {
                const formattedTime = dateObj.toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });

                return (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between h-[50px] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 bg-white dark:bg-[#1F2023]"
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleEditTime(idx)}
                      className="flex-row items-center gap-2.5 flex-1"
                    >
                      <ClockIcon size={18} color={accentColor} />
                      <Text className="font-pbold text-base text-neutral-900 dark:text-neutral-100">
                        {formattedTime}
                      </Text>
                      <Text className="font-psemibold text-xs ml-1 text-neutral-400 dark:text-neutral-500">
                        (tap to change)
                      </Text>
                    </TouchableOpacity>

                    {currentNotifyTimes.length > 1 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveTime(idx)}
                        className="w-6 h-6 rounded-full items-center justify-center bg-black/[0.04] dark:bg-white/[0.06]"
                      >
                        <Text className="font-pbold text-xs text-neutral-400 dark:text-neutral-500">
                          ✕
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View className="gap-2.5">
            <FormInput
              label="NOTIFICATION MESSAGE"
              value={reminderMessage}
              onChangeText={onChangeReminderMessage}
              onFocus={onFocusReminderMessage}
              placeholder={name ? `Time for ${name}!` : "e.g. Time to build momentum!"}
              accentColor={accentColor}
              size="md"
              maxLength={80}
              helperText={
                reminderMessage.trim()
                  ? 'Custom message set for your reminder'
                  : "We'll dynamically select an encouraging nudge when it's time."
              }
            />

            <View className="flex-row flex-wrap gap-2 mt-1">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChangeReminderMessage('');
                }}
                style={{
                  backgroundColor: !reminderMessage.trim()
                    ? accentColor
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  borderColor: !reminderMessage.trim() ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                }}
                className="px-3 py-2 rounded-xl border"
              >
                <Text
                  style={{
                    color: !reminderMessage.trim()
                      ? getContrastTextColor(accentColor)
                      : textColor,
                  }}
                  className="font-psemibold text-xs"
                >
                  Dynamic (Auto)
                </Text>
              </TouchableOpacity>

              {dynamicSuggestions.map((sug) => {
                const isSelected = reminderMessage === sug;
                return (
                  <TouchableOpacity
                    key={sug}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (isSelected) {
                        onChangeReminderMessage('');
                      } else {
                        onChangeReminderMessage(sug);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? accentColor
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      borderColor: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    }}
                    className="px-3 py-2 rounded-xl border"
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? getContrastTextColor(accentColor)
                          : textColor,
                      }}
                      className="font-psemibold text-xs"
                    >
                      {sug}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View className="-mx-5">
          <StepSummary
            icon={icon}
            name={name || ''}
            description={description}
            color={color}
            timeOfDay={timeOfDay}
            timesOfDay={timesOfDay}
            frequency={frequency}
            targetDays={targetDays}
            interval={interval}
            completionType={completionType}
            plannedMinutes={plannedMinutes}
            targetValue={targetValue}
            targetUnit={targetUnit}
            notify={false}
            notifyTimes={currentNotifyTimes}
            reminderMessage=""
            accentColor={accentColor}
            onJumpToStep={onJumpToStep || (() => { })}
          />
        </View>
      )}

      <CustomTimePicker
        visible={isTimePickerVisible}
        onClose={() => {
          setIsTimePickerVisible(false);
          setEditingIndex(null);
        }}
        initialTime={
          editingIndex !== null && currentNotifyTimes[editingIndex]
            ? currentNotifyTimes[editingIndex]
            : new Date()
        }
        onSave={handleSaveTime}
        accentColor={accentColor}
      />
    </View>
  );
}
