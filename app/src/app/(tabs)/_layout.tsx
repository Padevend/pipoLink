import { useTheme } from '@/shared/hooks/use-theme';
import { Tabs } from 'expo-router';
import { BrainCircuit, Library, MessageCircle, Settings } from 'lucide-react-native';


export default function TabsLayout() {
  const { colors, colorScheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF7A00',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#94A3B8' : '#64748B',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0',
          elevation: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Lab',
          tabBarIcon: ({ color, size }) => <BrainCircuit size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
