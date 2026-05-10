import { Document } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { format } from 'date-fns';
import { Download, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const getIcon = () => {
    switch (document.type) {
      case 'COURS': return <FileText size={24} color="#3B82F6" />;
      case 'EXAMEN': return <FileText size={24} color="#EF4444" />;
      default: return <FileText size={24} color="#6B7280" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card 
      variant="elevated" 
      padding="none" 
      className="mb-4"
      onPress={onPress}
    >
      <View className="flex-row items-center p-4">
        <View className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center mr-4">
          {getIcon()}
        </View>
        
        <View className="flex-1">
          <Text 
            numberOfLines={1} 
            className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-1"
          >
            {document.title}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {document.type}
              </Text>
            </View>
            <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatSize(document.fileSize)} • {format(new Date(document.createdAt), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        
        <Pressable className="w-10 h-10 items-center justify-center rounded-full">
          <Download size={20} color="#6B7280" />
        </Pressable>
      </View>
    </Card>
  );
}
