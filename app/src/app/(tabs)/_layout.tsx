import { useTheme } from '@/shared/hooks/use-theme';
import { Tabs } from 'expo-router';
import { BrainCircuit, Library, MessageCircle, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Orange vif pour l'icône et le texte sélectionnés
        tabBarActiveTintColor: '#FF7A00',
        // Gris doux et lisible pour les onglets inactifs
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#71717A' : '#71717A',
        tabBarStyle: {
          // Fond uni, sans aucun effet de flou ou de transparence
          backgroundColor: colorScheme === 'dark' ? '#09090B' : '#FFFFFF',
          // Ligne fine de séparation en haut de la barre
          borderTopColor: colorScheme === 'dark' ? '#18181B' : '#F4F4F5',
          borderTopWidth: 1,
          elevation: 0,
          // Hauteur confortable et moderne
          height: 80 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discussions',
          tabBarIcon: ({ color }) => <MessageCircle size={20} color={color} />,
          
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Assistant AI',
          tabBarIcon: ({ color }) => <BrainCircuit size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <Library size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Options',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}