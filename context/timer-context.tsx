import { CustomAlert as Alert } from '@/utils/custom-alert';
import * as Haptics from 'expo-haptics';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { trackHabit } from '@/utils/actions';
import {
    cancelScheduledNotification,
    refreshHabitNotifications,
    scheduleTimerNotification,
} from '@/utils/notifications';
import { useMeridianMutation, useQueryClient } from 'meridian-lite';

interface TimerState {
    habit: any | null;
    startTimestamp: number | null; // Date.now() snapshot when timer last (re)started
    isRunning: boolean;
    secondsElapsed: number;
}

interface TimerContextValue extends TimerState {
    startTimer: (habit: any) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    /** Stop timer without saving. Shows a discard prompt if time was already elapsed. */
    cancelTimer: () => void;
    /** Save the current elapsed time. Evaluates the 50% threshold to decide Completed vs Partial. */
    saveTimer: (status?: 'Completed' | 'Partial') => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error('useTimer must be used inside <TimerProvider>');
    return ctx;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [habit, setHabit] = useState<any | null>(null);
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [overtimePromptShown, setOvertimePromptShown] = useState(false);

    // stable refs so interval callbacks don't capture stale closures
    const habitRef = useRef<any | null>(null);
    const startTimestampRef = useRef<number | null>(null);
    const isRunningRef = useRef(false);
    const secondsElapsedRef = useRef(0);
    const overtimePromptShownRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const plannedNotifIdRef = useRef<string | null>(null);
    const overtimeNotifIdRef = useRef<string | null>(null);
    const doubleNotifIdRef = useRef<string | null>(null);

    // keep refs in sync
    useEffect(() => { habitRef.current = habit; }, [habit]);
    useEffect(() => { startTimestampRef.current = startTimestamp; }, [startTimestamp]);
    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
    useEffect(() => { secondsElapsedRef.current = secondsElapsed; }, [secondsElapsed]);
    useEffect(() => { overtimePromptShownRef.current = overtimePromptShown; }, [overtimePromptShown]);

    const queryClient = useQueryClient();
    const { mutate: mutateOutbox } = useMeridianMutation({
        invalidateKeys: [['habits'], ['habit_entries'], ['habit-dates']],
    });

    // ── Notifications ──────────────────────────────────────────────────────────

    const cancelTimerNotifications = useCallback(async () => {
        for (const ref of [plannedNotifIdRef, overtimeNotifIdRef, doubleNotifIdRef]) {
            if (ref.current) {
                await cancelScheduledNotification(ref.current);
                ref.current = null;
            }
        }
    }, []);

    const scheduleNotifications = useCallback(async (elapsed: number, h: any) => {
        await cancelTimerNotifications();
        const targetSeconds = (h.planned_time_minutes || 10) * 60;

        if (elapsed < targetSeconds) {
            plannedNotifIdRef.current = await scheduleTimerNotification(
                h.name, targetSeconds - elapsed,
                'Timer Complete!', `Great job focusing on ${h.name}.`
            );
        }
        const overtimeSec = Math.round(targetSeconds * 1.3);
        if (elapsed < overtimeSec) {
            overtimeNotifIdRef.current = await scheduleTimerNotification(
                h.name, overtimeSec - elapsed,
                'Are you still tracking?',
                `Open the app to continue tracking ${h.name}, otherwise progress will be saved at the 30% overtime mark.`
            );
        }
        const doubleSec = Math.round(targetSeconds * 2.0);
        if (elapsed < doubleSec) {
            doubleNotifIdRef.current = await scheduleTimerNotification(
                h.name, doubleSec - elapsed,
                'Timer Limit Reached',
                `Your ${h.name} session reached its limit and has been saved.`
            );
        }
    }, [cancelTimerNotifications]);

    // ── Save helper ────────────────────────────────────────────────────────────

    const persistSave = useCallback(async (
        seconds: number,
        preferredStatus: 'Completed' | 'Partial',
        h: any
    ) => {
        await cancelTimerNotifications();
        const actualMinutes = Math.max(1, Math.round(seconds / 60));
        try {
            const totalMinutesToday = (h.today_tracked_minutes || 0) + actualMinutes;
            const plannedSeconds = (h.planned_time_minutes || 0) * 60;
            const cumulativeSeconds = ((h.today_tracked_minutes || 0) * 60) + seconds;

            // 50% completion threshold evaluated with second-level precision
            const isCompleted = plannedSeconds <= 0 || cumulativeSeconds >= (plannedSeconds * 0.5);
            const status: 'Completed' | 'Partial' = isCompleted ? 'Completed' : 'Partial';

            const isDone = status === 'Completed';
            const newNotificationIds = await refreshHabitNotifications(h, totalMinutesToday, isDone);
            const trackedResult = await trackHabit({
                habit_id: h.id,
                entry_date: new Date().toISOString(),
                status,
                actual_time_minutes: actualMinutes,
                notification_ids: JSON.stringify(newNotificationIds),
            });
            queryClient.invalidateQueries({ queryKey: ['habit', h.id] });
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habit_entries', h.id] });
            queryClient.invalidateQueries({ queryKey: ['habit-dates', h.id] });
            await mutateOutbox('track_habit', trackedResult);
            if (status === 'Completed') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e: any) {
            console.error('Timer save error:', e);
            Alert.alert('Error saving habit:', e.message);
        }
    }, [cancelTimerNotifications, mutateOutbox, queryClient]);

    // ── Tick + overtime logic ──────────────────────────────────────────────────

    const stopInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const clearTimerState = useCallback(() => {
        stopInterval();
        setHabit(null);
        setStartTimestamp(null);
        setIsRunning(false);
        setSecondsElapsed(0);
        setOvertimePromptShown(false);
        habitRef.current = null;
        startTimestampRef.current = null;
        isRunningRef.current = false;
        secondsElapsedRef.current = 0;
        overtimePromptShownRef.current = false;
    }, [stopInterval]);

    const startInterval = useCallback(() => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            const h = habitRef.current;
            if (!h || startTimestampRef.current === null) return;

            const targetSeconds = (h.planned_time_minutes || 10) * 60;
            const now = Date.now();
            const currentElapsed = Math.round((now - startTimestampRef.current) / 1000);

            // Double-time limit → auto-save & close
            if (currentElapsed >= targetSeconds * 2.0) {
                const cappedSeconds = Math.round(targetSeconds * 2.0);
                setIsRunning(false);
                isRunningRef.current = false;
                stopInterval();
                persistSave(cappedSeconds, 'Completed', h).then(() => {
                    clearTimerState();
                });
                return;
            }

            // 130% overtime prompt
            if (currentElapsed >= targetSeconds * 1.3 && !overtimePromptShownRef.current) {
                const capped = Math.round(targetSeconds * 1.3);
                setIsRunning(false);
                isRunningRef.current = false;
                setOvertimePromptShown(true);
                overtimePromptShownRef.current = true;
                setSecondsElapsed(capped);
                secondsElapsedRef.current = capped;
                stopInterval();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(
                    'Overtime',
                    'Are you still tracking this habit?',
                    [
                        {
                            text: 'Yes, keep going',
                            onPress: () => {
                                // resume: adjust startTimestamp to account for elapsed
                                const ts = Date.now() - capped * 1000;
                                startTimestampRef.current = ts;
                                setStartTimestamp(ts);
                                setIsRunning(true);
                                isRunningRef.current = true;
                                startInterval();
                            },
                        },
                        {
                            text: 'No, save now',
                            style: 'destructive',
                            onPress: () => {
                                persistSave(capped, 'Completed', h).then(() => {
                                    clearTimerState();
                                });
                            },
                        },
                    ]
                );
                return;
            }

            setSecondsElapsed(currentElapsed);
            secondsElapsedRef.current = currentElapsed;
        }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopInterval, persistSave, clearTimerState]);

    // ── AppState background resume ─────────────────────────────────────────────

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState !== 'active') return;
            if (!isRunningRef.current || startTimestampRef.current === null) return;
            const h = habitRef.current;
            if (!h) return;

            const targetSeconds = (h.planned_time_minutes || 10) * 60;
            const elapsed = Math.round((Date.now() - startTimestampRef.current) / 1000);

            if (elapsed >= targetSeconds * 2.0) {
                const capped = Math.round(targetSeconds * 2.0);
                setIsRunning(false);
                stopInterval();
                persistSave(capped, 'Completed', h).then(() => clearTimerState());
            } else if (elapsed >= targetSeconds * 1.3) {
                setIsRunning(false);
                stopInterval();
                persistSave(Math.round(targetSeconds * 1.3), 'Completed', h).then(() => clearTimerState());
            } else {
                setSecondsElapsed(elapsed);
                secondsElapsedRef.current = elapsed;
            }
        });
        return () => sub.remove();
    }, [persistSave, clearTimerState, stopInterval]);

    // ── Public API ─────────────────────────────────────────────────────────────

    const startTimer = useCallback((h: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const ts = Date.now();
        setHabit(h);
        habitRef.current = h;
        setStartTimestamp(ts);
        startTimestampRef.current = ts;
        setIsRunning(true);
        isRunningRef.current = true;
        setSecondsElapsed(0);
        secondsElapsedRef.current = 0;
        setOvertimePromptShown(false);
        overtimePromptShownRef.current = false;
        scheduleNotifications(0, h);
        startInterval();
    }, [scheduleNotifications, startInterval]);

    const pauseTimer = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(false);
        isRunningRef.current = false;
        stopInterval();
        cancelTimerNotifications();
    }, [stopInterval, cancelTimerNotifications]);

    const resumeTimer = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const ts = Date.now() - secondsElapsedRef.current * 1000;
        setStartTimestamp(ts);
        startTimestampRef.current = ts;
        setIsRunning(true);
        isRunningRef.current = true;
        const h = habitRef.current;
        if (h) scheduleNotifications(secondsElapsedRef.current, h);
        startInterval();
    }, [scheduleNotifications, startInterval]);

    const cancelTimer = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const elapsed = secondsElapsedRef.current;
        const h = habitRef.current;

        if (elapsed === 0 || !h) {
            clearTimerState();
            return;
        }

        // stop tick while prompt is shown
        const wasRunning = isRunningRef.current;
        setIsRunning(false);
        isRunningRef.current = false;
        stopInterval();

        Alert.alert(
            'Cancel Session',
            'Do you want to discard this session?',
            [
                {
                    text: 'Keep going',
                    style: 'cancel',
                    onPress: () => {
                        if (wasRunning) {
                            const ts = Date.now() - elapsed * 1000;
                            setStartTimestamp(ts);
                            startTimestampRef.current = ts;
                            setIsRunning(true);
                            isRunningRef.current = true;
                            startInterval();
                        }
                    },
                },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => {
                        cancelTimerNotifications();
                        clearTimerState();
                    },
                },
                {
                    text: 'Save progress',
                    onPress: () => {
                        persistSave(elapsed, 'Partial', h).then(() => clearTimerState());
                    },
                },
            ]
        );
    }, [clearTimerState, cancelTimerNotifications, persistSave, startInterval, stopInterval]);

    const saveTimer = useCallback(async (status?: 'Completed' | 'Partial') => {
        const h = habitRef.current;
        const elapsed = secondsElapsedRef.current;
        stopInterval();
        if (h && elapsed > 0) {
            await persistSave(elapsed, status || 'Completed', h);
        }
        clearTimerState();
    }, [clearTimerState, persistSave, stopInterval]);

    // cleanup on unmount
    useEffect(() => () => { stopInterval(); }, [stopInterval]);

    return (
        <TimerContext.Provider value={{
            habit,
            startTimestamp,
            isRunning,
            secondsElapsed,
            startTimer,
            pauseTimer,
            resumeTimer,
            cancelTimer,
            saveTimer,
        }}>
            {children}
        </TimerContext.Provider>
    );
}
