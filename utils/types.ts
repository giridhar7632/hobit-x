export interface User {
  email: string;
  password?: string;
  name?: string;
}

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  time_spent: number | null;
  planned_time_minutes: number | null;
  frequency: string;
  target_days: string | null;
  interval: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string | null;
  notify: number;
  notify_time: string | null;
  base_points: number | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

export interface HabitEntry {
  id: number;
  habit_id: number;
  note: string | null;
  actual_time_minutes: number | null;
  entry_date: string;
  status: 'Completed' | 'Missed' | 'Skipped';
  created_at: string;
  updated_at: string | null;
  points: number;
  streak_on_day: number;
}

export interface HabitStreak {
  current_streak?: number;
  longest_streak?: number;
  last_completed_date?: string;
};