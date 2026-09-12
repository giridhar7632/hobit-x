import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/button';
import { GoogleIcon, UserIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme, useThemeMode } from '@/hooks/use-color-scheme';
import { APP_NAME } from '@/lib/meridian';
import { pullFromCloud } from '@/lib/sync';
import { getHabits } from '@/utils/actions';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { router, useFocusEffect } from 'expo-router';
import { getStorage, useMeridianContext, useQuery, useQueryClient } from 'meridian-lite';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
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

  // Fetch local habits
  const { data: habits = [] } = useQuery({
    queryKey: habitsQueryKey,
    queryFn: getHabits,
  });

  const userId = user?.id ?? null;

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
        Alert.alert('Notice', error.message);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sign in');
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
          setSyncMessage('All changes synced.');
        } else {
          setSyncMessage('Sync finished.');
        }
      }
      await refreshOutbox();
    } catch (err: any) {
      Alert.alert('Sync Notice', err.message || 'Sync failed');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Hobit User';
  const userEmail = user?.email || 'Guest Account';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 110,
        }}
      >
        <View>
          <ThemedText className="text-3xl font-pbold mb-8">Profile</ThemedText>

          {/* User Header */}
          <View className="flex-row items-center gap-4 mb-8">
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                className="w-16 h-16 rounded-full border-2 border-purple-500"
              />
            ) : (
              <View
                className="w-16 h-16 rounded-full items-center justify-center border border-purple-500/30"
                style={{ backgroundColor: `${activeColor.accent}20` }}
              >
                <UserIcon size={30} color={activeColor.accent} />
              </View>
            )}

            <View className="flex-1">
              <ThemedText className="text-xl font-pbold" numberOfLines={1}>
                {user ? userName : 'Guest User'}
              </ThemedText>
              <ThemedText className="text-sm font-pregular opacity-50 mt-0.5" numberOfLines={1}>
                {userEmail}
              </ThemedText>

              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className="px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: user ? '#4655E020' : '#73737320',
                  }}
                >
                  <Text
                    className="text-xs font-psemibold"
                    style={{ color: user ? '#4655E0' : '#a3a3a3' }}
                  >
                    {user ? 'Cloud Synced' : 'Offline Mode'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View
            className="h-[1px] w-full mb-8"
            style={{ backgroundColor: currentTheme === 'dark' ? '#27272a' : '#e4e4e7' }}
          />

          {/* Appearance Section */}
          <View className="mb-8">
            <ThemedText className="text-base font-pbold mb-4">Appearance</ThemedText>
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row gap-3 w-full justify-between">
                {(['light', 'dark', 'system'] as const).map((mode) => {
                  const isSelected = themeMode === mode;
                  const label = mode.charAt(0).toUpperCase() + mode.slice(1);
                  return (
                    <TouchableOpacity
                      key={mode}
                      activeOpacity={0.7}
                      onPress={() => setThemeMode(mode)}
                      className="flex-1 py-3 rounded-xl border items-center justify-center"
                      style={{
                        backgroundColor: isSelected
                          ? activeColor.accent
                          : (currentTheme === 'dark' ? '#262626' : '#f5f5f5'),
                        borderColor: isSelected
                          ? activeColor.accent
                          : (currentTheme === 'dark' ? '#404040' : '#e5e5e5'),
                      }}
                    >
                      <Text
                        className="font-psemibold text-sm"
                        style={{
                          color: isSelected
                            ? '#ffffff'
                            : (currentTheme === 'dark' ? '#d4d4d4' : '#525252'),
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section Divider */}
          <View
            className="h-[1px] w-full mb-8"
            style={{ backgroundColor: currentTheme === 'dark' ? '#27272a' : '#e4e4e7' }}
          />

          {/* Logged-In Outbox & Cloud Sync Details */}
          {user ? (
            <View className="space-y-6">
              <View className="flex-row items-center justify-between py-2">
                <ThemedText className="text-sm font-pmedium opacity-70">
                  Habits Tracked
                </ThemedText>
                <ThemedText className="text-sm font-pbold">
                  {habits.length}
                </ThemedText>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <ThemedText className="text-sm font-pmedium opacity-70">
                  Network Status
                </ThemedText>
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isOnline ? '#4655E0' : '#ef4444' }}
                  />
                  <Text
                    className="text-sm font-pmedium"
                    style={{ color: isOnline ? '#4655E0' : '#ef4444' }}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <ThemedText className="text-sm font-pmedium opacity-70">
                  Pending Uploads
                </ThemedText>
                <ThemedText className="text-sm font-pbold">
                  {pendingCount === 0 ? 'All synced' : `${pendingCount} pending`}
                </ThemedText>
              </View>

              {syncMessage && (
                <View className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mt-4">
                  <Text className="text-purple-600 dark:text-purple-400 text-xs font-pmedium text-center">
                    {syncMessage}
                  </Text>
                </View>
              )}

              {/* Sync Now Action */}
              <Button
                title="Sync Now"
                variant="accent"
                accentColor={activeColor.accent}
                size="md"
                loading={isManualSyncing || isSyncing}
                disabled={isManualSyncing || isSyncing}
                onPress={handleSyncNow}
                className="w-full mt-6"
              />
            </View>
          ) : (
            /* Guest View - Explanatory & Accessible Sign In */
            <View>
              <ThemedText className="text-base font-pbold mb-2">
                Cloud Backup
              </ThemedText>

              <Text
                className="text-sm font-pregular opacity-60 leading-6 mb-6"
                style={{ color: Colors[currentTheme].text }}
              >
                Your habits and streaks are currently saved only on this device. Sign in with Google to backup your progress and access your habits anywhere.
              </Text>

              {/* Accessible Google Sign In Button */}
              <Button
                title="Sign In with Google"
                variant="outline"
                size="default"
                loading={isSigningIn}
                disabled={isSigningIn}
                onPress={handleEnableSync}
                leftIcon={<GoogleIcon size={20} />}
                className="w-full"
              />
            </View>
          )}
        </View>

        {/* Accessible Sign Out Button */}
        {user && (
          <Button
            title="Sign Out"
            variant="danger"
            size="md"
            onPress={handleSignOut}
            className="w-full mt-8"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
