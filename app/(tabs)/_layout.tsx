import { Tabs } from 'expo-router';

import { MacDockTabBar } from '@/components/ui/mac-dock-tab-bar';

export default function TabLayout() {
	return (
		<Tabs
			tabBar={(props) => <MacDockTabBar {...props} />}
			screenOptions={{
				headerShown: false,
			}}>
			<Tabs.Screen
				name='habits'
				options={{
					title: 'Habits',
				}}
			/>
			<Tabs.Screen
				name='create'
				options={{
					title: 'Create',
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					title: 'Profile',
				}}
			/>
		</Tabs>
	);
}