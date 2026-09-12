import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/button';
import {
  CloudSyncIcon,
  GoogleIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
} from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme, useThemeMode } from '@/hooks/use-color-scheme';
import { APP_NAME } from '@/lib/meridian';
import { pullFromCloud } from '@/lib/sync';
import { getHabits } from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { getStorage, useMeridianContext, useQuery, useQueryClient } from 'meridian-lite';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_PURPLE = '#6366F1';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';
  const { themeMode, setThemeMode } = useThemeMode();
  const { activeColor } = useAppTheme();
  const { user, signInWithGoogle, signOut } = useAuth();
  const { isOnline, isSyncing, sync } = useMeridianContext();
  const queryClient = useQueryClient();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const habitsQueryKey = useMemo(() => ['habits'], []);

  const { data: habits = [] } = useQuery({
    queryKey: habitsQueryKey,
    queryFn: getHabits,
  });

  const userId = user?.id ?? null;

  const totalHabits = habits.length;
  const bestStreak = useMemo(() => {
    if (!habits.length) return 0;
    return Math.max(0, ...habits.map((h: any) => h.longest_streak || h.current_streak || 0));
  }, [habits]);
  const activeStreaksCount = useMemo(() => {
    return habits.filter((h: any) => (h.current_streak || 0) > 0).length;
  }, [habits]);

  const refreshOutbox = useCallback(async () => {
    if (!userId) return;
    try {
      const storage = await getStorage(APP_NAME);
      const pending = await storage.getPending();
      setPendingCount(pending.length);
    } catch {
      // ignore
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refreshOutbox();
    }, [refreshOutbox])
  );

  const handleEnableSync = async () => {
    setIsSigningIn(true);
    setSyncMessage(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setSyncMessage(error.message);
      }
    } catch (e: any) {
      setSyncMessage(e.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSyncNow = async () => {
    setIsManualSyncing(true);
    setSyncMessage(null);
    try {
      await sync();
      if (user?.id) {
        const result = await pullFromCloud(user.id);
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: ['habits'] });
          setSyncMessage('All changes synced successfully.');
        } else {
          setSyncMessage('Sync finished with some errors.');
        }
      }
      await refreshOutbox();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your habits on this device will remain saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth' as any);
            } catch (err: any) {
              Alert.alert('Sign Out Error', err?.message || 'Could not sign out.');
            }
          },
        },
      ]
    );
  };

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Guest User';
  const userEmail = user?.email || 'Local Account';

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const mutedText = isDark ? '#8E8E93' : '#6B7280';
  const subCardBg = isDark ? '#2C2C2E' : '#F3F4F6';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 110,
        }}
      >
        <View className="mb-6 mt-2">
          <ThemedText className="text-3xl font-pbold tracking-tight">Your Profile</ThemedText>
        </View>

        <View
          className="p-6 rounded-[32px] mb-8 border"
          style={{
            backgroundColor: cardBg,
            borderColor: cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 24,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center gap-5 mb-7">
            <View className="relative">
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  className="w-[68px] h-[68px] rounded-full border-2 border-purple-500"
                />
              ) : (
                <View
                  className="w-[68px] h-[68px] rounded-full items-center justify-center"
                  style={{ backgroundColor: `${activeColor.accent}15` }}
                >
                  <UserIcon size={32} color={activeColor.accent} />
                </View>
              )}
              {user && (
                <View
                  className="absolute bottom-0 right-0 w-[18px] h-[18px] rounded-full border-[3px]"
                  style={{
                    backgroundColor: isOnline ? '#10B981' : '#EF4444',
                    borderColor: cardBg
                  }}
                />
              )}
            </View>

            <View className="flex-1 justify-center">
              <ThemedText className="text-[22px] font-pbold leading-tight" numberOfLines={1}>
                {userName}
              </ThemedText>
              <Text
                className="text-[13px] font-pmedium mt-1"
                style={{ color: mutedText }}
                numberOfLines={1}
              >
                {userEmail}
              </Text>
            </View>
          </View>

          <View className="h-[1px] mb-6" style={{ backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }} />
          <View className="flex-row justify-between items-end px-1">
            <View>
              <Text className="text-[10px] font-pbold tracking-[1.5px] uppercase mb-1" style={{ color: BRAND_PURPLE }}>
                All-Time Best
              </Text>
              <View className="flex-row items-end gap-1">
                <Text className="text-[40px] font-pbold leading-none tracking-tighter" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {bestStreak}
                </Text>
                <Text className="text-sm font-pmedium mb-1.5" style={{ color: mutedText }}>
                  days
                </Text>
              </View>
            </View>

            <View className="items-end gap-3.5 pb-1">
              <View className="items-end">
                <Text className="text-xl font-pbold leading-none" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {activeStreaksCount}
                </Text>
                <Text
                  className="text-[10px] font-pbold tracking-[1px] uppercase mt-1"
                  style={{ color: mutedText }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Active Streaks
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-pbold leading-none" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  {totalHabits}
                </Text>
                <Text
                  className="text-[10px] font-pbold tracking-[1px] uppercase mt-1"
                  style={{ color: mutedText }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Total Habits
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text
            className="text-[11px] font-pbold tracking-[1.5px] uppercase mb-3 ml-2"
            style={{ color: mutedText }}
          >
            Appearance
          </Text>

          <View
            className="p-5 rounded-[28px] border"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            <View
              className="flex-row p-1.5 rounded-[20px]"
              style={{ backgroundColor: subCardBg }}
            >
              {(
                [
                  { mode: 'system', label: 'System', Icon: SparklesIcon },
                  { mode: 'light', label: 'Light', Icon: SunIcon },
                  { mode: 'dark', label: 'Dark', Icon: MoonIcon },
                ] as const
              ).map(({ mode, label, Icon }) => {
                const isSelected = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => { });
                      setThemeMode(mode);
                    }}
                    className="flex-1 py-3 rounded-2xl flex-row items-center justify-center gap-2"
                    style={{
                      backgroundColor: isSelected ? (isDark ? '#3A3A3C' : '#FFFFFF') : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.06 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 2 : 0,
                    }}
                  >
                    <Icon
                      size={15}
                      color={isSelected ? BRAND_PURPLE : mutedText}
                    />
                    <Text
                      className="text-xs font-psemibold"
                      style={{ color: isSelected ? (isDark ? '#FFFFFF' : '#111827') : mutedText }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text
            className="text-[11px] font-pbold tracking-[1.5px] uppercase mb-3 ml-2"
            style={{ color: mutedText }}
          >
            Data & Sync
          </Text>

          <View
            className="p-5 rounded-[28px] border"
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          >
            {user ? (
              <View>
                <View className="flex-row items-center justify-between pb-4 border-b" style={{ borderColor: isDark ? '#2C2C2E' : '#F3F4F6' }}>
                  <View className="flex-row items-center gap-2.5">
                    <CloudSyncIcon size={18} color={BRAND_PURPLE} />
                    <ThemedText className="text-sm font-psemibold">Sync Status</ThemedText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isOnline ? '#10B981' : '#EF4444' }}
                    />
                    <Text
                      className="text-[13px] font-psemibold"
                      style={{ color: isOnline ? '#10B981' : '#EF4444' }}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-4 pb-1">
                  <Text className="text-[13px] font-pmedium" style={{ color: mutedText }}>
                    Pending Changes
                  </Text>
                  <ThemedText className="text-[13px] font-pbold">
                    {pendingCount === 0 ? 'All synced' : `${pendingCount} pending`}
                  </ThemedText>
                </View>

                {syncMessage && (
                  <View
                    className="p-3.5 rounded-2xl mt-4 border"
                    style={{
                      backgroundColor: `${BRAND_PURPLE}10`,
                      borderColor: `${BRAND_PURPLE}25`,
                    }}
                  >
                    <Text
                      className="text-[13px] font-psemibold text-center leading-5"
                      style={{ color: BRAND_PURPLE }}
                    >
                      {syncMessage}
                    </Text>
                  </View>
                )}

                <Button
                  title="Sync Now"
                  variant="accent"
                  accentColor={BRAND_PURPLE}
                  size="md"
                  loading={isManualSyncing || isSyncing}
                  disabled={isManualSyncing || isSyncing}
                  onPress={handleSyncNow}
                  className="w-full mt-5"
                />
              </View>
            ) : (
              <View>
                <ThemedText className="text-base font-pbold mb-2">
                  Backup & Access Anywhere
                </ThemedText>
                <Text
                  className="text-[13px] font-pregular leading-[22px] mb-5"
                  style={{ color: mutedText }}
                >
                  Your habits and streaks are currently saved only on this device. Sign in with Google to enable automatic cloud backup and never lose your streak.
                </Text>

                {syncMessage && (
                  <Text className="text-xs font-pmedium text-[#EF4444] text-center mb-4">
                    {syncMessage}
                  </Text>
                )}

                <Button
                  title="Sign In with Google"
                  variant="outline"
                  size="md"
                  loading={isSigningIn}
                  disabled={isSigningIn}
                  onPress={handleEnableSync}
                  leftIcon={<GoogleIcon size={18} />}
                  className="w-full"
                />
              </View>
            )}
          </View>
        </View>

        {user && (
          <View className="mb-6">
            <Button
              title="Sign Out"
              variant="danger"
              size="md"
              onPress={handleSignOut}
              className="w-full border-red-500/30"
            />
          </View>
        )}

        <View className="items-center justify-center mt-6 mb-2">
          <Text className="text-[11px] font-pbold tracking-wider mb-1.5" style={{ color: mutedText }}>
            HOBIT • v1.0.0
          </Text>
          <Text className="text-[11px] font-pmedium opacity-60" style={{ color: mutedText }}>
            Build small habits, create big changes 🌱
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}