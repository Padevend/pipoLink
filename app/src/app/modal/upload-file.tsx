import React, { useState } from 'react';
import { View, Text, SafeAreaView, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react-native';
import { messagingApi } from '@/shared/api/messaging';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/cn';

export default function UploadFileModal() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    
    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !conversationId) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      
      await messagingApi.uploadFile(conversationId, formData);
      showToast({ type: 'success', message: 'File shared successfully!' });
      router.back();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
          Share File
        </Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="gap-8">
          <Pressable onPress={handlePickFile} disabled={isUploading}>
            <Card 
              variant="outline" 
              className={cn(
                "h-48 border-dashed border-2 items-center justify-center gap-4",
                file ? "border-success/50 bg-success/5" : "border-primary/30 bg-primary/5"
              )}
            >
              {file ? (
                <>
                  <CheckCircle2 size={48} color="#22C55E" />
                  <View className="items-center">
                    <Text className="text-base font-bold text-success">File Selected</Text>
                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{file.name}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Upload size={48} color="#FF7A00" />
                  <View className="items-center">
                    <Text className="text-base font-bold text-primary">Tap to select a file</Text>
                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center px-8">
                      Max file size: 50MB
                    </Text>
                  </View>
                </>
              )}
            </Card>
          </Pressable>

          {file && (
            <View className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border-light dark:border-border-dark flex-row items-center gap-4">
              <View className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl items-center justify-center">
                <FileText size={24} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-bold text-text-primary-light dark:text-text-primary-dark">
                  {file.name}
                </Text>
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
            </View>
          )}

          <Button 
            label="Share with Group"
            size="xl"
            onPress={handleUpload}
            loading={isUploading}
            disabled={!file}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
