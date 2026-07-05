import { Document } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import {
  X,
  FileText,
  ChevronRight
} from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

interface modalprops{
    setAddSourceVisible : (visible: boolean) => void;
    libraryDocs: Document[];
    activeDocs: Document[] | undefined;
    handleAddDocument: (documentId: string) => void;
    myDocsLoading: boolean;
}

export default function LibraryModal({
    setAddSourceVisible,
    libraryDocs,
    activeDocs,
    handleAddDocument,
    myDocsLoading
}: modalprops){
    return (
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-zinc-950 h-[65%] rounded-t-2xl border-t border-zinc-100 dark:border-zinc-900 flex-col">
            
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-5 py-4">
              <View className="flex-1 pr-4">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Bibliothèque de Fichiers
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

            {/* Modal Body */}
            {myDocsLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#F97316" />
              </View>
            ) : (
              <FlatList
                data={libraryDocs.filter(d => !activeDocs?.some(ad => ad.id === d.id))}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View className="h-2" />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleAddDocument(item.id)}
                    className="flex-row items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl active:bg-zinc-50 dark:active:bg-zinc-800/60"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <FileText size={16} color="#71717A" />
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {formatBytes(item.fileSize)} · {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={14} color="#A1A1AA" />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="items-center py-16 px-6">
                    <FileText size={26} color="#A1A1AA" className="mb-2" />
                    <Text className="text-xs font-bold text-zinc-400 dark:text-zinc-500 text-center">
                      Aucun document disponible
                    </Text>
                    <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center mt-1 px-4 leading-4">
                      Tous les documents de votre bibliothèque sont déjà inclus ou celle-ci est vide.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
    )
}