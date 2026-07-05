import {
  useAiChat,
  useAiHistory,
  useSessionDocuments,
  useAddDocumentToSession,
  useRemoveDocumentFromSession,
  useGenerateStudyAid
} from '@/entities/ai/hooks';
import { useMyDocuments } from '@/entities/document/hooks';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Sparkles,
  BookOpen,
  FolderOpen,
  HelpCircle,
  Clock,
  Columns,
  Layers,
} from 'lucide-react-native';
import { useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
  Modal,
  ScrollView
} from 'react-native';
import { useSafeArea } from '@/shared/hooks/use-safe-area';
import { SafeAreaView } from 'react-native-safe-area-context';
import SourceModal from '@/features/chat-ai/components/modal-source';
import LibraryModal from '@/features/chat-ai/components/biblio-modal';

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
  const libraryDocs = useMemo(
    () => myDocsData?.pages.flatMap((page) => page.items) ?? [],
    [myDocsData?.pages]
  );

  const addDocMutation = useAddDocumentToSession();
  const removeDocMutation = useRemoveDocumentFromSession();
  const generateMutation = useGenerateStudyAid();
  const chatMutation = useAiChat();

  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState('');
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [addSourceVisible, setAddSourceVisible] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    try {
      await chatMutation.mutateAsync({ message: msg, sessionId });
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.warn('[useAiChat] failed:', err);
    }
  };

  const handleAddDocument = async (documentId: string) => {
    try {
      await addDocMutation.mutateAsync({ sessionId, documentId });
      setAddSourceVisible(false);
    } catch (err) {
      console.warn('[addDocument] failed:', err);
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
              return (
                <View className={cn('mb-3 max-w-[85%]', isAi ? 'self-start items-start' : 'self-end items-end')}>
                  <View
                    className={cn(
                      'px-4 py-2.5 rounded-2xl',
                      isAi
                        ? 'rounded-tl-sm border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/60'
                        : 'rounded-tr-sm bg-orange-500',
                    )}
                  >
                    {renderMessageContent(item.content, isAi)}
                  </View>
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

        {/* Barre de Saisie Opaque */}
        <View 
          className="border-t border-zinc-100 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            <View className="flex-1">
              <Input
                placeholder="Posez votre question..."
                value={text}
                onChangeText={setText}
                multiline
                containerClassName="bg-transparent border-0 min-h-[36px] max-h-[100px] px-2"
                className="text-xs text-zinc-900 dark:text-zinc-50"
              />
            </View>

            <Pressable
              onPress={() => void handleSend()}
              disabled={!text.trim() || chatMutation.isPending || generateMutation.isPending}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-lg active:opacity-90',
                text.trim() && !chatMutation.isPending && !generateMutation.isPending
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
        onRequestClose={() => setSourcesModalVisible(false)}
      >
        <SourceModal
          setSourcesModalVisible={setSourcesModalVisible}
          docsLoading={docsLoading}
          activeDocs={activeDocs}
          handleRemoveDocument={handleRemoveDocument}
          setAddSourceVisible={setAddSourceVisible}
          removeDocMutation={removeDocMutation}
        />
      </Modal>

      {/* Modal 2: Sélection de documents de la bibliothèque */}
      <Modal
        visible={addSourceVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddSourceVisible(false)}
      >
        <LibraryModal
          setAddSourceVisible={setAddSourceVisible}
          libraryDocs={libraryDocs}
          activeDocs={activeDocs}
          handleAddDocument={handleAddDocument}
          myDocsLoading={myDocsLoading}
        />
      </Modal>

    </SafeAreaView>
  );
}