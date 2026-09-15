import { Redirect, Tabs } from 'expo-router';

import { BottomNavBar } from '@/components/ui/bottom-nav-bar';
import { useAuth } from '@/context/auth-context';

export default function TabLayout() {
	const { user, isGuest, isLoading } = useAuth();

	if (isLoading) {
		return null;
	}

	if (!user && !isGuest) {
		return <Redirect href="/auth" />;
	}

	return (
		<Tabs
			tabBar={(props) => <BottomNavBar {...props} />}
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
				name='calendar'
				options={{
					title: 'Calendar',
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					title: 'Profile',
				}}
			/>
			<Tabs.Screen
				name='create'
				options={{
					title: 'Create',
					href: null,
				}}
			/>
		</Tabs>
	);
}