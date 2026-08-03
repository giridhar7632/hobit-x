import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/ui/tab-icon';
import { HomeIcon, PlusIcon } from '@/constants/icons';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const currentTheme = colorScheme === "dark" ? "dark" : "light";
	const { activeColor } = useAppTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: false,
				tabBarInactiveTintColor: currentTheme === 'dark' ? '#A3A3A3' : '#737373',
				tabBarActiveTintColor: activeColor.accent,
				headerShown: false,
				tabBarStyle: {
					backgroundColor: Colors[currentTheme].background,
					borderTopWidth: 0,
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
							icon={HomeIcon}
							color={color as string}
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
							icon={PlusIcon}
							color={color as string}
							name='Create'
							focused={focused}
						/>
					),
				}}
			/>
		</Tabs>
	);
}