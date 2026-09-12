import { TimeOfDay } from '@/utils/notifications';

export interface HabitTemplate {
  id: string;
  category: 'Popular' | 'Mind & Focus' | 'Learning' | 'Health & Wellness';
  icon: string; // SVG icon name (from renderHabitIcon) or '🌱'
  name: string;
  description: string;
  color: string;
  time_of_day: TimeOfDay | TimeOfDay[];
  frequency: 'daily' | 'weekly';
  target_days?: number[];
  completion_type: 'check' | 'time' | 'quantity';
  planned_time_minutes?: number;
  target_value?: number;
  target_unit?: string;
  reminder_message?: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // POPULAR
  {
    id: 'reading',
    category: 'Popular',
    icon: 'BookIcon',
    name: 'Reading every day',
    description: 'Read for 20 minutes',
    color: 'yellow',
    time_of_day: 'anytime',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 20,
    target_value: 20,
    target_unit: 'minutes',
    reminder_message: 'Time to dive into your book!',
  },
  {
    id: 'water',
    category: 'Popular',
    icon: 'MugIcon',
    name: 'Drink more water',
    description: 'Stay hydrated every day',
    color: 'blue',
    time_of_day: 'anytime',
    frequency: 'daily',
    completion_type: 'quantity',
    target_value: 8,
    target_unit: 'glasses',
    reminder_message: 'Have a glass of refreshing water!',
  },
  {
    id: 'exercise',
    category: 'Popular',
    icon: 'ActivityIcon',
    name: 'Exercise',
    description: 'Move your body for 30 minutes',
    color: 'green',
    time_of_day: 'morning',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 30,
    target_value: 30,
    target_unit: 'minutes',
    reminder_message: 'Time to get active and energized!',
  },

  // MIND & FOCUS
  {
    id: 'meditate',
    category: 'Mind & Focus',
    icon: 'LampIcon', // TODO: replace with a dedicated meditate/focus icon when available
    name: 'Meditate',
    description: 'Take 10 minutes for yourself',
    color: 'cyan',
    time_of_day: 'morning',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 10,
    target_value: 10,
    target_unit: 'minutes',
    reminder_message: 'Pause and take a mindful breath.',
  },
  {
    id: 'journal',
    category: 'Mind & Focus',
    icon: 'EditIcon', // TODO: replace with NotebookIcon / JournalIcon when added
    name: 'Journal',
    description: 'Reflect on your day',
    color: 'yellow',
    time_of_day: 'evening',
    frequency: 'daily',
    completion_type: 'check',
    reminder_message: 'Time to put your thoughts on paper.',
  },
  {
    id: 'screen_time',
    category: 'Mind & Focus',
    icon: 'BellDisabledIcon', // digital detox / no-phone
    name: 'Reduce screen time',
    description: 'Spend less time scrolling',
    color: 'pink',
    time_of_day: 'evening',
    frequency: 'daily',
    completion_type: 'check',
    reminder_message: 'Unplug and unwind for the night.',
  },

  // LEARNING
  {
    id: 'coding',
    category: 'Learning',
    icon: 'LightningIcon', // TODO: replace with iMac/CodeIcon when added
    name: 'Practice coding',
    description: 'Improve your programming skills',
    color: 'orange',
    time_of_day: 'afternoon',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 45,
    target_value: 45,
    target_unit: 'minutes',
    reminder_message: 'Code session time — build something cool!',
  },
  {
    id: 'language',
    category: 'Learning',
    icon: 'BookIcon', // TODO: replace with SpeakerIcon / LanguageIcon when added
    name: 'Learn a language',
    description: 'Practice every day',
    color: 'blue',
    time_of_day: 'anytime',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 15,
    target_value: 15,
    target_unit: 'minutes',
    reminder_message: 'Practice your vocabulary today!',
  },
  {
    id: 'study',
    category: 'Learning',
    icon: 'BookIcon',
    name: 'Study',
    description: 'Make time to learn',
    color: 'green',
    time_of_day: 'afternoon',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 30,
    target_value: 30,
    target_unit: 'minutes',
    reminder_message: 'Focus session: make time to learn.',
  },

  // HEALTH & WELLNESS
  {
    id: 'vitamins',
    category: 'Health & Wellness',
    icon: 'HeartIcon', // TODO: replace with PillIcon when added
    name: 'Take vitamins',
    description: 'Daily supplements and health',
    color: 'pink',
    time_of_day: 'morning',
    frequency: 'daily',
    completion_type: 'check',
    reminder_message: 'Take your daily vitamins and nutrients.',
  },
  {
    id: 'sleep',
    category: 'Health & Wellness',
    icon: 'MoonIcon',
    name: 'Sleep well',
    description: 'Get 8 hours of restful sleep',
    color: 'blue',
    time_of_day: 'evening',
    frequency: 'daily',
    completion_type: 'time',
    planned_time_minutes: 480,
    target_value: 8,
    target_unit: 'hours',
    reminder_message: 'Wind down and prepare for a great sleep.',
  },
  {
    id: 'skincare',
    category: 'Health & Wellness',
    icon: 'StarIcon', // TODO: replace with SkinCare / SparklesIcon or a dedicated care icon
    name: 'Skincare routine',
    description: 'Morning & evening self-care',
    color: 'pink',
    time_of_day: ['morning', 'evening'],
    frequency: 'daily',
    completion_type: 'check',
    reminder_message: 'Time for your refreshing skincare routine!',
  },
];

export const TEMPLATE_CATEGORIES = [
  'Popular',
  'Mind & Focus',
  'Learning',
  'Health & Wellness',
] as const;
