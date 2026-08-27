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

import { HomeIcon, PlusIcon, UserIcon } from '@/constants/icons';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type MacDockTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export function MacDockTabBar({ state, descriptors, navigation }: MacDockTabBarProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { activeColor } = useAppTheme();

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
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

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

                    // Render icon based on route
                    if (route.name === 'create') {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel || 'Create Habit'}
                                testID={options.tabBarButtonTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                activeOpacity={0.85}
                                style={[
                                    styles.createButton,
                                    {
                                        backgroundColor: activeColor.accent,
                                        shadowColor: activeColor.accent,
                                    },
                                ]}
                            >
                                <PlusIcon size={26} color="#ffffff" />
                            </TouchableOpacity>
                        );
                    }

                    let IconComponent = HomeIcon;
                    if (route.name === 'profile') {
                        IconComponent = UserIcon;
                    }

                    const iconColor = isFocused
                        ? activeColor.accent
                        : (isDark ? '#8e8e93' : '#a1a1aa');

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel || (route.name === 'habits' ? 'Habits' : 'Profile')}
                            testID={options.tabBarButtonTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            activeOpacity={0.7}
                            style={[
                                styles.tabItem]}
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
        paddingHorizontal: 22,
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
    createButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.38,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 3,
    },
});
