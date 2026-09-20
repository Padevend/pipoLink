import { useTheme } from '@/shared/hooks/use-theme';
import { Tabs } from 'expo-router';
import { BrainCircuit, Library, MessageCircle, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: isDark ? '#71717A' : '#A1A1AA',
        tabBarStyle: {
          backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          borderTopColor: isDark ? '#1A1A1A' : '#F4F4F5',
          borderTopWidth: 2,
          elevation: 0,
          shadowOpacity: 0,
          height: 72 + (insets.bottom > 0 ? insets.bottom : 16),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discussions',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle size={22} color={color} strokeWidth={focused ? 3 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, focused }) => (
            <BrainCircuit size={22} color={color} strokeWidth={focused ? 3 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, focused }) => (
            <Library size={22} color={color} strokeWidth={focused ? 3 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Options',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={22} color={color} strokeWidth={focused ? 3 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}