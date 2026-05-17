import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onItemPress: (folderId: string | null) => void;
}

export function BreadcrumbNavigation({
  items,
  onItemPress,
}: BreadcrumbNavigationProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-white px-4 py-3 border-b border-gray-200"
    >
      <View className="flex-row items-center gap-2">
        {items.map((item, index) => (
          <View key={item.id || "root"} className="flex-row items-center gap-2">
            {index > 0 && (
              <ChevronRight
                width={16}
                height={16}
                color="#9CA3AF"
              />
            )}
            <TouchableOpacity
              onPress={() => onItemPress(item.id)}
              className={`px-3 py-2 rounded-md ${
                index === items.length - 1
                  ? "bg-blue-50"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  index === items.length - 1
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
