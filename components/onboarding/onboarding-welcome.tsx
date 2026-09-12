import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Button from '../ui/button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingWelcomeProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  accentColor?: string;
  isSigningIn?: boolean;
}

const QUOTES = [
  {
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
  },
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
  },
  {
    text: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
  },
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
  },
];

export function OnboardingWelcome({
  onGetStarted,
  onSignIn,
  accentColor = '#4655E0',
  isSigningIn = false,
}: OnboardingWelcomeProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const quote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGetStarted();
  };

  const handleSignIn = () => {
    if (isSigningIn) return;
    Haptics.selectionAsync();
    onSignIn();
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: theme.tint }}
      className="flex-1 justify-between text-pregular relative overflow-hidden"
    >
      {/* Background Path Illustration (Solid White, No Opacity, Full Width) */}
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 items-center justify-center"
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT * 0.58,
          bottom: SCREEN_HEIGHT * 0.08,
        }}
      >
        <Image
          source={require('@/assets/images/path-dark.png')}
          style={{
            width: SCREEN_WIDTH,
            height: '100%',
            tintColor: '#FFFFFF',
          }}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center py-5 z-10 px-7">
        <Text className="text-[48px] text-neutral-100 leading-none font-pbold tracking-tight mb-4">
          Build a life{'\n'}you want to{'\n'}wake up to.
        </Text>

        <Text className="text-base leading-6 font-pregular text-neutral-100 max-w-[320px] mb-8">
          Small actions, repeated every day, become something bigger.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="mb-10 z-10 px-7">
        <Button handlePress={handleStart} title="Get started" />

        <Pressable
          onPress={handleSignIn}
          disabled={isSigningIn}
          className="my-4 mx-auto py-2 items-center justify-center min-h-[44px]"
        >
          {isSigningIn ? (
            <Text className="text-lg text-pregular leading-none text-neutral-100/70">
              Signing in...
            </Text>
          ) : (
            <Text className="underline underline-offset-4 text-lg text-pregular leading-none text-neutral-100">
              I have an account
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
