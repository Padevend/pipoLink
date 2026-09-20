import { AiRequestManager } from '@/entities/ai/ai-request-manager';
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
import { AiInputBar } from '@/shared/ui/ai-input-bar';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Columns,
  FolderOpen,
  HelpCircle,
  Layers,
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
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const STUDY_AIDS = [
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

  // Gestion du brouillon par session IA (100% natif sans RHF)
  const { text: draftText, setText: setDraft, clearDraft } = useDraft(`ai_${sessionId}`);

  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [addSourceVisible, setAddSourceVisible] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [lastStudyAidType, setLastStudyAidType] = useState<string>('chat');
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);

  const handleSendText = useCallback((content: string) => {
    if (!content.trim()) return;
    clearDraft();
    sendMessage(content.trim());
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [sendMessage, clearDraft]);

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
    if (!activeDocs?.length) return;
    setStudyMenuOpen(false);
    setLastStudyAidType(type);
    generateStudyAid(type);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessageContent = (content: string, isAi: boolean, studyAidType?: 'summary' | 'faq' | 'quiz' | 'flashcards' | 'timeline' | 'comparison') => {
    return <StudyAidSmartRenderer content={content} isAi={isAi} studyAidType={studyAidType} />;
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

  const isTokensLow = tokensData && tokensData.tokens < 20;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

      {/* HEADER : Néo-banque, Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Hiro Notebook
          </Text>
          <Text className="text-[8px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Assistant IA & Analyse
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          {/* Badge de Jetons IA (rounded-full) */}
          <Pressable
            onPress={() => router.push('/settings/subscription')}
            className="flex-row items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-2 active:opacity-80"
          >
            <Zap size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-xs font-black tracking-widest text-white">
              {tokensData ? tokensData.tokens.toLocaleString() : '...'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSourcesModalVisible(true)}
            className="flex-row items-center gap-2 h-10 px-4 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
          >
            <FolderOpen size={16} color="#F97316" strokeWidth={2.5} />
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
              ({activeDocs?.length ?? 0})
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >

        {/* Historique des Messages */}
        {historyLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : isPageError ? (
          <View className="flex-1 justify-center items-center px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-5">
              <Sparkles size={28} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
              Impossible de charger cette session
            </Text>
            <Text className="mt-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center max-w-[280px] leading-relaxed">
              Le serveur n'a pas pu répondre. Vérifiez votre connexion et réessayez.
            </Text>
            <Pressable
              onPress={retryAll}
              className="mt-6 rounded-full bg-orange-500 h-14 px-8 items-center justify-center active:opacity-80"
            >
              <Text className="text-xs font-black uppercase tracking-widest text-white">Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={history ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View className="w-full bg-zinc-200 dark:bg-[#222222] my-6 max-w-[680px] self-center" />
            )}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
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
                setDraft(item.content);
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
                      <View className="w-full mt-2">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-3">
                          HIRO
                        </Text>
                        <View className="py-1">
                          {renderMessageContent(item.content, isAi, item.studyAidType)}
                        </View>
                      </View>
                    ) : (
                      <View className="w-full bg-zinc-100 dark:bg-[#1A1A1A] p-5 rounded-2xl">
                        {renderMessageContent(item.content, isAi, item.studyAidType)}
                      </View>
                    )}
                  </Pressable>

                  {isFailed && (
                    <View className="flex-row items-center gap-3 mt-3 px-1">
                      <Text className="text-xs font-black uppercase tracking-widest text-red-500">Échec de l'envoi</Text>
                      <Pressable
                        onPress={() => AiRequestManager.retryFailedMessage(sessionId, item)}
                        className="bg-orange-500/10 px-3 py-1 rounded-full"
                      >
                        <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">Réessayer</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => AiRequestManager.deleteFailedMessage(sessionId, item.id)}
                        className="bg-red-500/10 px-3 py-1 rounded-full"
                      >
                        <Text className="text-[10px] font-black uppercase tracking-widest text-red-500">Supprimer</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-24 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] mt-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 mb-5">
                  <Sparkles size={28} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                  Discutez avec Hiro pour analyser vos cours
                </Text>
                <Text className="mt-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center max-w-[280px] leading-relaxed">
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
        {isTokensLow && (
          <View className="mx-6 mb-3 flex-row items-center justify-between rounded-2xl bg-orange-500/10 border-1 border-orange-500/30 p-4">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-black uppercase tracking-widest text-orange-500">
                Solde de jetons insuffisant ({tokensData?.tokens} / {tokensData?.maxTokens})
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                Restauration automatique dans {remainingTimeText || 'quelques minutes'}.
              </Text>
            </View>
            {!isPremium && (
              <Pressable
                onPress={() => router.push('/settings/subscription')}
                className="rounded-full bg-orange-500 px-4 py-2.5 active:opacity-80"
              >
                <Text className="text-[10px] font-black uppercase tracking-widest text-white">Passer Premium</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* FOOTER / COMPOSER ISOLÉ ET FLOTTANT */}
        <View style={{ paddingBottom: Math.max(insets.bottom, 24) }} className="px-4 pt-2 bg-white dark:bg-[#0A0A0A] border-t-2 border-zinc-100 dark:border-[#1A1A1A]">
          <AiInputBar
            text={draftText}
            setText={setDraft}
            onSend={handleSendText}
            studyMenuOpen={studyMenuOpen}
            setStudyMenuOpen={setStudyMenuOpen}
            STUDY_AIDS={STUDY_AIDS}
            activeDocs={activeDocs}
            handleGenerateStudyAid={handleGenerateStudyAid}
            isLocked={Boolean(isTokensLow)}
          />
          <Text className="mt-3 text-center text-[11px] font-normal tracking-widest text-zinc-400">HIRO peut se tromper. Vérifiez les notions importantes.</Text>
        </View>

      </KeyboardAvoidingView>

      <Modal
        visible={sourcesModalVisible}
        animationType="slide"
        transparent
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
      <Modal
        visible={addSourceVisible}
        animationType="slide"
        statusBarTranslucent
        transparent
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