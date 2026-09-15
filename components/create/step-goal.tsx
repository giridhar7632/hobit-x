import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getContrastTextColor } from '@/constants/habit-colors';
import { ClockIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepGoalProps {
  completionType: 'check' | 'time' | 'quantity';
  onChangeCompletionType: (type: 'check' | 'time' | 'quantity') => void;
  plannedMinutes: number;
  onChangePlannedMinutes: (mins: number) => void;
  targetValue: number;
  onChangeTargetValue: (val: number) => void;
  targetUnit: string;
  onChangeTargetUnit: (unit: string) => void;
  accentColor?: string;
  onFocusPlannedMinutes?: () => void;
  onFocusTargetValue?: () => void;
  onFocusTargetUnit?: () => void;
}

const TIME_SUGGESTIONS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
];

const UNIT_SUGGESTIONS = [
  'pages',
  'glasses',
  'steps',
  'reps',
  'km',
  'times',
];

export function StepGoal({
  completionType,
  onChangeCompletionType,
  plannedMinutes,
  onChangePlannedMinutes,
  targetValue,
  onChangeTargetValue,
  targetUnit,
  onChangeTargetUnit,
  accentColor = '#4655E0',
  onFocusPlannedMinutes,
  onFocusTargetValue,
  onFocusTargetUnit,
}: StepGoalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  const [customUnitMode, setCustomUnitMode] = useState(false);
  const isCustomUnit = customUnitMode || Boolean(targetUnit && !UNIT_SUGGESTIONS.includes(targetUnit));

  return (
    <View className="px-5 gap-5">
      <View className="gap-3">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeCompletionType('check');
          }}
          style={{
            backgroundColor:
              completionType === 'check'
                ? isDark
                  ? `${accentColor}20`
                  : `${accentColor}12`
                : isDark ? '#1F2023' : '#FFFFFF',
            borderColor: completionType === 'check' ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            borderWidth: completionType === 'check' ? 2 : 1,
          }}
          className="flex-row items-center p-4 rounded-2xl gap-3.5 shadow-sm shadow-black/5"
        >
          <View
            style={{
              backgroundColor:
                completionType === 'check'
                  ? accentColor
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
            }}
            className="w-11 h-11 rounded-2xl items-center justify-center"
          >
            <TickIcon
              size={18}
              color={completionType === 'check' ? getContrastTextColor(accentColor) : textColor}
            />
          </View>

          <View className="flex-1 gap-0.5">
            <Text
              style={{ color: textColor }}
              className={`text-base ${completionType === 'check' ? 'font-pbold' : 'font-psemibold'}`}
            >
              Just complete it
            </Text>
            <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
              Simply check it off when done
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeCompletionType('time');
            if (!plannedMinutes) onChangePlannedMinutes(20);
          }}
          style={{
            backgroundColor:
              completionType === 'time'
                ? isDark
                  ? `${accentColor}20`
                  : `${accentColor}12`
                : isDark ? '#1F2023' : '#FFFFFF',
            borderColor: completionType === 'time' ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            borderWidth: completionType === 'time' ? 2 : 1,
          }}
          className="flex-row items-center p-4 rounded-2xl gap-3.5 shadow-sm shadow-black/5"
        >
          <View
            style={{
              backgroundColor:
                completionType === 'time'
                  ? accentColor
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
            }}
            className="w-11 h-11 rounded-2xl items-center justify-center"
          >
            <ClockIcon
              size={18}
              color={completionType === 'time' ? getContrastTextColor(accentColor) : textColor}
            />
          </View>

          <View className="flex-1 gap-0.5">
            <Text
              style={{ color: textColor }}
              className={`text-base ${completionType === 'time' ? 'font-pbold' : 'font-psemibold'}`}
            >
              Track time
            </Text>
            <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
              Set a duration for this habit
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeCompletionType('quantity');
            if (!targetValue) onChangeTargetValue(10);
            if (!targetUnit) onChangeTargetUnit('pages');
          }}
          style={{
            backgroundColor:
              completionType === 'quantity'
                ? isDark
                  ? `${accentColor}20`
                  : `${accentColor}12`
                : isDark ? '#1F2023' : '#FFFFFF',
            borderColor: completionType === 'quantity' ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            borderWidth: completionType === 'quantity' ? 2 : 1,
          }}
          className="flex-row items-center p-4 rounded-2xl gap-3.5 shadow-sm shadow-black/5"
        >
          <View
            style={{
              backgroundColor:
                completionType === 'quantity'
                  ? accentColor
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
            }}
            className="w-11 h-11 rounded-2xl items-center justify-center"
          >
            <Text
              style={{
                color: completionType === 'quantity' ? getContrastTextColor(accentColor) : textColor,
              }}
              className="font-pblack text-lg"
            >
              #
            </Text>
          </View>

          <View className="flex-1 gap-0.5">
            <Text
              style={{ color: textColor }}
              className={`text-base ${completionType === 'quantity' ? 'font-pbold' : 'font-psemibold'}`}
            >
              Track quantity
            </Text>
            <Text className="font-pregular text-xs text-neutral-400 dark:text-neutral-500">
              Set a measurable target
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {completionType === 'check' && (
        <View className="flex-row items-center p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] gap-2.5 bg-black/[0.02] dark:bg-white/[0.03]">
          <TickIcon color={accentColor} size={18}></TickIcon>
          <Text className="font-pmedium text-sm flex-1 text-neutral-500 dark:text-neutral-400">
            Great! Simply check it off when you&apos;re done.
          </Text>
        </View>
      )}

      {completionType === 'time' && (
        <View className="gap-2.5 mt-1">
          <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 pl-1">
            HOW LONG?
          </Text>

          <View className="flex-row items-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 h-[52px] bg-white dark:bg-[#1F2023]">
            <TextInput
              value={String(plannedMinutes || '')}
              onChangeText={(text) => {
                const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
                onChangePlannedMinutes(isNaN(n) ? 0 : n);
              }}
              keyboardType="number-pad"
              className="font-pblack text-xl min-w-[50px] py-0 text-neutral-900 dark:text-neutral-100"
              placeholder="0"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
              maxLength={4}
              onFocus={onFocusPlannedMinutes}
            />
            <Text className="font-psemibold text-sm ml-2 text-neutral-400 dark:text-neutral-500">
              minutes
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-1">
            {TIME_SUGGESTIONS.map((s) => {
              const isSelected = Number(plannedMinutes) === s.value;
              return (
                <TouchableOpacity
                  key={s.label}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangePlannedMinutes(s.value);
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? accentColor
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    borderColor: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  }}
                  className="px-3.5 py-2 rounded-xl border"
                >
                  <Text
                    style={{ color: isSelected ? getContrastTextColor(accentColor) : textColor }}
                    className="font-psemibold text-xs"
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {completionType === 'quantity' && (
        <View className="gap-2.5 mt-1">
          <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 pl-1">
            TARGET & UNIT
          </Text>

          <View className="flex-row items-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 h-[52px] bg-white dark:bg-[#1F2023]">
            <TextInput
              value={String(targetValue || '')}
              onChangeText={(text) => {
                const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
                onChangeTargetValue(isNaN(n) ? 0 : n);
              }}
              keyboardType="number-pad"
              className="font-pblack text-xl min-w-[50px] py-0 text-neutral-900 dark:text-neutral-100"
              placeholder="0"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
              maxLength={5}
              onFocus={onFocusTargetValue}
            />
            <Text className="font-psemibold text-sm ml-2 text-neutral-400 dark:text-neutral-500">
              {targetUnit || 'units'}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-1">
            {UNIT_SUGGESTIONS.map((unit) => {
              const isSelected = targetUnit === unit && !isCustomUnit;
              return (
                <TouchableOpacity
                  key={unit}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCustomUnitMode(false);
                    onChangeTargetUnit(unit);
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? accentColor
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    borderColor: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  }}
                  className="px-3.5 py-2 rounded-xl border"
                >
                  <Text
                    style={{ color: isSelected ? getContrastTextColor(accentColor) : textColor }}
                    className="font-psemibold text-xs"
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                setCustomUnitMode(true);
              }}
              style={{
                backgroundColor: isCustomUnit
                  ? accentColor
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                borderColor: isCustomUnit ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
              }}
              className="px-3.5 py-2 rounded-xl border"
            >
              <Text
                style={{ color: isCustomUnit ? getContrastTextColor(accentColor) : textColor }}
                className="font-psemibold text-xs"
              >
                custom
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomUnit && (
            <TextInput
              value={targetUnit}
              onChangeText={onChangeTargetUnit}
              placeholder="e.g. chapters, reps, miles"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
              className="font-pmedium h-12 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 text-sm mt-1.5 bg-neutral-100 dark:bg-[#26272B] text-neutral-900 dark:text-neutral-100"
              maxLength={20}
              onFocus={onFocusTargetUnit}
            />
          )}
        </View>
      )}
    </View>
  );
}
