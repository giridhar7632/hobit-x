import { CustomAlert as Alert } from '@/utils/custom-alert';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { HABIT_COLORS } from '@/constants/habit-colors';
import { BellIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackHabit } from '@/utils/actions';
import { cancelScheduledNotification, refreshHabitNotifications, scheduleTimerNotification } from '@/utils/notifications';
import { useMeridianMutation, useQueryClient } from 'meridian-lite';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.85;
const INNER_CIRCLE_SIZE = RING_SIZE - 48;
const TICK_COUNT = 60;
const CENTER = RING_SIZE / 2;
const TICK_OUTER_RADIUS = RING_SIZE / 2;
const TICK_INNER_RADIUS = TICK_OUTER_RADIUS - 8;
const DANGER_COLOR = '#ef4444';

function formatDurationLabel(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const secondsLabel = s > 0 ? ` ${s} s` : '';

    if (h > 0) {
        if (m === 0) return `${h} h${secondsLabel}`;
        return `${h} h ${m} m${secondsLabel}`;
    }
    if (m > 0) return `${m} m${secondsLabel}`;
    return `${s} s`;
}

function formatCountdown(remainingSeconds: number) {
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;

    const paddedM = m.toString().padStart(2, '0');
    const paddedS = s.toString().padStart(2, '0');

    if (h > 0) return `${h}:${paddedM}:${paddedS}`;
    return `${paddedM}:${paddedS}`;
}

function formatEndTime(remainingSeconds: number) {
    const end = new Date(Date.now() + remainingSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

interface TickRingProps {
    progress: number;
    accentColor: string;
    isPaused: boolean;
    isDark: boolean;
}

function TickRing({ progress, accentColor, isPaused, isDark }: TickRingProps) {
    const activeTicks = Math.ceil(progress * TICK_COUNT);

    const ticks = useMemo(() => {
        const items = [];
        for (let i = 0; i < TICK_COUNT; i++) {
            const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
            items.push({
                x1: CENTER + Math.cos(angle) * TICK_INNER_RADIUS,
                y1: CENTER + Math.sin(angle) * TICK_INNER_RADIUS,
                x2: CENTER + Math.cos(angle) * TICK_OUTER_RADIUS,
                y2: CENTER + Math.sin(angle) * TICK_OUTER_RADIUS,
                index: i,
            });
        }
        return items;
    }, []);

    return (
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
            {ticks.map((tick) => {
                const isRemaining = tick.index < activeTicks;

                let color = isDark ? '#333333' : '#e5e5e5'; // Empty/Elapsed ticks

                if (isRemaining) {
                    if (isPaused) {
                        color = isDark ? '#666666' : '#a3a3a3'; // Paused ticks
                    } else {
                        color = accentColor;
                    }
                }

                return (
                    <Line
                        key={tick.index}
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke={color}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                );
            })}
        </Svg>
    );
}

interface HabitTimerProps {
    habit: any;
    onClose: () => void;
}

export function HabitTimerScreen({ habit, onClose }: HabitTimerProps) {
    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === "dark" ? "dark" : "light";
    const isDark = currentTheme === 'dark';
    const theme = HABIT_COLORS[habit.color] || HABIT_COLORS.lime;

    const targetSeconds = (habit.planned_time_minutes || 10) * 60;

    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [overtimePromptShown, setOvertimePromptShown] = useState(false);

    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const plannedNotificationIdRef = useRef<string | null>(null);
    const overtimeNotificationIdRef = useRef<string | null>(null);
    const doubleNotificationIdRef = useRef<string | null>(null);

    const isPaused = !isActive && secondsElapsed > 0;

    useEffect(() => {
        if (isActive) {
            startTimeRef.current = Date.now() - secondsElapsed * 1000;
            scheduleNotification(secondsElapsed);

            intervalRef.current = setInterval(() => {
                if (startTimeRef.current === null) return;

                const now = Date.now();
                const currentElapsed = Math.round((now - startTimeRef.current) / 1000);

                if (currentElapsed >= targetSeconds * 2.0) {
                    setIsActive(false);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    handleSaveAtTime(
                        Math.round(targetSeconds * 2.0),
                        'Completed',
                        'Timer Limit Reached',
                        `Your ${habit.name} session reached its limit and has been saved.`
                    );
                    return;
                }

                if (currentElapsed >= targetSeconds * 1.30 && !overtimePromptShown) {
                    setIsActive(false);
                    setOvertimePromptShown(true);
                    setSecondsElapsed(Math.round(targetSeconds * 1.30));
                    if (intervalRef.current) clearInterval(intervalRef.current);

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

                    Alert.alert(
                        'Overtime',
                        'Are you still tracking this habit?',
                        [
                            {
                                text: 'Yes, keep going',
                                onPress: () => {
                                    setIsActive(true);
                                }
                            },
                            {
                                text: 'No, save now',
                                style: 'destructive',
                                onPress: () => {
                                    handleSaveAtTime(Math.round(targetSeconds * 1.30), 'Completed');
                                }
                            }
                        ]
                    );
                    return;
                }

                setSecondsElapsed(currentElapsed);
            }, 500);
        } else {
            startTimeRef.current = null;
            cancelTimerNotification();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, overtimePromptShown]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && isActive && startTimeRef.current !== null) {
                const now = Date.now();
                const currentElapsed = Math.round((now - startTimeRef.current) / 1000);

                if (currentElapsed >= targetSeconds * 2.0) {
                    setIsActive(false);
                    handleSaveAtTime(
                        Math.round(targetSeconds * 2.0),
                        'Completed',
                        'Timer Limit Reached',
                        `Your ${habit.name} session reached its limit and has been saved.`
                    );
                } else if (currentElapsed >= targetSeconds * 1.30) {
                    setIsActive(false);
                    handleSaveAtTime(Math.round(targetSeconds * 1.30), 'Completed');
                } else {
                    setSecondsElapsed(currentElapsed);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [isActive, targetSeconds, habit.name]);

    const toggleTimer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsActive(!isActive);
    };

    const handleCancel = () => {
        setIsActive(false);
        cancelTimerNotification();
        if (intervalRef.current) clearInterval(intervalRef.current);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        if (secondsElapsed === 0) {
            onClose();
            return;
        }

        Alert.alert(
            'Cancel Session',
            'Do you want to discard this session?',
            [
                { text: 'Keep going', style: 'cancel', onPress: () => { } },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: onClose,
                },
                {
                    text: 'Save progress',
                    onPress: () => handleSave('Partial'),
                },
            ],
        );
    };

    const handleComplete = async () => {
        await handleSave('Completed');
    };

    const queryClient = useQueryClient();
    const { mutate: mutateOutbox } = useMeridianMutation({
        invalidateKeys: [["habits"], ["habit_entries", habit.id], ["habit-dates", habit.id]],
    });

    const handleSaveAtTime = async (
        seconds: number, 
        status: 'Completed' | 'Missed' | 'Skipped' | 'Partial',
        alertTitle?: string,
        alertMessage?: string
    ) => {
        const actualMinutes = Math.max(1, Math.round(seconds / 60));
        try {
            const totalMinutesToday = (habit.today_tracked_minutes || 0) + actualMinutes;
            const isDone = status === 'Completed';
            const newNotificationIds = await refreshHabitNotifications(habit, totalMinutesToday, isDone);

            // 1. Optimistic write to local SQLite database
            const trackedResult = await trackHabit({
                habit_id: habit.id,
                entry_date: new Date().toISOString(),
                status,
                actual_time_minutes: actualMinutes,
                notification_ids: JSON.stringify(newNotificationIds),
            });

            // 2. Invalidate local query cache
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            queryClient.invalidateQueries({ queryKey: ["habit_entries", habit.id] });
            queryClient.invalidateQueries({ queryKey: ["habit-dates", habit.id] });

            // 3. Enqueue to Meridian Lite outbox for sync
            await mutateOutbox("track_habit", trackedResult);

            if (status === 'Completed') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            if (alertTitle && alertMessage) {
                Alert.alert(alertTitle, alertMessage);
            }
        } catch (e: any) {
            console.error('Track error:', e);
            Alert.alert("Error logging habit:", e.message);
        }
        onClose();
    };

    const handleSave = async (status: 'Completed' | 'Missed' | 'Skipped' | 'Partial') => {
        await handleSaveAtTime(secondsElapsed, status);
    };

    const scheduleNotification = async (elapsed: number) => {
        await cancelTimerNotification();

        // 1. Notification for planned time complete
        if (elapsed < targetSeconds) {
            const timeToPlanned = targetSeconds - elapsed;
            plannedNotificationIdRef.current = await scheduleTimerNotification(
                habit.name,
                timeToPlanned,
                "Timer Complete!",
                `Great job focusing on ${habit.name}.`
            );
        }

        // 2. Notification for 30% overtime
        const overtimeSeconds = Math.round(targetSeconds * 1.30);
        if (elapsed < overtimeSeconds) {
            const timeToOvertime = overtimeSeconds - elapsed;
            overtimeNotificationIdRef.current = await scheduleTimerNotification(
                habit.name,
                timeToOvertime,
                "Are you still tracking?",
                `Open the app to continue tracking ${habit.name}, otherwise progress will be saved at the 30% overtime mark.`
            );
        }

        // 3. Notification for twice the planned time
        const doubleSeconds = Math.round(targetSeconds * 2.0);
        if (elapsed < doubleSeconds) {
            const timeToDouble = doubleSeconds - elapsed;
            doubleNotificationIdRef.current = await scheduleTimerNotification(
                habit.name,
                timeToDouble,
                "Timer Limit Reached",
                `Your ${habit.name} session reached its limit and has been saved.`
            );
        }
    };

    const cancelTimerNotification = async () => {
        if (plannedNotificationIdRef.current) {
            await cancelScheduledNotification(plannedNotificationIdRef.current);
            plannedNotificationIdRef.current = null;
        }
        if (overtimeNotificationIdRef.current) {
            await cancelScheduledNotification(overtimeNotificationIdRef.current);
            overtimeNotificationIdRef.current = null;
        }
        if (doubleNotificationIdRef.current) {
            await cancelScheduledNotification(doubleNotificationIdRef.current);
            doubleNotificationIdRef.current = null;
        }
    };

    const isOvertime = secondsElapsed > targetSeconds;
    const remainingSeconds = Math.max(targetSeconds - secondsElapsed, 0);
    const progress = isOvertime ? 1.0 : remainingSeconds / targetSeconds;

    const originalDurationLabel = formatDurationLabel(targetSeconds);
    const countdownLabel = isOvertime
        ? `+${formatCountdown(secondsElapsed - targetSeconds)}`
        : formatCountdown(remainingSeconds);
    const endTimeLabel = isOvertime ? "Overtime" : formatEndTime(remainingSeconds);

    return (
        <View className={`flex-1 items-center justify-center bg-white dark:bg-black`}>

            <View
                style={{ width: RING_SIZE, height: RING_SIZE }}
                className="items-center justify-center"
            >
                <TickRing progress={progress} accentColor={theme.accent} isPaused={isPaused} isDark={isDark} />

                <View
                    style={{
                        width: INNER_CIRCLE_SIZE,
                        height: INNER_CIRCLE_SIZE,
                        backgroundColor: isDark ? '#1c1c1e' : '#f4f4f5'
                    }}
                    className="rounded-full items-center justify-center absolute shadow-sm"
                >
                    <Text className="text-gray-500 dark:text-gray-300 font-pmedium text-sm mb-2">
                        {originalDurationLabel}
                    </Text>

                    <View className="flex-row items-center justify-center">
                        {countdownLabel.split('').map((char, index) => {
                            const isColon = char === ':';
                            const fSize = remainingSeconds >= 3600 ? 56 : 64;
                            const charWidth = isColon
                                ? (fSize === 56 ? 16 : 20)
                                : (fSize === 56 ? 34 : 40);
                            return (
                                <Text
                                    key={index}
                                    className="text-black dark:text-white font-pbold"
                                    style={{
                                        fontSize: fSize,
                                        width: charWidth,
                                        textAlign: 'center',
                                    }}
                                >
                                    {char}
                                </Text>
                            );
                        })}
                    </View>

                    <View className="flex-row items-center mt-3 gap-1.5 opacity-80">
                        <BellIcon size={14} color={isDark ? "#d1d5db" : "#6b7280"} />
                        <Text className="text-gray-500 dark:text-gray-300 font-pmedium text-sm">
                            {endTimeLabel}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center justify-center gap-12 mt-20">

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCancel}
                    className="w-32 h-32 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDark ? '#333333' : '#e5e5e5' }}
                >
                    <Text className="text-black dark:text-white font-psemibold text-lg">
                        Cancel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={toggleTimer}
                    className="w-32 h-32 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: isActive ? `${DANGER_COLOR}25` : `${theme.accent}25`,
                        borderColor: isActive ? DANGER_COLOR : theme.accent,
                        borderWidth: 0.3,
                    }}
                >
                    <Text
                        className="font-psemibold text-lg"
                        style={{ color: isActive ? DANGER_COLOR : theme.accent }}
                    >
                        {isActive ? 'Pause' : (secondsElapsed > 0 ? 'Resume' : 'Start')}
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}