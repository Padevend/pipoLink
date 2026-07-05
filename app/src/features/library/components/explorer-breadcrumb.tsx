import { ChevronRight, Home } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

export type BreadcrumbItem = {
  id: string | null;
  name: string;
};

export interface ExplorerBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export function ExplorerBreadcrumb({ items, onNavigate }: ExplorerBreadcrumbProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center' }}
      className="py-1"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <View key={`${item.id ?? 'root'}-${index}`} className="flex-row items-center">
            {/* Séparateur géométrique mat */}
            {index > 0 && (
              <View className="mx-1">
                <ChevronRight size={12} color="#A1A1AA" />
              </View>
            )}
            
            <Pressable
              disabled={isLast}
              onPress={() => onNavigate(index)}
              className="max-w-[140px] flex-row items-center gap-1 rounded-md px-1.5 py-1 active:bg-zinc-100 dark:active:bg-zinc-900"
            >
              {/* Icône Home adaptée à l'état actif/inactif */}
              {index === 0 && (
                <Home 
                  size={13} 
                  color={isLast ? '#F97316' : '#71717A'} 
                  strokeWidth={isLast ? 2.5 : 2}
                />
              )}
              
              <Text
                numberOfLines={1}
                className={
                  isLast
                    ? 'text-xs font-bold text-orange-500'
                    : 'text-xs font-semibold text-zinc-500 dark:text-zinc-400'
                }
              >
                {item.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}