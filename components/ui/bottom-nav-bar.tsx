import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon, HomeIcon, UserIcon } from '@/constants/icons';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type BottomNavBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function getNestedRouteName(route: any): string | undefined {
  let state = route.state;
  while (state && state.index !== undefined) {
    route = state.routes[state.index];
    state = route.state;
  }
  return route.name;
}

export function BottomNavBar({ state, descriptors, navigation }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeColor } = useAppTheme();

  const focusedRoute = state.routes[state.index];
  const nestedName = getNestedRouteName(focusedRoute);

  // Hide the tab bar on sub-screens
  const hideNavBar =
    focusedRoute?.name === 'create' ||
    nestedName === '[id]' ||
    nestedName === 'track' ||
    nestedName === 'edit' ||
    nestedName?.includes('edit') ||
    nestedName?.includes('track');

  if (hideNavBar) {
    return null;
  }

  // Filter out hidden routes (e.g. href: null or 'create')
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return (options as any)?.href !== null && route.name !== 'create';
  });

  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.navContainer,
        isDark ? styles.navDark : styles.navLight,
        {
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index]?.name === route.name;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let IconComponent = HomeIcon;
          let label = 'Habits';
          if (route.name === 'calendar') {
            IconComponent = CalendarIcon;
            label = 'Calendar';
          } else if (route.name === 'profile') {
            IconComponent = UserIcon;
            label = 'Profile';
          }

          const activeTabColor = activeColor.accent || '#6366F1';
          const iconColor = isFocused
            ? activeTabColor
            : isDark
            ? '#71717A'
            : '#9CA3AF';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: isFocused ? `${activeTabColor}15` : 'transparent',
                  },
                ]}
              >
                <IconComponent color={iconColor} size={22} />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navDark: {
    backgroundColor: 'rgba(21, 23, 24, 0.96)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  navLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
