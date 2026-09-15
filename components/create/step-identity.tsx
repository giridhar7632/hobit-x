import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { IconPickerModal } from '@/components/create/icon-picker-modal';
import FormInput from '@/components/ui/form-input';
import { getContrastTextColor, HABIT_COLORS, PASTEL_PALETTE } from '@/constants/habit-colors';
import { renderHabitIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepIdentityProps {
  icon: string;
  onChangeIcon: (icon: string, color?: string) => void;
  name: string;
  onChangeName: (name: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  color: string;
  onChangeColor: (color: string) => void;
  onFocusName?: () => void;
  onFocusDescription?: () => void;
}

export function StepIdentity({
  icon,
  onChangeIcon,
  name,
  onChangeName,
  description,
  onChangeDescription,
  color,
  onChangeColor,
  onFocusName,
  onFocusDescription,
}: StepIdentityProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedTheme = HABIT_COLORS[color] || HABIT_COLORS.purple;

  return (
    <View className="px-5 gap-5">
      <View className="items-center my-1.5 gap-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            setIsIconPickerOpen(true);
          }}
          style={{
            backgroundColor: isDark
              ? selectedTheme.pastelBgDark
              : selectedTheme.pastelBg,
            borderColor: `${selectedTheme.accent}40`,
          }}
          className="w-[88px] h-[88px] rounded-[26px] border-[1.5px] items-center justify-center shadow-sm shadow-black/5"
        >
          {renderHabitIcon(icon || 'SparklesIcon', getContrastTextColor(selectedTheme.hex), 44)}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.selectionAsync();
            setIsIconPickerOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]"
        >
          <Text style={{ color: selectedTheme.accent }} className="font-pbold text-xs">
            Choose icon
          </Text>
        </TouchableOpacity>
      </View>

      <FormInput
        label="Habit name"
        required
        value={name}
        onChangeText={onChangeName}
        placeholder="What do you want to do?"
        accentColor={selectedTheme.accent}
        autoFocus={!name}
        maxLength={60}
        onFocus={onFocusName}
      />

      <FormInput
        label="Description"
        value={description}
        onChangeText={onChangeDescription}
        placeholder="Add a short description"
        accentColor={selectedTheme.accent}
        multiline={true}
        numberOfLines={2}
        maxLength={140}
        helperText="Optional"
        onFocus={onFocusDescription}
      />

      <View className="gap-2">
        <Text className="font-pbold text-sm text-neutral-900 dark:text-neutral-100 mb-1">
          Colour
        </Text>
        <View className="flex-row items-center justify-between px-2 py-1.5">
          {PASTEL_PALETTE.map((item) => {
            const isSelected = color === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChangeColor(item.id);
                }}
                style={{
                  backgroundColor: item.hex,
                  borderColor: isSelected ? item.accent : 'transparent',
                  borderWidth: isSelected ? 3 : 0,
                  transform: [{ scale: isSelected ? 1.15 : 1 }],
                }}
                className="w-9 h-9 rounded-full border-[3px]"
              />
            );
          })}
        </View>
      </View>

      <IconPickerModal
        visible={isIconPickerOpen}
        selectedIcon={icon}
        accentColor={selectedTheme.accent}
        onSelectIcon={(selectedIconName, selectedColor) => {
          onChangeIcon(selectedIconName, selectedColor);
          if (selectedColor) {
            onChangeColor(selectedColor);
          }
        }}
        onClose={() => setIsIconPickerOpen(false)}
      />
    </View>
  );
}

