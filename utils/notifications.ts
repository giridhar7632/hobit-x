import { HABIT_NOTIFICATIONS } from '@/constants/messages';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from './types';

export function getSmartNotification(
    habit: Pick<
        Habit,
        | 'id'
        | 'name'
        | 'completion_type'
        | 'current_streak'
        | 'reminder_message'
    >,
    scheduledHour?: number,
    date: string = new Date().toISOString().slice(0, 10)
): {
    title: string;
    body: string;
} {
    const habitName = habit.name?.trim() || 'your habit';

    if (habit.reminder_message?.trim()) {
        let body = habit.reminder_message
            .trim()
            .replace(/\{habit\}/g, habitName);

        return {
            title: 'Quick Reminder',
            body,
        };
    }

    let timeTag:
        | 'morning'
        | 'afternoon'
        | 'evening'
        | undefined;

    if (scheduledHour !== undefined && Number.isFinite(scheduledHour)) {
        if (scheduledHour < 12) {
            timeTag = 'morning';
        } else if (scheduledHour < 17) {
            timeTag = 'afternoon';
        } else {
            timeTag = 'evening';
        }
    }

    const completionType =
        habit.completion_type === 'check' ||
            habit.completion_type === 'time' ||
            habit.completion_type === 'quantity'
            ? habit.completion_type
            : 'check';

    const streak =
        typeof habit.current_streak === 'number'
            ? Math.max(0, habit.current_streak)
            : 0;

    const candidates = HABIT_NOTIFICATIONS
        .map((template) => {
            let score = 0;

            if (template.tags.includes('general')) {
                score += 4;
            }

            if (
                timeTag &&
                template.tags.includes(timeTag)
            ) {
                score += 6;
            }

            if (
                template.tags.includes(
                    completionType
                )
            ) {
                score += 9;
            }

            if (template.tags.includes('streak')) {
                if (streak >= 3) {
                    score += 5;
                } else {
                    score = 0;
                }
            }

            return {
                template,
                score,
            };
        })
        .filter(
            (candidate) => candidate.score > 0
        );

    const seedString = `${habit.id}:${date}:${scheduledHour ?? 'unknown'}`;

    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash =
            (hash << 5) -
            hash +
            seedString.charCodeAt(i);

        hash |= 0;
    }

    const positiveHash = Math.abs(hash);
    const totalWeight = candidates.reduce(
        (sum, candidate) =>
            sum + candidate.score,
        0
    );

    let random = (positiveHash % 1000000) / 1000000 * totalWeight;
    let selected = candidates[candidates.length - 1].template;

    for (const candidate of candidates) {
        random -= candidate.score;
        if (random <= 0) {
            selected = candidate.template;
            break;
        }
    }

    const placeholderCount = (selected.title.match(/\{habit\}/g)?.length ?? 0) + (selected.body.match(/\{habit\}/g)?.length ?? 0);

    if (placeholderCount !== 1) {
        return {
            title: 'Almost Time',
            body: `${habitName} starts in 5 minutes. Start getting ready when you can.`,
        };
    }
    return {
        title: selected.title.replace(/\{habit\}/g, habitName),
        body: selected.body.replace(/\{habit\}/g, habitName),
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

export function parseTargetDays(targetDays: any): number[] {
    if (!targetDays) return [];

    let rawList: any[] = [];
    if (Array.isArray(targetDays)) {
        rawList = targetDays;
    } else if (typeof targetDays === 'string') {
        const trimmed = targetDays.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                rawList = parsed;
            } else if (typeof parsed === 'number') {
                rawList = [parsed];
            }
        } catch {
            // Handle comma-separated strings like "1,2,3,4,5"
            if (trimmed.includes(',')) {
                rawList = trimmed.split(',');
            } else if (!isNaN(Number(trimmed))) {
                rawList = [Number(trimmed)];
            }
        }
    }

    const validDays = new Set<number>();
    for (const item of rawList) {
        const num = typeof item === 'number' ? item : parseInt(String(item).trim(), 10);
        // Valid JS day-of-week integers: 0 (Sunday) through 6 (Saturday)
        if (!isNaN(num) && num >= 0 && num <= 6) {
            validDays.add(num);
        }
    }

    return Array.from(validDays).sort((a, b) => a - b);
}

export function formatHabitSchedule(habit: {
    frequency?: string | null;
    target_days?: any;
    interval?: number | null;
}): string {
    const freq = habit?.frequency || 'daily';

    if (freq === 'daily') {
        return 'Every day';
    }

    if (freq === 'weekly') {
        const days = parseTargetDays(habit?.target_days);
        const count = days.length;
        if (count === 0) return 'Weekly';
        if (count === 7) return '7 days per week';
        if (count === 1) return '1 day per week';
        return `${count} days per week`;
    }

    if (freq === 'interval') {
        const interval = Math.max(1, Number(habit?.interval) || 1);
        if (interval === 1) return 'Every day';
        return `Every ${interval} days`;
    }

    if (freq === 'monthly') {
        return 'Monthly';
    }

    return 'Every day';
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

    const targetDays = parseTargetDays(habit.target_days);

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
            let isTargetDay = true;
            if (habit.frequency === 'weekly') {
                isTargetDay = targetDays.length === 0 || targetDays.includes(dayOfWeek);
            } else if (habit.frequency === 'interval') {
                const interval = Math.max(1, Number(habit.interval) || 1);
                if (interval > 1) {
                    const startDateStr = habit.start_date ? habit.start_date.split('T')[0] : todayISO;
                    const start = new Date(startDateStr + 'T00:00:00');
                    const diffMs = date.getTime() - start.getTime();
                    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                    isTargetDay = diffDays >= 0 && diffDays % interval === 0;
                }
            }

            if (!isTargetDay) continue;

            let { title, body } = getSmartNotification(habit, hour);
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