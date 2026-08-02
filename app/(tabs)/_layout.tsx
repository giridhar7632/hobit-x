import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/ui/tab-icon';
import { useAppTheme } from '@/context/theme-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import icons from '@/constants/icons';

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const currentTheme = colorScheme === "dark" ? "dark" : "light";
	const { activeColor } = useAppTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: false,
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
							icon={icons.home}
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
							icon={icons.plus}
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