import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotificationStore } from '@/store/notifications.store';

type TabIcon = React.ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const { colors, isDark, cardBg, borderColor } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F6BF6',
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: cardBg,
          borderTopColor: borderColor,
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          href: undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={(focused ? 'grid' : 'grid-outline') as TabIcon} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          headerShown: false,
          href: undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={(focused ? 'clipboard' : 'clipboard-outline') as TabIcon} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Metrics',
          headerShown: false,
          href: null,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={(focused ? 'pie-chart' : 'pie-chart-outline') as TabIcon} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerShown: false,
          href: undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={(focused ? 'navigate-circle' : 'navigate-circle-outline') as TabIcon} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={(focused ? 'menu' : 'menu-outline') as TabIcon} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
