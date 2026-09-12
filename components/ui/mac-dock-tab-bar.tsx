import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon, HomeIcon, UserIcon } from '@/constants/icons';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type MacDockTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function getNestedRouteName(route: any): string | undefined {
    let state = route.state;
    while (state && state.index !== undefined) {
        route = state.routes[state.index];
        state = route.state;
    }
    return route.name;
}

export function MacDockTabBar({ state, descriptors, navigation }: MacDockTabBarProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { activeColor } = useAppTheme();

    const focusedRoute = state.routes[state.index];
    const nestedName = getNestedRouteName(focusedRoute);

    // Hide the dock on create screen and sub-screens like habit details ([id]), edit activity, or track activity
    const hideDock =
        focusedRoute?.name === 'create' ||
        nestedName === '[id]' ||
        nestedName === 'track' ||
        nestedName === 'edit' ||
        nestedName?.includes('edit') ||
        nestedName?.includes('track');
    if (hideDock) {
        return null;
    }

    // Filter out hidden routes (e.g. href: null or 'create')
    const visibleRoutes = state.routes.filter((route) => {
        const { options } = descriptors[route.key];
        return (options as any)?.href !== null && route.name !== 'create';
    });

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.dockWrapper,
                {
                    bottom: insets.bottom > 0 ? insets.bottom + 8 : 20,
                },
            ]}
        >
            <View
                style={[
                    styles.dockContainer,
                    isDark ? styles.dockDark : styles.dockLight,
                ]}
            >
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

                    const iconColor = isFocused
                        ? activeColor.accent
                        : (isDark ? '#8e8e93' : '#a1a1aa');

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
                            style={styles.tabItem}
                        >
                            <IconComponent color={iconColor} size={24} />
                            <View
                                style={[
                                    styles.activeDot,
                                    {
                                        backgroundColor: isFocused ? activeColor.accent : 'transparent',
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    dockWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    dockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 8,
        borderRadius: 36,
        gap: 32,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 8 },
            },
            android: {
                elevation: 12,
            },
        }),
    },
    dockDark: {
        backgroundColor: 'rgba(28, 28, 30, 0.90)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        shadowColor: '#000000',
        shadowOpacity: 0.42,
        shadowRadius: 20,
    },
    dockLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
    },
    tabItem: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 3,
    },
});
