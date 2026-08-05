import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { HABIT_COLORS } from '@/constants/habit-colors';
import { BellIcon, ClockIcon, FlameIcon, PlusIcon, TickIcon, TimerIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme.web';

interface HabitCardProps {
    habit: any;
    onPress: () => void;
    onTrack: () => void;
    onTimerPress: () => void;
    completedToday?: boolean;
}

export function HabitCard({ habit, onPress, onTrack, onTimerPress, completedToday = false }: HabitCardProps) {
    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === "dark" ? "dark" : "light";
    const theme = HABIT_COLORS[habit.color] || HABIT_COLORS.lime;

    const strikeProgress = useSharedValue(completedToday ? 1 : 0);
    const cardOpacity = useSharedValue(completedToday ? 0.6 : 1);

    useEffect(() => {
        strikeProgress.value = withTiming(completedToday ? 1 : 0, { duration: 400 });
        cardOpacity.value = withTiming(completedToday ? 0.6 : 1, { duration: 400 });
    }, [completedToday]);

    const strikeStyle = useAnimatedStyle(() => ({
        width: `${strikeProgress.value * 100}%`,
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
    }));

    const handleComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onTrack();
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

                                    {habit.notify === 1 && habit.notify_time ? (
                                        <View className="flex-row items-center gap-1 opacity-60">
                                            <BellIcon size={12} color={theme.accent} />
                                            <Text className={`text-xs font-pregular ${theme.text || 'text-black dark:text-white'}`}>
                                                {new Date(habit.notify_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    ) : null}

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
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            style={{ backgroundColor: `${theme.accent}20` }}
                            className="w-10 h-10 rounded-full items-center justify-center ml-3"
                        >
                            <TickIcon size={20} color={theme.accent} />
                        </Animated.View>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onTimerPress();
                                }}
                                style={{ backgroundColor: `${theme.accent}20` }}
                                className="w-10 h-10 rounded-full items-center justify-center ml-2"
                            >
                                <TimerIcon size={20} color={theme.accent} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleComplete();
                                }}
                                style={{ backgroundColor: theme.accent }}
                                className="w-10 h-10 rounded-full items-center justify-center"
                            >
                                <PlusIcon size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}