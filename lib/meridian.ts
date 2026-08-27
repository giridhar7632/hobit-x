import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { APP_NAME, databaseMigrations } from '@/utils/database';
import { Habit, HabitEntry } from '@/utils/types';
import { MutationRecord } from 'meridian-lite';

export { APP_NAME, databaseMigrations };

export async function handleSync(mutation: MutationRecord): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Supabase not configured in .env, skip remote sync safely
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    // User is in guest/local mode; mutations are stored locally
    return;
  }

  const { type, payload } = mutation;

  switch (type) {
    case 'create_habit': {
      const habit = payload as Habit;
      const { error } = await supabase.from('habits').upsert({
        id: habit.id,
        user_id: user.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        time_spent: habit.time_spent ?? 0,
        planned_time_minutes: habit.planned_time_minutes ?? 0,
        frequency: habit.frequency || 'daily',
        target_days:
          typeof habit.target_days === 'string'
            ? habit.target_days
            : JSON.stringify(habit.target_days || []),
        interval: habit.interval ?? 1,
        start_date: habit.start_date,
        end_date: habit.end_date,
        notify: habit.notify ?? 0,
        notify_time: habit.notify_time,
        base_points: habit.base_points,
        total_points: habit.total_points ?? 0,
        current_streak: habit.current_streak ?? 0,
        longest_streak: habit.longest_streak ?? 0,
        last_completed_date: habit.last_completed_date,
        last_active_date: habit.last_active_date,
        notification_ids:
          typeof habit.notification_ids === 'string'
            ? habit.notification_ids
            : JSON.stringify(habit.notification_ids || []),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      break;
    }

    case 'update_habit': {
      const habit = payload as Habit;
      const { error } = await supabase
        .from('habits')
        .update({
          name: habit.name,
          description: habit.description,
          color: habit.color,
          frequency: habit.frequency,
          planned_time_minutes: habit.planned_time_minutes,
          interval: habit.interval,
          target_days:
            typeof habit.target_days === 'string'
              ? habit.target_days
              : JSON.stringify(habit.target_days || []),
          notify: habit.notify,
          notify_time: habit.notify_time,
          base_points: habit.base_points,
          notification_ids:
            typeof habit.notification_ids === 'string'
              ? habit.notification_ids
              : JSON.stringify(habit.notification_ids || []),
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id)
        .eq('user_id', user.id);

      if (error) throw error;
      break;
    }

    case 'delete_habit': {
      const { id } = payload as { id: string };
      // Delete entries first (cascade also handles it on Supabase)
      await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      break;
    }

    case 'track_habit': {
      const data = payload as {
        entry_id: string;
        habit_id: string;
        entry_date: string;
        status: string;
        actual_time_minutes: number;
        points: number;
        streak_on_day: number;
        note?: string;
        habit_stats?: {
          total_points: number;
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          last_active_date: string | null;
          notification_ids?: string;
        };
      };

      // 1. Upsert habit entry
      const { error: entryError } = await supabase.from('habit_entries').upsert({
        id: data.entry_id,
        habit_id: data.habit_id,
        user_id: user.id,
        note: data.note || null,
        actual_time_minutes: data.actual_time_minutes || 0,
        entry_date: data.entry_date,
        status: data.status,
        points: data.points || 0,
        streak_on_day: data.streak_on_day || 0,
        updated_at: new Date().toISOString(),
      });

      if (entryError) throw entryError;

      // 2. Update habit summary stats if provided
      if (data.habit_stats) {
        const updateObj: Record<string, any> = {
          total_points: data.habit_stats.total_points,
          current_streak: data.habit_stats.current_streak,
          longest_streak: data.habit_stats.longest_streak,
          last_completed_date: data.habit_stats.last_completed_date,
          last_active_date: data.habit_stats.last_active_date,
          updated_at: new Date().toISOString(),
        };
        if (data.habit_stats.notification_ids) {
          updateObj.notification_ids = data.habit_stats.notification_ids;
        }

        const { error: habitError } = await supabase
          .from('habits')
          .update(updateObj)
          .eq('id', data.habit_id)
          .eq('user_id', user.id);

        if (habitError) throw habitError;
      }
      break;
    }

    case 'delete_entry': {
      const data = payload as {
        entry_id: string;
        habit_id: string;
        habit_stats?: {
          total_points: number;
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          last_active_date: string | null;
        };
      };

      const { error: deleteError } = await supabase
        .from('habit_entries')
        .delete()
        .eq('id', data.entry_id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      if (data.habit_stats) {
        const { error: updateError } = await supabase
          .from('habits')
          .update({
            total_points: data.habit_stats.total_points,
            current_streak: data.habit_stats.current_streak,
            longest_streak: data.habit_stats.longest_streak,
            last_completed_date: data.habit_stats.last_completed_date,
            last_active_date: data.habit_stats.last_active_date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.habit_id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }
      break;
    }

    default:
      console.warn(`[MeridianSync] Unhandled mutation type: ${type}`);
  }
}
