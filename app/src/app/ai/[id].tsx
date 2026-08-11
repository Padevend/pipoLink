import {
  useAddDocumentToSession,
  useAiHistory,
  useAiTokens,
  useMyAiAttachments,
  useRemoveDocumentFromSession,
  useSessionDocuments,
  useTruncateAiMessages,
} from '@/entities/ai/hooks';
import { useAiRequest } from '@/entities/ai/use-ai-request';
import { AiRequestManager } from '@/entities/ai/ai-request-manager';
import { useMyDocuments } from '@/entities/document/hooks';
import LibraryModal from '@/features/chat-ai/components/biblio-modal';
import SourceModal from '@/features/chat-ai/components/modal-source';
import { StudyAidSmartRenderer } from '@/features/chat-ai/components/study-aid/study-aid-smart-renderer';
import { ThoughtStreamLoader } from '@/features/chat-ai/components/thought-stream-loader';
import BubbleMenu from '@/features/messaging/components/Bubble-menu';
import { useAuth } from '@/providers';
import type { Document } from '@/shared/api/types';
import { useCopyToClipboard } from '@/shared/hooks/use-copy-to-clipboard';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useAiHistory(sessionId);
  const { data: activeDocs, isLoading: docsLoading, isError: docsError, refetch: refetchDocs } = useSessionDocuments(sessionId);

  const isPageError = historyError || docsError;
  const retryAll = useCallback(() => {
    void refetchHistory();
    void refetchDocs();
  }, [refetchHistory, refetchDocs]);

  const { data: myDocsData, isLoading: myDocsLoading } = useMyDocuments();
  const { data: aiDocsData, isLoading: aiDocsLoading } = useMyAiAttachments();
  const libraryDocs = useMemo(() => {
    const normalDocs = myDocsData?.pages.flatMap((page) => page.items) ?? [];
    const aiDocs = aiDocsData ?? [];
    return [...normalDocs, ...aiDocs];
  }, [myDocsData?.pages, aiDocsData]);

  const addDocMutation = useAddDocumentToSession();
  const removeDocMutation = useRemoveDocumentFromSession();
  const { sendMessage, generateStudyAid, isPending: isAnyPending } = useAiRequest(sessionId);
  const truncateMutation = useTruncateAiMessages();
  const { copyToClipboard } = useCopyToClipboard();

  const { user } = useAuth();
  const isPremium =
    user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';

  const flatListRef = useRef<FlatList>(null);
  // Brouillon local par session IA (restauré à la réouverture, TTL 24 h)
  const { text, setText, clearDraft } = useDraft(`ai_${sessionId}`);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [addSourceVisible, setAddSourceVisible] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [lastStudyAidType, setLastStudyAidType] = useState<string>('chat');

  const handleSend = () => {
    if (!text.trim() || isAnyPending) return;
    const msg = text.trim();
    clearDraft();
    sendMessage(msg);
    flatListRef.current?.scrollToEnd({ animated: true });
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

  const handleGenerateStudyAid = (type: string) => {
    if (isAnyPending) return;
    setLastStudyAidType(type);
    generateStudyAid(type);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessageContent = (content: string, isAi: boolean) => {
    return <StudyAidSmartRenderer content={content} isAi={isAi} />;
  };

  const { data: tokensData } = useAiTokens();
  const remainingTimeText = useMemo(() => {
    if (!tokensData?.timeRemainingMs) return null;
    const totalMinutes = Math.ceil(tokensData.timeRemainingMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [tokensData?.timeRemainingMs]);

  const prevHistoryLengthRef = useRef(0);
  useEffect(() => {
    if (history && history.length > prevHistoryLengthRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
    prevHistoryLengthRef.current = history?.length ?? 0;
  }, [history?.length]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* Header Mat */}
      <View className="flex-row items-center justify-between border-b border-zinc-100/80 bg-white px-4 py-2.5 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 active:bg-zinc-200 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={15} color="#71717A" />
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <Text className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">Hiro Notebook</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Badge de Jetons IA */}
          <Pressable
            onPress={() => router.push('/settings/subscription')}
            className="flex-row items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 active:opacity-80"
          >
            <Zap size={11} color="#F97316" />
            <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
              {tokensData ? tokensData.tokens.toLocaleString() : '...'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSourcesModalVisible(true)}
            className="flex-row items-center gap-1.5 h-7 rounded-full bg-zinc-100 border border-zinc-200/60 dark:bg-zinc-900 dark:border-zinc-800 px-2.5 active:bg-zinc-200 dark:active:bg-zinc-800"
          >
            <FolderOpen size={12} color="#71717A" />
            <Text className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              Sources ({activeDocs?.length ?? 0})
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

        {/* Pilules Horizontales d'Outils d'Étude */}
        <View className="border-b border-zinc-100/60 bg-zinc-50/40 dark:border-zinc-900/60 dark:bg-zinc-950/40 py-2 z-50">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
            {STUDY_AIDS.map((aid) => {
              const Icon = aid.icon;
              const isDisabled = isAnyPending || activeDocs?.length === 0;
              return (
                <Pressable
                  key={aid.id}
                  disabled={isDisabled}
                  onPress={() => handleGenerateStudyAid(aid.id)}
                  className={cn(
                    "flex-row items-center gap-1.5 px-3 h-7 rounded-full border",
                    isDisabled
                      ? "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/40 dark:border-zinc-800/40 opacity-40"
                      : "bg-white border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 shadow-2xs"
                  )}
                >
                  <Icon size={11} color={isDisabled ? "#A1A1AA" : "#F97316"} />
                  <Text className={cn("text-[10px] font-semibold tracking-tight", isDisabled ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-700 dark:text-zinc-300")}>
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
        ) : isPageError ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 mb-3">
              <Sparkles size={24} color="#EF4444" />
            </View>
            <Text className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200 text-center">
              Impossible de charger cette session
            </Text>
            <Text className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-[260px] leading-4">
              Le serveur n'a pas pu répondre. Vérifiez votre connexion et réessayez.
            </Text>
            <Pressable
              onPress={retryAll}
              className="mt-4 rounded-lg bg-orange-500 px-5 py-2 active:bg-orange-600"
            >
              <Text className="text-xs font-bold text-white">Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={history ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-zinc-100 dark:bg-zinc-900 my-5 max-w-[680px] w-full self-center" />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
            renderItem={({ item }) => {
              const isAi = item.role === 'assistant';
              const isFailed = item.status === 'fail';
              const isMenuOpen = activeMenuId === item.id;

              const handleResend = async () => {
                setActiveMenuId(null);
                await truncateMutation.mutateAsync({ sessionId, messageId: item.id, inclusive: false });
                sendMessage(item.content);
                flatListRef.current?.scrollToEnd({ animated: true });
              };

              const handleEdit = async () => {
                setActiveMenuId(null);
                await truncateMutation.mutateAsync({ sessionId, messageId: item.id, inclusive: true });
                setText(item.content);
              };

              const handleDelete = async () => {
                setActiveMenuId(null);
                await truncateMutation.mutateAsync({ sessionId, messageId: item.id, inclusive: true });
              };

              const handleCopy = () => {
                setActiveMenuId(null);
                void copyToClipboard(item.content, isAi ? 'Réponse IA copiée !' : 'Message copié !');
              };

              return (
                <View className="w-full max-w-[680px] self-center relative z-10 my-1">
                  {/* Menu Flottant Satiné (BubbleMenu) */}
                  {isMenuOpen && (
                    <BubbleMenu
                      isMine={!isAi}
                      isFailed={isFailed}
                      onCopy={handleCopy}
                      onResend={!isAi && !isFailed ? () => void handleResend() : undefined}
                      onEdit={!isAi && !isFailed ? () => void handleEdit() : undefined}
                      onDelete={!isAi ? () => void handleDelete() : undefined}
                      onRetry={isFailed ? () => AiRequestManager.retryFailedMessage(sessionId, item) : undefined}
                      onClose={() => setActiveMenuId(null)}
                    />
                  )}

                  <Pressable
                    onLongPress={() => setActiveMenuId(item.id)}
                    delayLongPress={220}
                    onPress={() => isMenuOpen && setActiveMenuId(null)}
                    className="active:opacity-95"
                  >
                    {isAi ? (
                      /* Bloc Réponse HIRO - Pleine Largeur avec Bordure Latérale d'Accent */
                      <View className="w-full mt-2">
                        <Text className="text-[11px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-2">
                          HIRO
                        </Text>
                        <View className="py-0.5">
                          {renderMessageContent(item.content, isAi)}
                        </View>
                      </View>
                    ) : (
                      /* Pavé Énoncé / Question Utilisateur - Fond Sobre & Angles Droits */
                      <View className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 p-4 rounded-[4px]">
                        <Text className="text-[10px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mb-1.5">
                          Énoncé
                        </Text>
                        {renderMessageContent(item.content, isAi)}
                      </View>
                    )}
                  </Pressable>

                  {isFailed && (
                    <View className="flex-row items-center gap-2 mt-2 px-1">
                      <Text className="text-[10px] text-red-500 font-bold">Échec de l'envoi</Text>
                      <Pressable
                        onPress={() => AiRequestManager.retryFailedMessage(sessionId, item)}
                        className="bg-orange-500/10 px-2 py-0.5 rounded"
                      >
                        <Text className="text-[10px] font-bold text-orange-500">Réessayer</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => AiRequestManager.deleteFailedMessage(sessionId, item.id)}
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
            ListFooterComponent={
              isAnyPending ? (
                <ThoughtStreamLoader
                  type={lastStudyAidType}
                />
              ) : null
            }
          />
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
            {!isPremium && (
              <Pressable
                onPress={() => router.push('/settings/subscription')}
                className="rounded-lg bg-orange-500 px-3 py-1.5 active:bg-orange-600"
              >
                <Text className="text-[11px] font-bold text-white">Passer Premium</Text>
              </Pressable>
            )}
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
              disabled={!text.trim() || isAnyPending || (!!tokensData && tokensData.tokens < 20)}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-lg active:opacity-90',
                text.trim() && !isAnyPending && (!tokensData || tokensData.tokens >= 20)
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