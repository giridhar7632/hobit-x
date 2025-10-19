import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/ui/tab-icon';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import icons from '@/constants/icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
    screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        borderTopWidth: 1,
        borderTopColor: colorScheme === 'light' ? '#f5f5f5' : '#232533',
        height: 84,
        paddingTop: 12
      },
    }}>
      <Tabs.Screen
				name='habits'
				options={{
					title: 'Habits',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							icon={icons.home}
							color={color}
							name='Habits'
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='create'
				options={{
					title: 'Create',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							icon={icons.plus}
							color={color}
							name='Create'
							focused={focused}
						/>
					),
				}}
			/>
    </Tabs>
  );
}
