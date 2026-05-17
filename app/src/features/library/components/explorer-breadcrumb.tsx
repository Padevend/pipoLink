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
      contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}
      className="mb-3"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={`${item.id ?? 'root'}-${index}`} className="flex-row items-center">
            {index > 0 ? (
              <ChevronRight size={14} color="#94A3B8" style={{ marginHorizontal: 4 }} />
            ) : null}
            <Pressable
              disabled={isLast}
              onPress={() => onNavigate(index)}
              className="max-w-[160px] flex-row items-center gap-1 rounded-lg px-1 py-0.5"
            >
              {index === 0 ? (
                <Home size={14} color={isLast ? '#FF7A00' : '#64748B'} />
              ) : null}
              <Text
                numberOfLines={1}
                className={
                  isLast
                    ? 'text-sm font-bold text-primary'
                    : 'text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark'
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
