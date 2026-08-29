import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    LinearTransition,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { HABIT_COLORS } from '@/constants/habit-colors';
import { BellIcon, ClockIcon, FlameIcon, PlusIcon, TickIcon, TimerIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getHabitTotalReminders, parseNotifyTimes } from '@/utils/notifications';

interface HabitCardProps {
    habit: any;
    onPress: () => void;
    onTrack: () => void;
    onUntrack?: () => void;
    onTimerPress: () => void;
    completedToday?: boolean;
}

const COMPLETION_MESSAGES = [
    'Nice!',
    'Done!',
    'Boom!',
    'Nailed it!',
    'Streak +1!',
    'XP Earned!',
    'Level Up!',
    'Win!',
    'Great choice!',
    'Keep going!',
    'Momentum!',
    "You're on fire!",
    'Another win!',
    'Locked in!',
    'Consistency wins!',
    "Awesome!",
    "You did it!",
    "Yes!",
    'Great work!',
    'Boom! Done!',
    'Legendary!',
    'Fantastic!',
    'Way to go!',
];

export function HabitCard({ habit, onPress, onTrack, onUntrack, onTimerPress, completedToday = false }: HabitCardProps) {
    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === "dark" ? "dark" : "light";
    const theme = HABIT_COLORS[habit.color] || HABIT_COLORS.lime;

    const totalReminders = getHabitTotalReminders(habit);
    const todayCompleted = habit.today_completed_count || 0;

    const strikeProgress = useSharedValue(completedToday ? 1 : 0);
    const cardOpacity = useSharedValue(completedToday ? 0.6 : 1);

    const timerScale = useSharedValue(1);
    const completeScale = useSharedValue(1);

    const tickScale = useSharedValue(completedToday ? 1 : 0);
    const ringScale = useSharedValue(0);
    const ringOpacity = useSharedValue(0);

    const microCopyOpacity = useSharedValue(0);
    const [microCopyText, setMicroCopyText] = useState('');

    const isFirstRender = useRef(true);

    useEffect(() => {
        strikeProgress.value = withTiming(completedToday ? 1 : 0, { duration: 400 });
        cardOpacity.value = withTiming(completedToday ? 0.6 : 1, { duration: 400 });

        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (completedToday) {
            setMicroCopyText(COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]);

            tickScale.value = 0;
            tickScale.value = withSequence(
                withTiming(1.25, { duration: 220, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) })
            );

            ringScale.value = 0.6;
            ringOpacity.value = 0.5;
            ringScale.value = withTiming(1.9, { duration: 550, easing: Easing.out(Easing.ease) });
            ringOpacity.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.ease) });

            microCopyOpacity.value = withSequence(
                withTiming(1, { duration: 200 }),
                withDelay(900, withTiming(0, { duration: 300 }))
            );
        } else {
            tickScale.value = 0;
            ringScale.value = 0;
            ringOpacity.value = 0;
            microCopyOpacity.value = 0;
        }
    }, [completedToday]);

    const strikeStyle = useAnimatedStyle(() => ({
        width: `${strikeProgress.value * 100}%`,
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
    }));

    const timerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
    }));

    const completeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: completeScale.value }],
    }));

    const tickAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: tickScale.value }],
    }));

    const ringAnimatedStyle = useAnimatedStyle(() => ({
        opacity: ringOpacity.value,
        transform: [{ scale: ringScale.value }],
    }));

    const microCopyAnimatedStyle = useAnimatedStyle(() => ({
        opacity: microCopyOpacity.value,
        transform: [{ translateY: (1 - microCopyOpacity.value) * 6 }],
    }));

    const handleComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onTrack();
    };

    const handlePressIn = (scale: SharedValue<number>) => {
        scale.value = withTiming(0.85, { duration: 100, easing: Easing.out(Easing.ease) });
    };

    const handlePressOut = (scale: SharedValue<number>) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    };

    const completedTime = habit.last_completed_date
        ? new Date(habit.last_completed_date.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Today';

    const activeBgOpacity = currentTheme === 'dark' ? '40' : '15';
    const completedBgOpacity = currentTheme === 'dark' ? '20' : '08';
    const bgOpacity = completedToday ? completedBgOpacity : activeBgOpacity;

    return (
        <Animated.View
            layout={LinearTransition.duration(350).easing(Easing.inOut(Easing.ease))}
            className="mb-3"
        >
            <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
                <Animated.View
                    style={[
                        {
                            backgroundColor: `${theme.accent}${bgOpacity}`,
                            borderColor: currentTheme === 'dark' ? `${theme.accent}40` : `${theme.accent}25`,
                            borderWidth: 1,
                        },
                        animatedCardStyle
                    ]}
                    className="rounded-2xl p-4 flex-row items-center"
                >
                    <View
                        style={{ backgroundColor: theme.accent, opacity: completedToday ? 0.4 : 1 }}
                        className="w-1 h-10 rounded-full mr-4"
                    />

                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <View className="self-start relative">
                                <Text className={`text-base font-pbold ${theme.text || 'text-black dark:text-white'}`} numberOfLines={1}>
                                    {habit.name}
                                </Text>
                                <Animated.View
                                    style={[
                                        { backgroundColor: theme.accent, height: 2, position: 'absolute', top: '50%' },
                                        strikeStyle
                                    ]}
                                />
                            </View>

                            {totalReminders > 1 && (
                                <View
                                    style={{
                                        backgroundColor: completedToday ? `${theme.accent}25` : `${theme.accent}15`,
                                        borderColor: `${theme.accent}35`,
                                        borderWidth: 1
                                    }}
                                    className="px-2 py-0.5 rounded-full items-center justify-center"
                                >
                                    <Text
                                        style={{ color: theme.accent }}
                                        className="text-[11px] font-pbold"
                                    >
                                        {todayCompleted}/{totalReminders}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View className="flex-row items-center mt-1 gap-4">
                            {completedToday ? (
                                <Text className={`text-xs font-pmedium opacity-70 ${theme.text || 'text-black dark:text-white'}`}>
                                    Completed at {completedTime}
                                </Text>
                            ) : (
                                <>
                                    {habit.planned_time_minutes ? (
                                        <View className="flex-row items-center gap-1 opacity-60">
                                            <ClockIcon size={12} color={theme.accent} />
                                            <Text className={`text-xs font-pregular ${theme.text || 'text-black dark:text-white'}`}>
                                                {habit.planned_time_minutes}m
                                            </Text>
                                        </View>
                                    ) : null}

                                    {habit.notify === 1 && habit.notify_time ? (() => {
                                        const times = parseNotifyTimes(habit.notify_time);
                                        if (times.length === 0) return null;
                                        const firstDate = new Date(times[0]);
                                        if (isNaN(firstDate.getTime())) return null;
                                        const firstFormatted = firstDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const extraCount = times.length > 1 ? ` (+${times.length - 1})` : '';

                                        return (
                                            <View className="flex-row items-center gap-1 opacity-60">
                                                <BellIcon size={12} color={theme.accent} />
                                                <Text className={`text-xs font-pregular ${theme.text || 'text-black dark:text-white'}`}>
                                                    {firstFormatted}{extraCount}
                                                </Text>
                                            </View>
                                        );
                                    })() : null}

                                    {habit.current_streak > 0 ? (
                                        <View className="flex-row items-center gap-1 opacity-70">
                                            <FlameIcon size={12} color={theme.accent} />
                                            <Text className={`text-xs font-pmedium ${theme.text || 'text-black dark:text-white'}`}>
                                                {habit.current_streak}
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            )}
                        </View>
                    </View>

                    {completedToday ? (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={(e) => {
                                e.stopPropagation();
                                if (onUntrack) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    onUntrack();
                                }
                            }}
                            className="relative items-center justify-center ml-3"
                        >
                            {/* Pulsing ring that bursts outward from the checkmark */}
                            <Animated.View
                                pointerEvents="none"
                                style={[
                                    {
                                        position: 'absolute',
                                        backgroundColor: theme.accent,
                                    },
                                    ringAnimatedStyle,
                                ]}
                                className="w-10 h-10 rounded-full"
                            />

                            <Animated.View
                                entering={FadeIn.duration(150)}
                                style={[{ backgroundColor: `${theme.accent}20` }, tickAnimatedStyle]}
                                className="w-10 h-10 rounded-full items-center justify-center"
                            >
                                <TickIcon size={20} color={theme.accent} />
                            </Animated.View>

                            {microCopyText ? (
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        { position: 'absolute', bottom: 48, right: -4, width: 150, alignItems: 'flex-end' },
                                        microCopyAnimatedStyle,
                                    ]}
                                >
                                    <View
                                        style={{ backgroundColor: theme.accent }}
                                        className="px-3 py-1 rounded-full"
                                    >
                                        <Text className="text-xs font-pbold text-white">
                                            {microCopyText}
                                        </Text>
                                    </View>
                                </Animated.View>
                            ) : null}
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPressIn={() => handlePressIn(timerScale)}
                                onPressOut={() => handlePressOut(timerScale)}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onTimerPress();
                                }}
                                className="ml-2"
                            >
                                <Animated.View
                                    style={[{ backgroundColor: `${theme.accent}20` }, timerAnimatedStyle]}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                >
                                    <TimerIcon size={20} color={theme.accent} />
                                </Animated.View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={1}
                                onPressIn={() => handlePressIn(completeScale)}
                                onPressOut={() => handlePressOut(completeScale)}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleComplete();
                                }}
                            >
                                <Animated.View
                                    style={[{ backgroundColor: theme.accent }, completeAnimatedStyle]}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                >
                                    <PlusIcon size={20} color="#FFFFFF" />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}