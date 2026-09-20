import { useCreateAiSession, useMyAiAttachments } from '@/entities/ai/hooks';
import { useMyDocuments } from '@/entities/document/hooks';
import LibraryModal from '@/features/chat-ai/components/biblio-modal';
import type { Document } from '@/shared/api/types';
import { useSafeArea } from '@/shared/hooks/use-safe-area';
import { formatBytes } from '@/shared/lib/file';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, FileText, FolderOpen, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A] justify-center items-center px-8" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="mt-6 text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
          {statusMessage}
        </Text>
        <Text className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center leading-relaxed px-4">
          Hiro analyse vos cours pour générer des explications et quiz personnalisés.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Nouveau Notebook
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Espace d'étude IA
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
          
          {/* Section: Title */}
          <View className="mb-8">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
              Titre du Notebook *
            </Text>
            <Input
              placeholder="Ex: Analyse Algèbre Linéaire, Révisions..."
              value={title}
              onChangeText={setTitle}
              className="text-sm font-bold text-zinc-950 dark:text-white"
            />
          </View>

          {/* Section: Documents */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Sources Documentaires ({selectedDocs.length})
              </Text>
            </View>

            {/* Selection & Upload Row */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => setAddSourceVisible(true)}
                className="flex-1 flex-row items-center justify-center gap-2 h-14 bg-orange-500 rounded-full active:opacity-80"
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                <Text className="text-xs font-black uppercase tracking-widest text-white">Associer un document</Text>
              </Pressable>
            </View>

            {myDocsLoading ? (
              <View className="py-12 justify-center items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : selectedDocsObjects.length > 0 ? (
              <View className="rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
                {selectedDocsObjects.map((doc, index) => (
                  <View key={doc.id}>
                    {index > 0 && <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />}
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-row items-center gap-4 flex-1 pr-3">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                          <FileText size={18} color="#F97316" strokeWidth={2.5} />
                        </View>
                        <View className="flex-1 justify-center">
                          <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
                            {doc.title}
                          </Text>
                          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                            {formatBytes(doc.fileSize)} • {doc.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => toggleDocument(doc.id)}
                        hitSlop={10}
                        className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
                      >
                        <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] py-12 px-6 items-center justify-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                  <FolderOpen size={24} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                  Aucun document sélectionné
                </Text>
                <Text className="text-xs font-bold text-zinc-400 text-center mt-2">
                  Associez des sources pour alimenter votre notebook.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions Plat et Solide */}
        <View 
          className="border-t-2 border-zinc-100 bg-white p-6 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate}
            className={cn(
              "flex-row items-center justify-center gap-3 w-full h-14 rounded-full active:opacity-80",
              canCreate ? "bg-orange-500" : "bg-zinc-200 dark:bg-[#222222]"
            )}
          >
            <Text className={cn("text-xs font-black uppercase tracking-widest", canCreate ? "text-white" : "text-zinc-400 dark:text-zinc-500")}>
              Créer le Notebook
            </Text>
            <ArrowRight size={18} color={canCreate ? "#FFFFFF" : "#A1A1AA"} strokeWidth={2.5} />
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