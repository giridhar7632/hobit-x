import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronIcon, renderHabitIcon, SearchIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface IconCategory {
  title: string;
  icons: { icon: string; name: string }[];
}

const ICON_CATEGORIES: IconCategory[] = [
  {
    title: 'POPULAR',
    icons: [
      { icon: 'ActivityIcon', name: 'workout activity gym fitness' },
      { icon: 'BookIcon', name: 'reading book study literature' },
      { icon: 'HeartIcon', name: 'heart love care health' },
      { icon: 'MugIcon', name: 'water drink hydration coffee tea mug' },
      { icon: 'FlameIcon', name: 'streak fire motivation daily' },
      { icon: 'StarIcon', name: 'favorite top goal priority star' },
    ],
  },
  {
    title: 'MIND & FOCUS',
    icons: [
      { icon: 'LampIcon', name: 'meditate mindfulness focus idea clarity inspiration deep work' },
      { icon: 'BellDisabledIcon', name: 'no phone digital detox silent do not disturb' },
      { icon: 'ClockIcon', name: 'pomodoro timer duration focus time' },
      { icon: 'SparklesIcon', name: 'sparkle clarity creativity mindfulness' },
    ],
  },
  {
    title: 'LEARNING',
    icons: [
      { icon: 'EditIcon', name: 'journal diary writing notes planning pencil drawing' },
      { icon: 'LightningIcon', name: 'coding programming energy power active vitality' },
    ],
  },
  {
    title: 'HEALTH & WELLNESS',
    icons: [
      { icon: 'MoonIcon', name: 'sleep night bedtime rest evening' },
      { icon: 'SunIcon', name: 'morning sun wake up daylight early' },
      { icon: 'HeartIcon', name: 'health wellness care fitness heart' },
    ],
  },
  {
    title: 'GENERAL',
    icons: [
      { icon: 'SproutIcon', name: 'sprout plant growth nature habit start' },
      { icon: 'CalendarIcon', name: 'calendar schedule routine date' },
      { icon: 'TimerIcon', name: 'timer hourglass time limit countdown' },
      { icon: 'DefaultHabitIcon', name: 'habit star default' },
    ],
  },
];

interface IconPickerModalProps {
  visible: boolean;
  selectedIcon: string;
  accentColor?: string;
  onSelectIcon: (icon: string) => void;
  onClose: () => void;
}

export function IconPickerModal({
  visible,
  selectedIcon,
  accentColor = '#4655E0',
  onSelectIcon,
  onClose,
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ICON_CATEGORIES;

    return ICON_CATEGORIES.map((cat) => ({
      title: cat.title,
      icons: cat.icons.filter(
        (item) => item.icon.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.icons.length > 0);
  }, [searchQuery]);

  const handleSelect = (icon: string) => {
    Haptics.selectionAsync();
    onSelectIcon(icon);
    onClose();
  };

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        className="flex-1 bg-[#FAFAF8] dark:bg-[#151718]"
        edges={['top']}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.04] dark:bg-white/[0.06]"
          >
            <ChevronIcon direction="left" size={20} color={textColor} />
          </TouchableOpacity>
          <Text className="font-pbold text-lg text-neutral-900 dark:text-neutral-100">
            Choose an icon
          </Text>
          <View className="w-9" />
        </View>

        {/* Search Bar */}
        <View className="px-5 my-2.5">
          <View className="flex-row items-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-3.5 h-12 bg-white dark:bg-[#222326]">
            <SearchIcon
              size={18}
              color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search icons..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
              className="font-pmedium flex-1 text-sm py-0 text-neutral-900 dark:text-neutral-100"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Icon Grid */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCategories.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="font-pregular text-sm text-neutral-400 dark:text-neutral-500">
                No icons found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredCategories.map((category) => (
              <View key={category.title} className="mb-6">
                <Text className="font-pbold text-xs tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-3 pl-1">
                  {category.title}
                </Text>

                <View className="flex-row flex-wrap gap-3">
                  {category.icons.map((item, index) => {
                    const isSelected = selectedIcon === item.icon;
                    return (
                      <TouchableOpacity
                        key={`${item.icon}-${index}`}
                        activeOpacity={0.7}
                        onPress={() => handleSelect(item.icon)}
                        style={{
                          width: '21.5%',
                          aspectRatio: 1,
                          backgroundColor: isSelected
                            ? `${accentColor}25`
                            : isDark
                            ? '#222326'
                            : '#FFFFFF',
                          borderColor: isSelected
                            ? accentColor
                            : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.05)',
                          borderWidth: isSelected ? 2 : 1,
                        }}
                        className="rounded-[18px] items-center justify-center relative shadow-sm shadow-black/5"
                      >
                        {renderHabitIcon(item.icon, isSelected ? accentColor : isDark ? '#ECEDEE' : '#11181C', 26)}
                        {isSelected && (
                          <View
                            style={{ backgroundColor: accentColor }}
                            className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full items-center justify-center"
                          >
                            <TickIcon size={8} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
