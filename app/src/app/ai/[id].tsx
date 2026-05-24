import { useAiChat, useAiHistory } from '@/entities/ai/hooks';
import { BRAND } from '@/shared/config/brand';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Paperclip, Send, Sparkles, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [sessionId, setSessionId] = useState<string | undefined>(id === "new" ? undefined : id);

    const { data: history, isLoading: historyLoading } = useAiHistory(sessionId || '');
    const flatListRef = useRef<FlatList>(null);
    const chatMutation = useAiChat();
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState<{ name: string; uri: string } | null>(null);

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'text/*', 'application/*'],
            copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
            setAttachment({ name: result.assets[0].name, uri: result.assets[0].uri });
        }
    };

    const handleSend = async () => {
        if (!text.trim() && !attachment) return;
        const prefix = attachment ? `[Document: ${attachment.name}]\n` : '';
        const msg = `${prefix}${text.trim()}`.trim();
        setText('');
        setAttachment(null);
        try {
            const result = await chatMutation.mutateAsync({ message: msg, sessionId });
            if (!sessionId) setSessionId(result.session.id);
        } catch {

        }
    };

    // ==================== VUE CHAT IA ====================
    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
            {/* Header Chat épuré */}
            <View className="z-10 flex-row items-center justify-between border-b border-border-light/30 bg-surface-light/75 px-4 py-3 dark:border-border-dark/20 dark:bg-surface-dark/75 backdrop-blur-xl ">
                <Pressable
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 h-9 rounded-full bg-background-light/40 pl-2 pr-3 dark:bg-background-dark/30 active:opacity-80"
                >
                    <ArrowLeft size={18} color="#64748B" />

                </Pressable>

                <View className="flex-row items-center">
                    <Text className="font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark">Chat IA</Text>
                </View>
                <View></View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {historyLoading ? (
                    <View className='flex-1'>
                        <ActivityIndicator className="mt-12" color={BRAND.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={history}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
                        renderItem={({ item }) => {
                            const isAi = item.role === 'assistant';
                            return (
                                <View className={cn('mb-4 max-w-[85%]', isAi ? 'self-start items-start' : 'self-end items-end')}>
                                    <View
                                        className={cn(
                                            'px-4 py-3 rounded-3xl ',
                                            isAi
                                                ? 'rounded-tl-lg border border-border-light/40 bg-surface-light/60 dark:border-border-dark/30 dark:bg-surface-dark/60 backdrop-blur-lg'
                                                : 'rounded-tr-lg bg-primary',
                                        )}
                                    >
                                        <Text className={cn('text-[15px] leading-[22px] tracking-wide', isAi ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-white')}>
                                            {item.content}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View className="items-center py-24 px-8">
                                <View className="p-4 rounded-full bg-primary/10 mb-3 animate-pulse">
                                    <Sparkles size={32} color={BRAND.primary} />
                                </View>
                                <Text className="text-base font-semibold tracking-tight text-text-secondary-light/80 dark:text-text-secondary-dark/80 text-center">
                                    Posez votre première question à l'assistant
                                </Text>
                            </View>
                        }
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                )}

                {/* Zone Input Style Glassmorphism intégrée */}
                <View className="border-t border-border-light/30 bg-background-light/80 px-4 pt-3 pb-6 dark:border-border-dark/30 dark:bg-background-dark/80 backdrop-blur-xl">
                    {attachment && (
                        <View className="mb-2 flex-row items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 backdrop-blur-md">
                            <Paperclip size={14} color={BRAND.primary} />
                            <Text className="flex-1 text-xs font-semibold text-text-primary-light dark:text-text-primary-dark" numberOfLines={1}>
                                {attachment.name}
                            </Text>
                            <Pressable onPress={() => setAttachment(null)} className="p-0.5 rounded-full bg-text-secondary-light/10">
                                <X size={14} className="text-text-secondary-light/70 dark:text-text-secondary-dark/70" />
                            </Pressable>
                        </View>
                    )}

                    <View className="flex-row items-end gap-2.5 bg-surface-light/50 dark:bg-surface-dark/40 border border-border-light/40 dark:border-border-dark/20 rounded-3xl p-1.5 ">
                        {/* Bouton Fichier Joint */}
                        <Pressable
                            onPress={() => void pickDocument()}
                            className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/40 active:opacity-80"
                        >
                            <Paperclip size={18} color="#64748B" />
                        </Pressable>

                        {/* Zone Input Texte */}
                        <View className="flex-1 bottom-0.5">
                            <Input
                                placeholder="Votre question…"
                                value={text}
                                onChangeText={setText}
                                multiline
                                containerClassName="bg-transparent border-0 min-h-[38px] max-h-[100px]"
                                className="text-[15px] text-text-primary-light dark:text-text-primary-dark"
                            />
                        </View>

                        {/* Bouton Envoyer Style Bulle */}
                        <Pressable
                            onPress={() => void handleSend()}
                            disabled={(!text.trim() && !attachment) || chatMutation.isPending}
                            className={cn(
                                'h-10 w-10 items-center justify-center rounded-full  active:opacity-80',
                                (text.trim() || attachment) && !chatMutation.isPending
                                    ? 'bg-primary'
                                    : 'bg-transparent opacity-40',
                            )}
                        >
                            <Send size={16} color={(text.trim() || attachment) ? '#FFFFFF' : '#64748B'} />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}