import { useAiChat, useAiHistory } from '@/entities/ai/hooks';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { BrainCircuit, History, Send, Sparkles } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiScreen() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const { data: history, isLoading } = useAiHistory(sessionId || '');
  const chatMutation = useAiChat();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    
    try {
      const result = await chatMutation.mutateAsync({ 
        message: msg, 
        sessionId 
      });
      
      if (!sessionId) setSessionId(result.session.id);
    } catch (e) {
      // Error handled by mutation or toast
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border-light dark:border-border-dark">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-primary/10 items-center justify-center rounded-2xl">
            <Sparkles size={20} color="#FF7A00" />
          </View>
          <View>
            <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
              AI Lab
            </Text>
            <Text className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-bold uppercase tracking-widest">
              Gpt-4o Academic
            </Text>
          </View>
        </View>
        
        <Button 
          variant="ghost" 
          size="sm"
          label=""
          leftIcon={<History size={20} color="#6B7280" />}
          onPress={() => {}} 
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isAi = item.role === 'assistant';
            return (
              <View className={cn(
                'mb-6 gap-2',
                isAi ? 'items-start' : 'items-end'
              )}>
                <View className="flex-row items-center gap-2 mb-1">
                  {isAi && <Sparkles size={12} color="#FF7A00" />}
                  <Text className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase">
                    {isAi ? 'Pipo Assistant' : 'You'}
                  </Text>
                </View>
                <View className={cn(
                  'px-5 py-4 rounded-[28px]',
                  isAi 
                    ? 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-tl-none shadow-sm' 
                    : 'bg-primary rounded-tr-none shadow-lg shadow-primary/20'
                )}>
                  <Text className={cn(
                    'text-base leading-6',
                    isAi ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-white font-medium'
                  )}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 gap-6">
              <View className="w-24 h-24 bg-primary/5 rounded-full items-center justify-center border border-primary/10">
                <BrainCircuit size={48} color="#FF7A00" />
              </View>
              <View className="items-center gap-2">
                <Text className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark">
                  How can I help?
                </Text>
                <Text className="text-text-secondary-light dark:text-text-secondary-dark text-center px-12 leading-5">
                  Ask me about your courses, summarize documents, or help with your research.
                </Text>
              </View>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View className="px-4 py-6 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark rounded-t-[32px] shadow-2xl">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Input
                placeholder="Ask Pipo anything..."
                value={text}
                onChangeText={setText}
                multiline
                containerClassName="min-h-[56px] max-h-[120px] rounded-3xl"
                className="text-base"
              />
            </View>
            
            <Button
              variant="primary"
              size="lg"
              label=""
              leftIcon={<Send size={24} color="#FFFFFF" />}
              onPress={handleSend}
              loading={chatMutation.isPending}
              disabled={!text.trim()}
              className="w-14 h-14 rounded-full"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
