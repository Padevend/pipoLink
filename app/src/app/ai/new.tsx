import { useCreateAiSession, useMyAiAttachments } from '@/entities/ai/hooks';
import { useMyDocuments } from '@/entities/document/hooks';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { formatBytes } from '@/shared/lib/file';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Plus, FolderOpen, ArrowRight, Trash2 } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
  ScrollView,
  Modal
} from 'react-native';
import { useSafeArea } from '@/shared/hooks/use-safe-area';
import { SafeAreaView } from 'react-native-safe-area-context';
import LibraryModal from '@/features/chat-ai/components/biblio-modal';
import type { Document } from '@/shared/api/types';

export default function NewAiChatScreen() {
  const insets = useSafeArea();
  const createSessionMutation = useCreateAiSession();
  const { data: myDocsData, isLoading: myDocsLoading } = useMyDocuments();
  const { data: aiDocsData, isLoading: aiDocsLoading } = useMyAiAttachments();

  const [title, setTitle] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedDocsMap, setSelectedDocsMap] = useState<Record<string, Document>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [addSourceVisible, setAddSourceVisible] = useState(false);

  const libraryDocs = useMemo(() => {
    const normalDocs = myDocsData?.pages.flatMap((page) => page.items) ?? [];
    const aiDocs = aiDocsData ?? [];
    return [...normalDocs, ...aiDocs];
  }, [myDocsData?.pages, aiDocsData]);

  const toggleDocument = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleAddDocumentFromLibrary = (doc: Document) => {
    if (!selectedDocs.includes(doc.id)) {
      setSelectedDocs((prev) => [...prev, doc.id]);
      setSelectedDocsMap((prev) => ({ ...prev, [doc.id]: doc }));
    }
    setAddSourceVisible(false);
  };

  const handleRemoveDocumentGlobal = (id: string) => {
    setSelectedDocs((prev) => prev.filter((dId) => dId !== id));
  };

  const selectedDocsObjects = useMemo(() => {
    return selectedDocs
      .map((id) => selectedDocsMap[id] || libraryDocs.find((d) => d.id === id))
      .filter((d): d is Document => !!d);
  }, [libraryDocs, selectedDocs, selectedDocsMap]);

  const canCreate = title.trim().length > 0 && !createSessionMutation.isPending && !isInitializing;

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsInitializing(true);
    setStatusMessage('Création du notebook...');

    try {
      const result = await createSessionMutation.mutateAsync({
        title: title.trim(),
        documentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
      });

      setStatusMessage('Préparation du studio d\'étude...');
      router.replace(`/ai/${result.session.id}`);
    } catch (err) {
      console.error('[CreateNotebook] failed:', err);
      setIsInitializing(false);
      setStatusMessage('');
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 justify-center items-center px-8" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
          {statusMessage}
        </Text>
        <Text className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 text-center leading-5 px-4">
          Hiro analyse vos cours pour générer des explications et quiz personnalisés.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* Header Mat Épuré */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={16} color="#71717A" />
        </Pressable>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Nouveau Notebook</Text>
        </View>
        <View className="w-8" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
          
          {/* Section: Title */}
          <View className="mb-10">
            <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 pl-1">
              Titre du Notebook *
            </Text>
            <Input
              placeholder="Ex: Analyse Algèbre Linéaire, Révisions Médicales..."
              value={title}
              onChangeText={setTitle}
              containerClassName="bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl h-11"
              className="text-sm text-zinc-900 dark:text-zinc-50"
            />
          </View>

          {/* Section: Documents */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-2.5 pl-1">
              <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Sources Documentaires ({selectedDocs.length})
              </Text>
            </View>

            {/* Selection & Upload Row */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setAddSourceVisible(true)}
                className="flex-1 flex-row items-center justify-center gap-2 h-11 bg-orange-500 rounded-xl active:bg-orange-600"
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Associer un document</Text>
              </Pressable>
            </View>

            {myDocsLoading ? (
              <View className="py-8 justify-center items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : selectedDocsObjects.length > 0 ? (
              <View className="rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden bg-white dark:bg-zinc-900/40">
                {selectedDocsObjects.map((doc) => (
                  <View
                    key={doc.id}
                    className="flex-row items-center justify-between p-3 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/20">
                        <FileText size={15} color="#F97316" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100" numberOfLines={1}>
                          {doc.title}
                        </Text>
                        <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {formatBytes(doc.fileSize)} · {doc.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => toggleDocument(doc.id)}
                      className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20 active:opacity-80"
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20">
                <FolderOpen size={22} color="#A1A1AA" className="mb-2" />
                <Text className="text-xs text-zinc-400 dark:text-zinc-500 text-center font-medium">
                  Aucun document sélectionné pour ce notebook
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions Opaque et Mat */}
        <View 
          className="border-t border-zinc-100 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate}
            className={cn(
              "flex-row items-center justify-center gap-2 w-full h-11 rounded-xl active:opacity-95",
              canCreate ? "bg-orange-500" : "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <Text className={cn("text-xs font-bold uppercase tracking-wide", canCreate ? "text-white" : "text-zinc-400 dark:text-zinc-500")}>
              Créer le Notebook
            </Text>
            <ArrowRight size={14} color={canCreate ? "#FFFFFF" : "#A1A1AA"} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal: Sélection de documents de la bibliothèque */}
      <Modal
        visible={addSourceVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddSourceVisible(false)}
      >
        <LibraryModal
          setAddSourceVisible={setAddSourceVisible}
          libraryDocs={libraryDocs}
          activeDocs={selectedDocsObjects}
          handleAddDocument={handleAddDocumentFromLibrary}
          handleRemoveDocumentGlobal={handleRemoveDocumentGlobal}
          myDocsLoading={myDocsLoading || aiDocsLoading}
        />
      </Modal>
    </SafeAreaView>
  );
}