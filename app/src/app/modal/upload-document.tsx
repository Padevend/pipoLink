import { useUploadDocument } from '@/entities/document/hooks';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function UploadDocumentModal() {
  const router = useRouter();
  const { showToast } = useToast();
  const uploadMutation = useUploadDocument();
  
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<any>(null);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    
    if (!result.canceled) {
      setFile(result.assets[0]);
      if (!title) setTitle(result.assets[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    
    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: { title, type: 'COURS' }
      });
      showToast({
        type: "success",
        message: 'Document uploaded successfully!'
      });
      router.back();
    } catch (e: any) {
      showToast({
        type: "error",
        message: e.message || 'Upload failed'
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
          Upload Document
        </Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="gap-8">
          <Pressable onPress={handlePickDocument}>
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
                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">PDF, Word, or Images</Text>
                  </View>
                </>
              )}
            </Card>
          </Pressable>

          <View className="gap-6">
            <Input 
              label="Document Title"
              placeholder="e.g. Mathematics Course Notes"
              value={title}
              onChangeText={setTitle}
              leftIcon={FileText}
            />
            
            <View className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border-light dark:border-border-dark">
              <Text className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-2">
                Moderation Note
              </Text>
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-5">
                Your document will be visible to others after being approved by a moderator. 
                Please ensure it follows the community guidelines.
              </Text>
            </View>
          </View>

          <Button 
            label="Publish Document"
            size="xl"
            onPress={handleUpload}
            loading={uploadMutation.isPending}
            disabled={!file || !title}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/cn';

