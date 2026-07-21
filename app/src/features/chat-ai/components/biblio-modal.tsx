import { useDeleteAiAttachment, useUploadAiAttachment } from '@/entities/ai/hooks';
import LibraryExplorerComponnent from '@/features/library/components/explorer';
import { Document } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { SearchBar } from '@/shared/ui/search-bar';
import { cn } from '@/shared/utils/cn';
import * as DocumentPicker from 'expo-document-picker';
import {
  Book,
  ChevronRight,
  FileText,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface modalprops {
  setAddSourceVisible: (visible: boolean) => void;
  libraryDocs: Document[];
  activeDocs: Document[] | undefined;
  handleAddDocument: (doc: Document) => void;
  handleRemoveDocumentGlobal?: (id: string) => void;
  myDocsLoading: boolean;
}

export default function LibraryModal({
  setAddSourceVisible,
  libraryDocs,
  activeDocs,
  handleAddDocument,
  myDocsLoading
}: modalprops) {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'library' | 'mine'>('library');

  const filteredDocs = libraryDocs.filter(d => {
    const notAlreadyActive = !activeDocs?.some(ad => ad.id === d.id);
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    return notAlreadyActive && matchesSearch;
  });

  const uploadMutation = useUploadAiAttachment();
  const deleteAttachmentMutation = useDeleteAiAttachment();

  const handleUploadFromFile = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
  
        if (result.canceled) return;
  
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size,
        };
  
        const fileTitle = asset.name.replace(/\.[^.]+$/, '');
  
        // Non-blocking upload mutation
        uploadMutation.mutate({
          file,
          metadata: {
            title: fileTitle || 'Fichier importé',
            type: 'AI_ATTACHMENT',
            filiere: 'Général',
            niveau: 'L1',
            ue: 'Général',
          }
        }, {
          onSuccess: (newDoc) => {
            handleAddDocument(newDoc);
          }
        });
      } catch (err) {
        console.error('[NewNotebookUpload] error picking/uploading file:', err);
      }
    };

  return (
    <SafeAreaView className="flex-1 justify-end bg-black/50">
      <View className="bg-white dark:bg-zinc-950 h-full border-t border-zinc-100 dark:border-zinc-900 flex-col">

        {/* Modal Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-5 py-4">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Sources des Fichiers
            </Text>
            <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Choisissez un document existant pour l'ajouter au notebook.
            </Text>
          </View>
          <Pressable
            onPress={() => setAddSourceVisible(false)}
            className="h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100"
          >
            <X size={15} color="#71717A" />
          </Pressable>
        </View>

        {/* Toggle section */}
        {/* Selection & Upload Row */}
        <View className="flex-row gap-4 my-4 px-4">
          <Pressable
            onPress={() => setView('library')}
            className={cn('flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl',
              view === 'library' && 'bg-orange-500 active:bg-orange-600')}
          >
            <Book size={15} color={view === "library" ? "#FFFFFF" : "#71717A"} strokeWidth={2.5} />
            <Text className={cn("text-[11px] font-bold uppercase tracking-wider",
              view === 'library' ? 'text-white' : 'text-zinc-500'
            )}>Bibliothèque</Text>
          </Pressable>

          <Pressable
            onPress={() => setView('mine')}
            className={cn('flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl',
              view === 'mine' && 'bg-orange-500 active:bg-orange-600')}
          >
            <User size={15} color={view === "mine" ? "#FFFFFF" : "#71717A"} strokeWidth={2.5} />
            <Text className={cn("text-[11px] font-bold uppercase tracking-wider",
              view === 'mine' ? 'text-white' : 'text-zinc-500'
            )}>Mes Documents</Text>
          </Pressable>
        </View>

        {view === "library" && (
          <>
            <LibraryExplorerComponnent
              documentAction={handleAddDocument}
              showAISearch={false}
            />
          </>
        )}

        {view === "mine" && (
          <>
            {/* Search Input Bar */}
            <View className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un document..."
              />
            </View>

            <Pressable
              onPress={handleUploadFromFile}
              disabled={uploadMutation.isPending}
              className="flex-grow flex-row items-center justify-center gap-2 max-h-11 border border-orange-500 bg-white dark:bg-zinc-900 rounded-xl active:bg-orange-50 dark:active:bg-orange-950/10 mx-4"
            >
              {uploadMutation.isPending ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <>
                  <Upload size={15} color="#F97316" strokeWidth={2.5} />
                  <Text className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Uploader un fichier</Text>
                </>
              )}
            </Pressable>

            {/* Modal Body */}
            {myDocsLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : (
              <FlatList
                data={filteredDocs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View className="h-2" />}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                    <Pressable
                      onPress={() => handleAddDocument(item)}
                      className="flex-row items-center gap-3 flex-1 pr-2 active:opacity-75"
                    >
                      <FileText size={16} color="#71717A" />
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {formatBytes(item.fileSize)} · {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </Pressable>
                    {item.type === 'AI_ATTACHMENT' ? (
                      <Pressable
                        onPress={() => {
                          deleteAttachmentMutation.mutate(item.id);
                        }}
                        disabled={deleteAttachmentMutation.isPending}
                        className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20 active:opacity-85"
                      >
                        {deleteAttachmentMutation.isPending ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Trash2 size={13} color="#EF4444" />
                        )}
                      </Pressable>
                    ) : (
                      <ChevronRight size={14} color="#A1A1AA" />
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <View className="items-center py-16 px-6">
                    <FileText size={26} color="#A1A1AA" className="mb-2" />
                    <Text className="text-xs font-bold text-zinc-400 dark:text-zinc-500 text-center">
                      {searchQuery ? "Aucun document correspondant" : "Aucun document disponible"}
                    </Text>
                    <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center mt-1 px-4 leading-4">
                      {searchQuery
                        ? `Aucun fichier de votre bibliothèque ne correspond à "${searchQuery}"`
                        : "Tous les documents de votre bibliothèque sont déjà inclus ou celle-ci est vide."}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView> 
  )
}