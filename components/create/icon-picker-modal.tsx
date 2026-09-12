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

import { getContrastTextColor, getHabitColor } from '@/constants/habit-colors';
import { ChevronIcon, renderHabitIcon, SearchIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface IconCategory {
  title: string;
  icons: { icon: string; name: string; defaultColor: string }[];
}

const ICON_CATEGORIES: IconCategory[] = [
  {
    title: 'POPULAR',
    icons: [
      { icon: 'FlameIcon', name: 'streak fire motivation daily', defaultColor: 'orange' },
      { icon: 'StarIcon', name: 'favorite top goal priority star', defaultColor: 'yellow' },
      { icon: 'HeartIcon', name: 'heart love care health', defaultColor: 'pink' },
      { icon: 'ActivityIcon', name: 'workout activity gym fitness', defaultColor: 'green' },
      { icon: 'SparklesIcon', name: 'sparkle clarity creativity magic', defaultColor: 'purple' },
    ],
  },
  {
    title: 'HEALTH & FITNESS',
    icons: [
      { icon: 'ActivityIcon', name: 'workout activity gym fitness run cycle walk', defaultColor: 'green' },
      { icon: 'BasketIcon', name: 'shopping cart buy grocery sports basket nutrition food', defaultColor: 'green' },
      { icon: 'WatchIcon', name: 'apple watch time fitness tracker steps walking cardio', defaultColor: 'cyan' },
      { icon: 'ShieldIcon', name: 'protect secure health safety vitamins immune defense', defaultColor: 'blue' },
      { icon: 'MugIcon', name: 'water drink hydration coffee tea mug cup', defaultColor: 'blue' },
      { icon: 'HeartIcon', name: 'heart health cardio vitals wellbeing pulse', defaultColor: 'pink' },
    ],
  },
  {
    title: 'NATURE & TIME',
    icons: [
      { icon: 'SunIcon', name: 'morning sun wake up daylight early sunshine', defaultColor: 'yellow' },
      { icon: 'MoonIcon', name: 'sleep night bedtime rest evening slumber', defaultColor: 'purple' },
      { icon: 'SunsetIcon', name: 'evening dusk dawn horizon sunset wind down', defaultColor: 'orange' },
      { icon: 'CalendarIcon', name: 'calendar schedule routine date days month planner', defaultColor: 'red' },
      { icon: 'ClockIcon', name: 'time clock pomodoro focus interval hours', defaultColor: 'cyan' },
      { icon: 'TimerIcon', name: 'countdown hourglass time limit stopwatch session', defaultColor: 'orange' },
      { icon: 'AlarmIcon', name: 'wake alert clock morning early alarm ringing', defaultColor: 'red' },
    ],
  },
  {
    title: 'WORK & STUDY',
    icons: [
      { icon: 'BookIcon', name: 'reading book study literature pages novel library', defaultColor: 'yellow' },
      { icon: 'LampIcon', name: 'meditate mindfulness focus idea thinking knowledge', defaultColor: 'cyan' },
      { icon: 'EditIcon', name: 'journal diary writing notes planning log draft', defaultColor: 'yellow' },
      { icon: 'ClipboardIcon', name: 'task list todo board checklist manage', defaultColor: 'blue' },
      { icon: 'DocumentIcon', name: 'file paper read text document essay article', defaultColor: 'green' },
      { icon: 'FolderIcon', name: 'organize files directory archive project cabinet', defaultColor: 'orange' },
    ],
  },
  {
    title: 'TECH & DEVICES',
    icons: [
      { icon: 'ImacIcon', name: 'computer work monitor screen desk workstation mac', defaultColor: 'purple' },
      { icon: 'PhoneIcon', name: 'mobile call screen smart apps digital detox device', defaultColor: 'pink' },
      { icon: 'KeyboardIcon', name: 'type code write hardware programming developer tech', defaultColor: 'orange' },
      { icon: 'CameraIcon', name: 'photo picture memory capture photography lens video', defaultColor: 'cyan' },
      { icon: 'ChipIcon', name: 'hardware computer tech processor cpu microchip ai', defaultColor: 'green' },
      { icon: 'CommandIcon', name: 'mac apple shortcut code keyboard terminal keys', defaultColor: 'purple' },
      { icon: 'JoystickIcon', name: 'game play console entertainment arcade gaming', defaultColor: 'pink' },
      { icon: 'WifiIcon', name: 'wifi internet connect network online wireless signal', defaultColor: 'blue' },
    ],
  },
  {
    title: 'TRAVEL & PLACES',
    icons: [
      { icon: 'CompassIcon', name: 'navigate travel direction explore adventure hike guide', defaultColor: 'cyan' },
      { icon: 'LocationIcon', name: 'map pin place route destination trip commute', defaultColor: 'red' },
      { icon: 'DeliveryIcon', name: 'box package ship order parcel logistics mail', defaultColor: 'orange' },
    ],
  },
  {
    title: 'TOOLS & CREATIVE',
    icons: [
      { icon: 'BrushIcon', name: 'art paint draw creative design illustration sketch', defaultColor: 'purple' },
      { icon: 'MusicNoteIcon', name: 'music listen play instrument song sound audio melody', defaultColor: 'pink' },
      { icon: 'BellIcon', name: 'alert notify sound ringing reminder notice chime', defaultColor: 'yellow' },
      { icon: 'BellDisabledIcon', name: 'silent focus dnd digital detox mute quiet quietude', defaultColor: 'pink' },
      { icon: 'EyeIcon', name: 'vision sight read look view observe watch inspect', defaultColor: 'blue' },
      { icon: 'PointIcon', name: 'cursor click select tap aim target pointer action', defaultColor: 'cyan' },
      { icon: 'TrendUpIcon', name: 'growth improve increase graph trading progress analytics', defaultColor: 'green' },
      { icon: 'TrendDownIcon', name: 'decrease lower reduce graph limit cut back reduce', defaultColor: 'red' },
      { icon: 'LightningIcon', name: 'energy power active vitality fast quick speed spark', defaultColor: 'yellow' },
    ],
  },
];

const ALL_UNIQUE_ICONS = Array.from(
  new Map(
    ICON_CATEGORIES.flatMap((cat) => cat.icons).map((item) => [item.icon, item])
  ).values()
);

interface IconPickerModalProps {
  visible: boolean;
  selectedIcon: string;
  accentColor?: string;
  onSelectIcon: (icon: string, color?: string) => void;
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
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const displayedIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (q) {
      return ALL_UNIQUE_ICONS.filter(
        (item) => item.icon.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
      );
    }

    if (activeCategory === 'ALL') {
      return ALL_UNIQUE_ICONS;
    }

    const category = ICON_CATEGORIES.find((c) => c.title === activeCategory);
    return category ? category.icons : [];
  }, [searchQuery, activeCategory]);

  const handleSelect = (icon: string, color?: string) => {
    Haptics.selectionAsync();
    onSelectIcon(icon, color);
    onClose();
  };

  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const chipBgActive = isDark ? '#FFFFFF' : '#11181C';
  const chipTextActive = isDark ? '#11181C' : '#FFFFFF';
  const chipBgInactive = isDark ? '#222326' : '#F3F4F6';
  const chipTextInactive = isDark ? '#A1A1AA' : '#71717A';
  const countTextActive = isDark ? 'rgba(17, 24, 28, 0.75)' : 'rgba(255, 255, 255, 0.8)';
  const countTextInactive = isDark ? '#71717A' : '#9CA3AF';

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

        {/* Filter Chips */}
        {!searchQuery && (
          <View className="mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => { });
                  setActiveCategory('ALL');
                }}
                className="px-4 py-2 rounded-full border border-black/[0.04] dark:border-white/[0.04] items-center justify-center flex-row gap-1.5"
                style={{ backgroundColor: activeCategory === 'ALL' ? chipBgActive : chipBgInactive }}
              >
                <Text
                  className="font-pbold text-[13px]"
                  style={{ color: activeCategory === 'ALL' ? chipTextActive : chipTextInactive }}
                >
                  All
                </Text>
                <Text
                  style={{
                    color: activeCategory === 'ALL' ? countTextActive : countTextInactive,
                  }}
                  className="text-[11px] font-psemibold"
                >
                  {ALL_UNIQUE_ICONS.length}
                </Text>
              </TouchableOpacity>

              {ICON_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.title;
                return (
                  <TouchableOpacity
                    key={cat.title}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => { });
                      setActiveCategory(cat.title);
                    }}
                    className="px-4 py-2 rounded-full border border-black/[0.04] dark:border-white/[0.04] items-center justify-center flex-row gap-1.5"
                    style={{ backgroundColor: isSelected ? chipBgActive : chipBgInactive }}
                  >
                    <Text
                      className="font-pbold text-[13px] capitalize"
                      style={{ color: isSelected ? chipTextActive : chipTextInactive }}
                    >
                      {cat.title.toLowerCase()}
                    </Text>
                    <Text
                      style={{
                        color: isSelected ? countTextActive : countTextInactive,
                      }}
                      className="text-[11px] font-psemibold"
                    >
                      {cat.icons.length}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Icon Grid */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {displayedIcons.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="font-pregular text-sm text-neutral-400 dark:text-neutral-500">
                No icons found for &quot;{searchQuery}&quot;
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between" style={{ gap: 12 }}>
              {displayedIcons.map((item) => {
                const defaultColorKey = item.defaultColor || 'purple';
                const colorDef = getHabitColor(defaultColorKey);
                const isSelected = selectedIcon === item.icon;
                const boxBgColor = colorDef.hex;
                const iconColor = getContrastTextColor(colorDef.hex);

                return (
                  <TouchableOpacity
                    key={item.icon}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item.icon, defaultColorKey)}
                    style={{
                      width: '22%',
                      aspectRatio: 1,
                      backgroundColor: boxBgColor,
                      borderColor: isSelected ? (isDark ? '#FFFFFF' : '#11181C') : 'transparent',
                      borderWidth: isSelected ? 2.5 : 0,
                      transform: [{ scale: isSelected ? 1.05 : 1 }],
                    }}
                    className="rounded-[22px] relative shadow-sm shadow-black/5"
                  >
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      {renderHabitIcon(item.icon, iconColor, 28)}
                    </View>

                    {isSelected && (
                      <View
                        style={{ backgroundColor: isDark ? '#FFFFFF' : '#11181C' }}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full items-center justify-center shadow-xs"
                      >
                        <TickIcon size={8} color={isDark ? '#11181C' : '#FFFFFF'} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {[...Array(4 - (displayedIcons.length % 4 || 4))].map((_, i) => (
                <View key={`spacer-${i}`} style={{ width: '22%' }} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}