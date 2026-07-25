import {
  useAddDocumentToSession,
  useAiChat,
  useAiHistory,
  useAiTokens,
  useGenerateStudyAid,
  useMyAiAttachments,
  useRemoveDocumentFromSession,
  useSessionDocuments
} from '@/entities/ai/hooks';
import { useMyDocuments } from '@/entities/document/hooks';
import LibraryModal from '@/features/chat-ai/components/biblio-modal';
import SourceModal from '@/features/chat-ai/components/modal-source';
import type { Document } from '@/shared/api/types';
import { useDraft } from '@/shared/hooks/use-draft';
import { useSafeArea } from '@/shared/hooks/use-safe-area';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Columns,
  FolderOpen,
  HelpCircle,
  Layers,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STUDY_AIDS = [
  { id: 'summary', label: 'Résumé', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'quiz', label: 'Quiz', icon: Sparkles },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'timeline', label: 'Chronologie', icon: Clock },
  { id: 'comparison', label: 'Comparaison', icon: Columns },
];

export default function AiChatScreen() {
  const insets = useSafeArea();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id as string;

  const { data: history, isLoading: historyLoading } = useAiHistory(sessionId);
  const { data: activeDocs, isLoading: docsLoading } = useSessionDocuments(sessionId);
  
  const { data: myDocsData, isLoading: myDocsLoading } = useMyDocuments();
  const { data: aiDocsData, isLoading: aiDocsLoading } = useMyAiAttachments();
  const libraryDocs = useMemo(() => {
    const normalDocs = myDocsData?.pages.flatMap((page) => page.items) ?? [];
    const aiDocs = aiDocsData ?? [];
    return [...normalDocs, ...aiDocs];
  }, [myDocsData?.pages, aiDocsData]);

  const addDocMutation = useAddDocumentToSession();
  const removeDocMutation = useRemoveDocumentFromSession();
  const generateMutation = useGenerateStudyAid();
  const chatMutation = useAiChat();

  const flatListRef = useRef<FlatList>(null);
  // Brouillon local par session IA (restauré à la réouverture, TTL 24 h)
  const { text, setText, clearDraft } = useDraft(`ai_${sessionId}`);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [addSourceVisible, setAddSourceVisible] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    clearDraft();
    try {
      await chatMutation.mutateAsync({ message: msg, sessionId });
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.warn('[useAiChat] failed:', err);
    }
  };

  const handleAddDocument = async (doc: Document) => {
    try {
      await addDocMutation.mutateAsync({ sessionId, documentId: doc.id });
      setAddSourceVisible(false);
    } catch (err) {
      console.warn('[addDocument] failed:', err);
    }
  };

  const handleRemoveDocumentGlobal = (id: string) => {
    if (activeDocs?.some((d) => d.id === id)) {
      void handleRemoveDocument(id);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await removeDocMutation.mutateAsync({ sessionId, documentId });
    } catch (err) {
      console.warn('[removeDocument] failed:', err);
    }
  };

  const handleGenerateStudyAid = async (type: string) => {
    try {
      await generateMutation.mutateAsync({ sessionId, type });
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.warn('[generateStudyAid] failed:', err);
    }
  };

  const renderMessageContent = (content: string, isAi: boolean) => {
    if (!isAi) {
      return <Text className="text-sm leading-5 font-medium text-white">{content}</Text>;
    }

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <Text key={idx} className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-3 mb-1">
            {line.replace('### ', '')}
          </Text>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={idx} className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 mb-0.5">
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <Text key={idx} className="text-xs leading-5 text-zinc-600 dark:text-zinc-400 ml-1.5 my-0.5">
            ☐ {line.replace('- [ ] ', '')}
          </Text>
        );
      }
      if (line.startsWith('- [x] ')) {
        return (
          <Text key={idx} className="text-xs font-semibold leading-5 text-orange-500 ml-1.5 my-0.5">
            ☑ {line.replace('- [x] ', '')}
          </Text>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <Text key={idx} className="text-xs leading-5 text-zinc-600 dark:text-zinc-400 ml-2 my-0.5">
            • {line.substring(2)}
          </Text>
        );
      }
      return (
        <Text key={idx} className="text-xs leading-5 text-zinc-700 dark:text-zinc-300 my-0.5">
          {line}
        </Text>
      );
    });
  };

  const { data: tokensData } = useAiTokens();
  const remainingTimeText = useMemo(() => {
    if (!tokensData?.timeRemainingMs) return null;
    const totalMinutes = Math.ceil(tokensData.timeRemainingMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [tokensData?.timeRemainingMs]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* Header Mat */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={16} color="#71717A" />
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Sparkles size={16} color="#F97316" />
          <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Hiro Notebook</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Badge de Jetons IA */}
          <Pressable
            onPress={() => router.push('/settings/subscription')}
            className="flex-row items-center gap-1 rounded-lg bg-orange-50 border border-orange-200/60 dark:bg-orange-950/30 dark:border-orange-900/40 px-2 py-1 active:opacity-80"
          >
            <Zap size={12} color="#F97316" />
            <Text className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
              {tokensData ? tokensData.tokens.toLocaleString() : '...'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSourcesModalVisible(true)}
            className="flex-row items-center gap-1.5 h-8 rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 px-2.5 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <FolderOpen size={14} color="#71717A" />
            <Text className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Sources ({activeDocs?.length ?? 0})
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        {/* Pilules Horizontales d'Outils d'Étude */}
        <View className="border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-900 dark:bg-zinc-900/20 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
            {STUDY_AIDS.map((aid) => {
              const Icon = aid.icon;
              const isDisabled = generateMutation.isPending || activeDocs?.length === 0;
              return (
                <Pressable
                  key={aid.id}
                  disabled={isDisabled}
                  onPress={() => handleGenerateStudyAid(aid.id)}
                  className={cn(
                    "flex-row items-center gap-1.5 px-3 h-8 rounded-lg border",
                    isDisabled
                      ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/50 opacity-40"
                      : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-50 dark:active:bg-zinc-800"
                  )}
                >
                  <Icon size={12} color={isDisabled ? "#A1A1AA" : "#F97316"} />
                  <Text className={cn("text-[11px] font-bold uppercase tracking-wide", isDisabled ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-700 dark:text-zinc-300")}>
                    {aid.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Historique des Messages */}
        {historyLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="small" color="#F97316" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={history}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isAi = item.role === 'assistant';
              const isFailed = item.status === 'fail';
              return (
                <View className={cn('mb-3 max-w-[85%]', isAi ? 'self-start items-start' : 'self-end items-end')}>
                  <View
                    className={cn(
                      'px-4 py-2.5 rounded-2xl',
                      isAi
                        ? 'rounded-tl-sm border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/60'
                        : isFailed
                        ? 'rounded-tr-sm bg-red-500/90 border border-red-400'
                        : 'rounded-tr-sm bg-orange-500',
                    )}
                  >
                    {renderMessageContent(item.content, isAi)}
                  </View>

                  {isFailed && (
                    <View className="flex-row items-center gap-2 mt-1 px-1">
                      <Text className="text-[10px] text-red-500 font-bold">Échec de l'envoi</Text>
                      <Pressable
                        onPress={() => chatMutation.retryFailedAiMessage(sessionId, item)}
                        className="bg-orange-500/10 px-2 py-0.5 rounded"
                      >
                        <Text className="text-[10px] font-bold text-orange-500">Réessayer</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => chatMutation.deleteFailedAiMessage(sessionId, item.id)}
                        className="bg-red-500/10 px-2 py-0.5 rounded"
                      >
                        <Text className="text-[10px] font-bold text-red-500">Supprimer</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-16 px-6">
                <View className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 mb-3">
                  <Sparkles size={24} color="#F97316" />
                </View>
                <Text className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200 text-center">
                  Discutez avec Hiro pour analyser vos cours
                </Text>
                <Text className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-[260px] leading-4">
                  Ajoutez vos documents de révision en cliquant sur le bouton "Sources" ci-dessus.
                </Text>
              </View>
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Indicateur de frappe / chargement IA */}
        {(chatMutation.isPending || generateMutation.isPending) && (
          <View className="flex-row items-center gap-2 px-4 py-2.5 self-start ml-4 mb-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {generateMutation.isPending ? "Génération de l'outil d'étude..." : "Hiro réfléchit..."}
            </Text>
          </View>
        )}

        {/* Bannières d'avertissement de Jetons IA */}
        {tokensData && tokensData.tokens < 20 && (
          <View className="mx-3 mb-2 flex-row items-center justify-between rounded-xl bg-orange-500/10 border border-orange-500/30 p-2.5">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
                Solde de jetons insuffisant ({tokensData.tokens} / {tokensData.maxTokens})
              </Text>
              <Text className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                Restauration automatique dans {remainingTimeText || 'quelques minutes'}.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings/subscription')}
              className="rounded-lg bg-orange-500 px-3 py-1.5 active:bg-orange-600"
            >
              <Text className="text-[11px] font-bold text-white">Passer Premium</Text>
            </Pressable>
          </View>
        )}

        {/* Barre de Saisie Opaque */}
        <View 
          className="border-t border-zinc-100 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            <View className="flex-1">
              <Input
                placeholder={tokensData && tokensData.tokens < 20 ? "Solde de jetons insuffisant..." : "Posez votre question..."}
                value={text}
                onChangeText={setText}
                editable={!tokensData || tokensData.tokens >= 20}
                multiline
                containerClassName="bg-transparent border-0 min-h-[36px] max-h-[100px] px-2"
                className="text-xs text-zinc-900 dark:text-zinc-50"
              />
            </View>

            <Pressable
              onPress={() => void handleSend()}
              disabled={!text.trim() || generateMutation.isPending || (!!tokensData && tokensData.tokens < 20)}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-lg active:opacity-90',
                text.trim() && !generateMutation.isPending && (!tokensData || tokensData.tokens >= 20)
                  ? 'bg-orange-500'
                  : 'bg-transparent opacity-30',
              )}
            >
              <Send size={14} color={text.trim() ? '#FFFFFF' : '#71717A'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal 1: Gestion des Sources Actives */}
      <Modal
        visible={sourcesModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setSourcesModalVisible(false)}
      >
        <SourceModal
          setSourcesModalVisible={setSourcesModalVisible}
          docsLoading={docsLoading}
          activeDocs={activeDocs}
          handleRemoveDocument={handleRemoveDocument}
          setAddSourceVisible={setAddSourceVisible}
          removeDocMutation={removeDocMutation}
          handleAddDocument={handleAddDocument}
        />
      </Modal>

      {/* Modal 2: Sélection de documents de la bibliothèque */}
      <Modal
        visible={addSourceVisible}
        animationType="slide"
        statusBarTranslucent
        transparent={true}
        onRequestClose={() => setAddSourceVisible(false)}
      >
        <LibraryModal
          setAddSourceVisible={setAddSourceVisible}
          libraryDocs={libraryDocs}
          activeDocs={activeDocs}
          handleAddDocument={handleAddDocument}
          handleRemoveDocumentGlobal={handleRemoveDocumentGlobal}
          myDocsLoading={myDocsLoading || aiDocsLoading}
        />
      </Modal>

    </SafeAreaView>
  );
}