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
    <SafeAreaView className="flex-1 justify-end bg-black/60">
      <View className="bg-white dark:bg-[#0A0A0A] h-full border-t-2 border-zinc-100 dark:border-[#1A1A1A] flex-col">

        {/* Modal Header */}
        <View className="flex-row items-center justify-between border-b-2 border-zinc-100 dark:border-[#1A1A1A] px-6 py-4">
          <View className="flex-1 pr-4 justify-center">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Sources des Fichiers
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
              Sélection documentaire
            </Text>
          </View>
          <Pressable
            onPress={() => setAddSourceVisible(false)}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <X size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Toggle section (rounded-full) */}
        <View className="flex-row gap-3 my-4 px-6">
          <Pressable
            onPress={() => setView('library')}
            className={cn('flex-1 flex-row items-center justify-center gap-2.5 h-12 rounded-full transition-all',
              view === 'library' ? 'bg-orange-500' : 'bg-zinc-100 dark:bg-[#1A1A1A]')}
          >
            <Book size={16} color={view === "library" ? "#FFFFFF" : "#A1A1AA"} strokeWidth={2.5} />
            <Text className={cn("text-xs font-black uppercase tracking-widest",
              view === 'library' ? 'text-white' : 'text-zinc-950 dark:text-white'
            )}>Bibliothèque</Text>
          </Pressable>

          <Pressable
            onPress={() => setView('mine')}
            className={cn('flex-1 flex-row items-center justify-center gap-2.5 h-12 rounded-full transition-all',
              view === 'mine' ? 'bg-orange-500' : 'bg-zinc-100 dark:bg-[#1A1A1A]')}
          >
            <User size={16} color={view === "mine" ? "#FFFFFF" : "#A1A1AA"} strokeWidth={2.5} />
            <Text className={cn("text-xs font-black uppercase tracking-widest",
              view === 'mine' ? 'text-white' : 'text-zinc-950 dark:text-white'
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
            <View className="px-6 py-2 border-b border-zinc-100 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A]">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un document..."
              />
            </View>

            <View className="px-6 py-3">
              <Pressable
                onPress={handleUploadFromFile}
                disabled={uploadMutation.isPending}
                className="flex-row items-center justify-center gap-3 h-14 bg-orange-500 dark:bg-orange-500 rounded-full active:opacity-80"
              >
                {uploadMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-xs font-black uppercase tracking-widest text-white">Uploader un fichier</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Modal Body */}
            {myDocsLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : (
              <FlatList
                data={filteredDocs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 }}
                ItemSeparatorComponent={() => <View className="h-3" />}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between p-4 bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl">
                    <Pressable
                      onPress={() => handleAddDocument(item)}
                      className="flex-row items-center gap-4 flex-1 pr-3 active:opacity-80"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                        <FileText size={18} color="#F97316" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                          {formatBytes(item.fileSize)} • {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </Pressable>
                    {item.type === 'AI_ATTACHMENT' ? (
                      <Pressable
                        onPress={() => {
                          deleteAttachmentMutation.mutate(item.id);
                        }}
                        disabled={deleteAttachmentMutation.isPending}
                        hitSlop={10}
                        className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
                      >
                        {deleteAttachmentMutation.isPending ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                        )}
                      </Pressable>
                    ) : (
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2.5} />
                      </View>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <View className="items-center py-20 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] mt-6">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-5">
                      <FileText size={24} color="#F97316" strokeWidth={2.5} />
                    </View>
                    <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                      {searchQuery ? "Aucun document trouvé" : "Aucun document"}
                    </Text>
                    <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mt-2 leading-relaxed px-4">
                      {searchQuery
                        ? `Aucun fichier ne correspond à "${searchQuery}"`
                        : "Tous les documents sont déjà inclus ou la bibliothèque est vide."}
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