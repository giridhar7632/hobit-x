import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CardViewIcon, GridViewIcon, ListViewIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ViewMode = 'list' | 'grid' | 'card';

export const VIEW_MODE_STORAGE_KEY = '@habit_view_mode';

interface ViewModeMenuProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  tintColor?: string;
}

const OPTIONS: { id: ViewMode; label: string; icon: (props: any) => React.ReactElement }[] = [
  { id: 'list', label: 'List View', icon: ListViewIcon },
  { id: 'grid', label: 'Grid View', icon: GridViewIcon },
  { id: 'card', label: 'Card View', icon: CardViewIcon },
];

export function ViewModeMenu({
  viewMode,
  onChangeViewMode,
  tintColor = '#4655E0',
}: ViewModeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 100, right: 20 });
  const triggerRef = useRef<View>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const CurrentIcon =
    viewMode === 'grid'
      ? GridViewIcon
      : viewMode === 'card'
        ? CardViewIcon
        : ListViewIcon;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const rightOffset = Math.max(16, screenWidth - (x + width));
        const topOffset = y + height + 6;
        setMenuPos({ top: topOffset, right: rightOffset });
        setIsOpen(true);
      });
    } else {
      setIsOpen(true);
    }
  };

  const handleSelect = async (mode: ViewMode) => {
    Haptics.selectionAsync();
    onChangeViewMode(mode);
    setIsOpen(false);
    try {
      await AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Failed to persist view mode:', e);
    }
  };

  const iconColor = isDark ? '#ECEDEE' : '#11181C';

  return (
    <View ref={triggerRef} collapsable={false}>
      {/* Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleOpen}
        className="w-9 h-9 rounded-xl items-center justify-center bg-black/[0.04] dark:bg-white/[0.08]"
      >
        <CurrentIcon size={18} color={iconColor} />
      </TouchableOpacity>

      {/* Popover Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/20"
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              {
                position: 'absolute',
                top: menuPos.top,
                right: menuPos.right,
                shadowColor: '#000000',
                shadowOpacity: isDark ? 0.45 : 0.14,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 18,
                elevation: 12,
              },
            ]}
            className="w-[190px] rounded-[18px] border border-black/[0.06] dark:border-white/[0.1] py-2 px-1 bg-white dark:bg-[#222326] overflow-hidden"
          >
            <Text className="font-pbold text-[10px] tracking-wider uppercase text-neutral-400 dark:text-neutral-500 px-3.5 pt-1 pb-1.5">
              LAYOUT
            </Text>

            {OPTIONS.map((opt, i) => {
              const isSelected = opt.id === viewMode;
              const OptIcon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(opt.id)}
                  className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl ${i < OPTIONS.length - 1 ? 'border-b border-black/[0.06] dark:border-white/[0.08]' : ''
                    }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <OptIcon
                      size={18}
                      color={isSelected ? tintColor : isDark ? '#9BA1A6' : '#687076'}
                    />
                    <Text
                      style={[
                        {
                          color: isSelected
                            ? tintColor
                            : isDark
                              ? '#ECEDEE'
                              : '#11181C',
                        },
                      ]}
                      className={`text-sm ${isSelected ? 'font-psemibold' : 'font-pregular'}`}
                    >
                      {opt.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <TickIcon size={16} color={tintColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
