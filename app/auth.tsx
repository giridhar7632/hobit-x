import { ThemedText } from '@/components/themed-text';
import Button from '@/components/ui/button';
import { GoogleIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { user, isGuest, signInWithGoogle, signInAsGuest } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  React.useEffect(() => {
    if (user || isGuest) {
      router.replace('/(tabs)/habits');
    }
  }, [user, isGuest]);

  const pathImage =
    currentTheme === 'dark'
      ? require('@/assets/images/path-dark.png')
      : require('@/assets/images/path-light.png');

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Notice', error.message);
      } else {
        router.replace('/(tabs)/habits');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestContinue = async () => {
    await signInAsGuest();
    router.replace('/(tabs)/habits');
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1 relative"
    >
      <View
        pointerEvents="none"
        className="w-full absolute left-0 right-0 items-center"
        style={{
          height: SCREEN_HEIGHT * 0.58,
          bottom: SCREEN_HEIGHT * 0.08,
          opacity: currentTheme === 'dark' ? 0.35 : 0.45,
        }}
      >
        <Image
          source={pathImage}
          className="w-screen h-full"
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 justify-center items-center px-6 z-10">
        <Image
          source={require('@/assets/images/logo.png')}
          className="w-32 h-32 mb-3"
          resizeMode="contain"
        />

        <ThemedText className="text-4xl font-pbold tracking-tight text-center">
          Hobit
        </ThemedText>

        <Text
          className="text-base font-pmedium text-center mt-1.5 opacity-60 px-6 max-w-[280px]"
          style={{ color: Colors[currentTheme].text }}
        >
          An app to track your bite-sized habits
        </Text>
      </View>

      <View className="px-8 pb-10 z-10 w-full items-center">
        <View className="w-full max-w-[360px] gap-3">
          <Button
            title="Continue with Google"
            variant="outline"
            size="default"
            loading={isSigningIn}
            disabled={isSigningIn}
            onPress={handleGoogleSignIn}
            leftIcon={<GoogleIcon size={20} />}
            className="w-full"
          />

          <Button
            title="Skip for now · Start tracking"
            variant="ghost"
            size="md"
            disabled={isSigningIn}
            onPress={handleGuestContinue}
            className="w-full"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
