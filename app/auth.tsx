import { ThemedText } from '@/components/themed-text';
import { GoogleIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

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
      {/* Background Path Illustration */}
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

      {/* Centered Hero Section */}
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

      {/* Accessible Bottom Actions */}
      <View className="px-8 pb-10 z-10 w-full items-center">
        <View className="w-full max-w-[360px]">
          {/* Google Sign In Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSigningIn}
            onPress={handleGoogleSignIn}
            className="w-full py-4 px-6 rounded-2xl flex-row items-center justify-center gap-3"
            style={{
              backgroundColor: currentTheme === 'dark' ? '#27272a' : '#ffffff',
              borderWidth: 1,
              borderColor: currentTheme === 'dark' ? '#3f3f46' : '#e4e4e7',
            }}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="#84cc16" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text
                  className="font-psemibold text-base"
                  style={{ color: currentTheme === 'dark' ? '#f4f4f5' : '#18181b' }}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guest / Skip Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isSigningIn}
            onPress={handleGuestContinue}
            className="w-full py-3.5 items-center justify-center mt-2.5"
          >
            <Text
              className="font-pmedium text-sm"
              style={{ color: Colors[currentTheme].icon }}
            >
              Skip for now · Start tracking
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
