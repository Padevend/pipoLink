import { useDocuments } from '@/entities/document/hooks';
import { DocumentCard } from '@/entities/document/ui/document-card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { BookOpen, Search, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Courses', 'Exams', 'TD/TP', 'Summaries'];
const TYPES_MAP: Record<string, string> = {
  'Courses': 'COURS',
  'Exams': 'EXAMEN',
  'TD/TP': 'TD',
  'Summaries': 'RESUME'
};

export default function LibraryScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  
  const { data: documents, isLoading } = useDocuments({
    type: TYPES_MAP[activeCategory] as any,
    search: search || undefined
  });

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
              Library
            </Text>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
              Academic Resources
            </Text>
          </View>
          <Pressable className="w-12 h-12 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30">
            <Upload size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <Input 
          placeholder="Search documents, courses, teachers..."
          value={search}
          onChangeText={setSearch}
          leftIcon={Search}
          containerClassName="mb-6"
        />

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={cn(
                'px-6 py-2.5 rounded-2xl border',
                activeCategory === cat
                  ? 'bg-primary border-primary'
                  : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
              )}
            >
              <Text className={cn(
                'font-bold text-sm',
                activeCategory === cat ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark'
              )}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Document List */}
      <View className="flex-1 px-6">
        {isLoading ? (
          <View className="gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton height={4} key={i} className="w-full h-24 rounded-3xl" />
            ))}
          </View>
        ) : (
          <FlatList
            data={documents?.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DocumentCard 
                document={item} 
                onPress={() => {}} 
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListHeaderComponent={
              <Text className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-4">
                Recent Uploads
              </Text>
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20 gap-4">
                <BookOpen size={48} color="#94A3B8" />
                <Text className="text-lg font-bold text-text-secondary-light dark:text-text-secondary-dark">
                  No documents found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
