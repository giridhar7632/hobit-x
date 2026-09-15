import { ENCOURAGING_MESSAGES, NOTIFICATION_TITLES } from '@/constants/messages';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function getRandomNotification(habitName: string): { title: string; body: string } {
    const randomBodyTemplate = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
    const randomTitle = NOTIFICATION_TITLES[Math.floor(Math.random() * NOTIFICATION_TITLES.length)];
    return {
        title: randomTitle,
        body: randomBodyTemplate.replace(/\{habit\}/g, habitName),
    };
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export function parseTimesOfDay(tod: any): TimeOfDay[] {
    if (!tod) return ['anytime'];
    if (Array.isArray(tod)) {
        const valid = tod.filter((t): t is TimeOfDay =>
            ['morning', 'afternoon', 'evening', 'anytime'].includes(t)
        );
        return valid.length > 0 ? valid : ['anytime'];
    }
    if (typeof tod === 'string') {
        try {
            const parsed = JSON.parse(tod);
            if (Array.isArray(parsed)) {
                const valid = parsed.filter((t): t is TimeOfDay =>
                    ['morning', 'afternoon', 'evening', 'anytime'].includes(t)
                );
                if (valid.length > 0) return valid;
            }
        } catch {
            if (tod.includes(',')) {
                const parts = tod.split(',').map(s => s.trim().toLowerCase()) as TimeOfDay[];
                const valid = parts.filter(t => ['morning', 'afternoon', 'evening', 'anytime'].includes(t));
                if (valid.length > 0) return valid;
            }
        }
        const clean = tod.trim().toLowerCase() as TimeOfDay;
        if (['morning', 'afternoon', 'evening', 'anytime'].includes(clean)) {
            return [clean];
        }
    }
    return ['anytime'];
}

export function formatTimesOfDay(tod: any): string {
    const times = parseTimesOfDay(tod);
    if (times.includes('anytime') && times.length === 1) return 'Anytime';
    const labels: Record<TimeOfDay, string> = {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        anytime: 'Anytime',
    };
    return times.map(t => labels[t] || t).join(', ');
}

export function getDefaultReminderTimesForSessions(tod: any): Date[] {
    const times: TimeOfDay[] = parseTimesOfDay(tod);
    const timeMap: Record<TimeOfDay, { hour: number; minute: number }> = {
        morning: { hour: 8, minute: 0 },
        afternoon: { hour: 17, minute: 0 },
        evening: { hour: 19, minute: 0 },
        anytime: { hour: 9, minute: 0 },
    };

    const withoutAnytime = times.filter((t): t is TimeOfDay => t !== 'anytime');
    const activeList: TimeOfDay[] = withoutAnytime.length > 0 ? withoutAnytime : ['anytime'];

    const dates: Date[] = activeList.map((session) => {
        const config = timeMap[session] || timeMap.anytime;
        const d = new Date();
        d.setHours(config.hour, config.minute, 0, 0);
        return d;
    });

    dates.sort((a, b) => a.getHours() * 60 + a.getMinutes() - (b.getHours() * 60 + b.getMinutes()));
    return dates;
}

export function parseNotifyTimes(notifyTime: string | null | undefined): string[] {
    if (!notifyTime) return [];
    try {
        const parsed = JSON.parse(notifyTime);
        if (Array.isArray(parsed)) {
            return parsed.filter(Boolean);
        }
    } catch (e) {
        // Single string format
    }
    return [notifyTime];
}

export function getHabitTotalReminders(habit: any): number {
    if (!habit) return 1;
    const timesOfDay = parseTimesOfDay(habit.time_of_day);
    const specificTimesCount = timesOfDay.filter(t => t !== 'anytime').length;
    const notifyTimes = habit.notify ? parseNotifyTimes(habit.notify_time) : [];
    const count = Math.max(specificTimesCount, notifyTimes.length, 1);
    return Math.min(5, count);
}

export async function requestNotificationPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function cancelHabitNotifications(
    habitId?: string | null,
    storedNotificationIds?: string[] | string | null
): Promise<void> {
    if (Platform.OS === 'web') return;

    // 1. Cancel explicitly stored IDs
    let oldIds: string[] = [];
    if (storedNotificationIds) {
        if (typeof storedNotificationIds === 'string') {
            try {
                const parsed = JSON.parse(storedNotificationIds);
                if (Array.isArray(parsed)) {
                    oldIds = parsed;
                } else if (typeof parsed === 'string') {
                    oldIds = [parsed];
                }
            } catch {
                oldIds = [storedNotificationIds];
            }
        } else if (Array.isArray(storedNotificationIds)) {
            oldIds = storedNotificationIds;
        }
    }

    for (const id of oldIds) {
        if (typeof id === 'string' && id.trim()) {
            try {
                await Notifications.cancelScheduledNotificationAsync(id.trim());
            } catch (cancelError) {
                // Ignore individual cancellation failures on Android/iOS
            }
        }
    }

    // 2. Query OS scheduler to reconcile and cancel any orphaned/stale notifications
    // matching this habit ID or legacy 'habit-new-' notifications
    try {
        if (typeof Notifications.getAllScheduledNotificationsAsync === 'function') {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const prefix = habitId ? `habit-${habitId}-` : null;
            for (const item of scheduled) {
                const ident = item.identifier;
                if (!ident) continue;
                if ((prefix && ident.startsWith(prefix)) || ident.startsWith('habit-new-')) {
                    try {
                        await Notifications.cancelScheduledNotificationAsync(ident);
                    } catch {
                        // Ignore individual cancellation failures
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Error reconciling scheduled notifications from OS:', err);
    }
}

export async function refreshHabitNotifications(
    habit: any,
    trackedMinutesToday: number = 0,
    isCompletedToday: boolean = false
) {
    if (Platform.OS === 'web') return [];

    // Always reconcile and cancel old / existing scheduled notifications first
    await cancelHabitNotifications(habit?.id, habit?.notification_ids);

    if (!habit.notify || !habit.notify_time) return [];

    const notifyTimes = parseNotifyTimes(habit.notify_time);
    if (notifyTimes.length === 0) return [];

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const targetDays = typeof habit.target_days === 'string'
        ? JSON.parse(habit.target_days)
        : (habit.target_days || []);

    const newIds: string[] = [];
    const progress = trackedMinutesToday / (habit.planned_time_minutes || 1);
    const todayISO = new Date().toISOString().split('T')[0];

    const isDoneToday = isCompletedToday ||
        progress >= 1 ||
        habit.last_completed_date?.startsWith(todayISO);

    const WINDOW_DAYS = 7;
    const ADVANCE_MINUTES = 5;

    for (let reminderIdx = 0; reminderIdx < notifyTimes.length; reminderIdx++) {
        const timeStr = notifyTimes[reminderIdx];
        const notifyDate = new Date(timeStr);
        if (isNaN(notifyDate.getTime())) continue;

        // Smart scheduling: Calculate trigger time 5 minutes before planned time
        const reminderTarget = new Date(notifyDate.getTime() - ADVANCE_MINUTES * 60 * 1000);
        const hour = reminderTarget.getHours();
        const minute = reminderTarget.getMinutes();

        for (let i = 0; i < WINDOW_DAYS; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setHours(hour, minute, 0, 0);

            if (date.getTime() < Date.now()) continue;

            const dayOfWeek = date.getDay(); // 0 is Sunday
            const isTargetDay = targetDays.length === 0 || targetDays.includes(dayOfWeek);

            if (!isTargetDay) continue;

            let { title, body } = getRandomNotification(habit.name);
            if (habit.reminder_message && habit.reminder_message.trim()) {
                body = habit.reminder_message.trim();
            }

            if (i === 0) {
                if (isDoneToday) {
                    // Today's habit is completed/skipped — do NOT schedule a notification for today
                    continue;
                } else if (progress >= 0.5) {
                    title = "You're halfway there!";
                    body = `You've done 50% of ${habit.name}. Finish strong!`;
                }
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            const habitKey = habit.id || 'temp';
            const identifier = `habit-${habitKey}-${dateKey}-rem-${reminderIdx}`;

            const id = await Notifications.scheduleNotificationAsync({
                identifier,
                content: { title, body, sound: true },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: date,
                },
            });
            newIds.push(id);
        }
    }

    return newIds;
}

export async function scheduleTimerNotification(habitName: string, seconds: number, title?: string, body?: string) {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: title || "Timer Complete!",
            body: body || `Great job focusing on ${habitName}.`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.round(seconds))
        },
    });

    return id;
}

export async function cancelScheduledNotification(notificationId: string | null) {
    if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
}