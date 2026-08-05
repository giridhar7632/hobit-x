import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { HABIT_COLORS } from '@/constants/habit-colors';
import { BellIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackHabit } from '@/utils/actions';

// Tell Expo how to handle notifications when the app is OPEN
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

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

    if (h > 0) return `${h} h ${m} m${secondsLabel}`;
    return `${m} m${secondsLabel}`;
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
    progress: number;      // 0..1 remaining time
    accentColor: string;
    isPaused: boolean;
    isDark: boolean; // Added theme toggle
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

    // Instead of relying on setInterval ticking perfectly, we track the absolute end time
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const targetEndTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const notificationIdRef = useRef<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const isPaused = !isActive && secondsElapsed > 0;

    // ─── 1. Setup Audio & Permissions ─────────────────────────────
    useEffect(() => {
        async function setupAudioAndNotifications() {
            // Load the sound file
            const { sound: audioSound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/alarm.mp3') // ⚠️ UPDATE THIS PATH TO YOUR ACTUAL SOUND FILE
            );
            setSound(audioSound);

            // Request notification permissions
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Notification permissions not granted!');
            }
        }
        setupAudioAndNotifications();

        return () => {
            if (sound) sound.unloadAsync(); // Cleanup on unmount
            cancelScheduledNotification();
        };
    }, []);

    // ─── 2. Timer Logic (Resilient to Backgrounding) ──────────────
    useEffect(() => {
        if (isActive) {
            // Calculate exactly when this timer should end in the real world
            const remaining = targetSeconds - secondsElapsed;
            targetEndTimeRef.current = Date.now() + remaining * 1000;

            scheduleNotification(remaining);

            intervalRef.current = setInterval(() => {
                if (!targetEndTimeRef.current) return;

                // Compare current time to target time to find true remaining seconds
                const now = Date.now();
                const trueRemaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
                const trueElapsed = targetSeconds - trueRemaining;

                setSecondsElapsed(trueElapsed);

                // Auto-complete when time's up
                if (trueRemaining <= 0) {
                    handleTimerFinish();
                }
            }, 500); // Check every half second for better accuracy
        } else {
            // Paused
            targetEndTimeRef.current = null;
            cancelScheduledNotification();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);


    // ─── 3. Actions ───────────────────────────────────────────────
    const handleTimerFinish = async () => {
        setIsActive(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Vibrate and Play Sound!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (sound) {
            await sound.playAsync();
        }

        await handleSave('Completed');
    };

    const toggleTimer = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsActive(!isActive);
    };

    const handleCancel = () => {
        setIsActive(false);
        cancelScheduledNotification();
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

    const handleSave = async (status: string) => {
        const actualMinutes = Math.max(1, Math.round(secondsElapsed / 60));
        try {
            await trackHabit({
                habit_id: habit.id,
                entry_date: new Date().toISOString(),
                status,
                actual_time_minutes: actualMinutes,
            });
            if (status === 'Completed') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            console.error('Track error:', e);
        }
        onClose();
    };

    // ─── 4. Notification Helpers ──────────────────────────────────
    const scheduleNotification = async (seconds: number) => {
        await cancelScheduledNotification(); // Clear any existing ones first

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Timer Complete! 🎉",
                body: `Great job focusing on ${habit.name}.`,
                sound: true, // Uses default device notification sound in background
            },
            trigger: { seconds: seconds },
        });
        notificationIdRef.current = id;
    };

    const cancelScheduledNotification = async () => {
        if (notificationIdRef.current) {
            await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
            notificationIdRef.current = null;
        }
    };

    const remainingSeconds = Math.max(targetSeconds - secondsElapsed, 0);
    const progress = remainingSeconds / targetSeconds;

    const originalDurationLabel = formatDurationLabel(targetSeconds);
    const countdownLabel = formatCountdown(remainingSeconds);
    const endTimeLabel = formatEndTime(remainingSeconds);

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

                    <Text
                        className="text-black dark:text-white font-pbold tracking-widest"
                        style={{ fontSize: remainingSeconds >= 3600 ? 56 : 64 }}
                    >
                        {countdownLabel}
                    </Text>

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