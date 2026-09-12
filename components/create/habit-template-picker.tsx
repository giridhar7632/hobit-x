import * as Haptics from 'expo-haptics';
import { useQuery } from 'meridian-lite';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getHabitColor } from '@/constants/habit-colors';
import {
  HABIT_TEMPLATES,
  HabitTemplate,
  TEMPLATE_CATEGORIES,
} from '@/constants/habit-templates';
import { ChevronIcon, PlusIcon, renderHabitIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getHabits } from '@/utils/actions';

export interface HabitTemplatePickerProps {
  onSelectTemplate: (template: HabitTemplate) => void;
  onSelectCustom: () => void;
  accentColor?: string;
  showCustomOption?: boolean;
}

const ALL_CATEGORIES = ['All', ...TEMPLATE_CATEGORIES] as const;

export function HabitTemplatePicker({
  onSelectTemplate,
  onSelectCustom,
  accentColor = '#4655E0',
  showCustomOption = true,
}: HabitTemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  // Fetch existing habits to avoid showing already created ones
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: getHabits,
  });

  const existingHabitNames = useMemo(() => {
    if (!habits || !Array.isArray(habits)) return new Set<string>();
    return new Set(habits.map((h: any) => h.name?.trim().toLowerCase()));
  }, [habits]);

  // Filter templates by category and exclude already added
  const activeTemplates = useMemo(() => {
    return HABIT_TEMPLATES.filter((t) => {
      if (existingHabitNames.has(t.name.trim().toLowerCase())) return false;
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedCategory, existingHabitNames]);

  const getCategoryCount = (category: string) => {
    return HABIT_TEMPLATES.filter((t) => {
      if (existingHabitNames.has(t.name.trim().toLowerCase())) return false;
      if (category !== 'All' && t.category !== category) return false;
      return true;
    }).length;
  };

  return (
    <View className="w-full">
      {/* 1. HERO TOP ACTION: CREATE CUSTOM HABIT */}
      {showCustomOption && (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelectCustom();
            }}
            className="w-full flex-row items-center p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 mb-6 shadow-sm shadow-primary/5"
          >
            <View
              style={{ backgroundColor: '#4655E0' }}
              className="w-12 h-12 rounded-xl items-center justify-center mr-3.5 shadow-sm"
            >
              <PlusIcon size={22} color="#FFFFFF" />
            </View>

            <View className="flex-1 pr-2">
              <Text className="text-base font-pbold text-neutral-900 dark:text-neutral-100 mb-0.5">
                Create Custom Habit
              </Text>
              <Text className="text-xs font-pregular text-neutral-500 dark:text-neutral-400">
                Build your own ritual from scratch
              </Text>
            </View>

            <ChevronIcon direction="right" size={18} color="#4655E0" />
          </TouchableOpacity>

          {/* 2. SUBTLE SECTION DIVIDER */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-[1px] bg-black/5 dark:bg-white/10" />
            <Text className="px-3 text-[11px] font-psemibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              Or start with a template
            </Text>
            <View className="flex-1 h-[1px] bg-black/5 dark:bg-white/10" />
          </View>
        </>
      )}

      {/* 3. HORIZONTAL CATEGORY SELECTOR PILLS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
      >
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = getCategoryCount(cat);

          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat);
              }}
              style={{
                backgroundColor: isSelected
                  ? isDark
                    ? 'rgba(70, 85, 224, 0.25)'
                    : 'rgba(70, 85, 224, 0.12)'
                  : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                borderColor: isSelected ? '#4655E0' : 'transparent',
              }}
              className="px-4 py-2.5 rounded-full border items-center justify-center flex-row gap-1.5"
            >
              <Text
                style={{ color: isSelected ? '#4655E0' : textColor }}
                className={`text-xs ${isSelected ? 'font-pbold' : 'font-pmedium'}`}
              >
                {cat}
              </Text>
              <Text
                style={{
                  color: isSelected
                    ? '#4655E0'
                    : isDark
                      ? '#9BA1A6'
                      : '#687076',
                }}
                className="text-[10px] font-psemibold opacity-75"
              >
                ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. TEMPLATES LIST */}
      <View className="gap-3">
        {activeTemplates.length > 0 ? (
          activeTemplates.map((template) => {
            const colorDef = getHabitColor(template.color);
            const iconBg = isDark
              ? colorDef.pastelBgDark
              : colorDef.pastelBg;

            return (
              <TouchableOpacity
                key={template.id}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectTemplate(template);
                }}
                className="flex-row items-center p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1F2023] shadow-sm shadow-black/5"
              >
                <View
                  style={{ backgroundColor: iconBg }}
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3.5"
                >
                  {renderHabitIcon(template.icon, '#1C1C1E', 26)}
                </View>

                <View className="flex-1 pr-2">
                  <Text className="text-base font-psemibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                    {template.name}
                  </Text>
                  <Text
                    className="text-xs font-pregular text-neutral-500 dark:text-neutral-400"
                    numberOfLines={1}
                  >
                    {template.description}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: isDark
                      ? `${colorDef.accent}25`
                      : `${colorDef.accent}15`,
                  }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Text
                    style={{ color: colorDef.accent }}
                    className="text-lg font-pbold leading-none"
                  >
                    +
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="p-6 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-white/5">
            <Text className="text-2xl mb-2">✨</Text>
            <Text className="text-sm font-psemibold text-neutral-800 dark:text-neutral-200 text-center mb-1">
              All habits added
            </Text>
            <Text className="text-xs font-pregular text-neutral-500 dark:text-neutral-400 text-center">
              {selectedCategory === 'All'
                ? 'You have already added all available templates!'
                : `You have already added all habits from the ${selectedCategory} category.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
