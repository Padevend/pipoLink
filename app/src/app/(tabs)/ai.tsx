import { useAiChat, useAiHistory, useAiSessions } from '@/entities/ai/hooks';
import { AppLogo } from '@/shared/ui/app-logo';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { formatRelativeDate } from '@/shared/lib/date';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND } from '@/shared/config/brand';
import { MessageSquarePlus, Send, Sparkles } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiScreen() {
  const [view, setView] = useState<'history' | 'chat'>('history');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const { data: sessions, isLoading: sessionsLoading } = useAiSessions();
  const { data: history, isLoading: historyLoading } = useAiHistory(sessionId || '');
  const chatMutation = useAiChat();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const showHistory = view === 'history';

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    try {
      const result = await chatMutation.mutateAsync({ message: msg, sessionId });
      if (!sessionId) setSessionId(result.session.id);
    } catch {
      // toast via mutation
    }
  };

  const startNewConversation = () => {
    setSessionId(undefined);
    setText('');
    setView('chat');
  };

  const openSession = (id: string) => {
    setSessionId(id);
    setView('chat');
  };

  if (showHistory) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <LinearGradient colors={[...BRAND.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-6 pb-6 pt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <AppLogo size="sm" />
              <View>
                <Text className="text-xl font-black text-white">Assistant IA</Text>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-white/80">Historique</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="flex-1 px-4 pt-4">
          <Button
            label="Nouvelle conversation"
            leftIcon={<MessageSquarePlus size={18} color="#fff" />}
            onPress={startNewConversation}
            className="mb-4"
          />

          {sessionsLoading ? (
            <ActivityIndicator color={BRAND.primary} className="mt-8" />
          ) : (
            <FlatList
              data={sessions ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Sparkles size={40} color={BRAND.primary} />
                  <Text className="mt-4 text-center text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                    Aucune conversation
                  </Text>
                  <Text className="mt-2 px-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Créez une conversation pour poser vos questions de cours.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => openSession(item.id)}
                  className="mb-3 rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark active:opacity-80"
                >
                  <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark" numberOfLines={1}>
                    {item.title || 'Conversation sans titre'}
                  </Text>
                  <Text className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark">
        <Pressable onPress={() => setView('history')}>
          <Text className="text-sm font-bold text-primary">← Historique</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Sparkles size={18} color={BRAND.primary} />
          <Text className="font-black text-text-primary-light dark:text-text-primary-dark">Chat IA</Text>
        </View>
        <Button variant="ghost" size="sm" label="Nouveau" onPress={startNewConversation} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        {historyLoading ? (
          <ActivityIndicator className="mt-12" color={BRAND.primary} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isAi = item.role === 'assistant';
              return (
                <View className={cn('mb-5 gap-1', isAi ? 'items-start' : 'items-end')}>
                  <View
                    className={cn(
                      'max-w-[88%] px-4 py-3 rounded-3xl',
                      isAi
                        ? 'rounded-tl-md border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark'
                        : 'rounded-tr-md bg-primary',
                    )}
                  >
                    <Text className={cn('text-[15px] leading-[22px]', isAi ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-white')}>
                      {item.content}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Posez votre première question
                </Text>
              </View>
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View className="border-t border-border-light bg-surface-light px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                placeholder="Votre question…"
                value={text}
                onChangeText={setText}
                multiline
                containerClassName="min-h-[52px] max-h-[120px] rounded-2xl"
              />
            </View>
            <Button
              variant="primary"
              size="lg"
              label=""
              leftIcon={<Send size={22} color="#FFFFFF" />}
              onPress={() => void handleSend()}
              loading={chatMutation.isPending}
              disabled={!text.trim()}
              className="h-12 w-12 rounded-2xl"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
