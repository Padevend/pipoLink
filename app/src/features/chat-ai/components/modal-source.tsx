import { formatBytes } from '@/shared/lib/file';
import {
    X,
    FolderOpen,
    Plus,
    Trash2,
    FileText,
    Upload,
} from 'lucide-react-native';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from 'react-native';
import { Document } from '@/shared/api/types';

interface SourceModalProps {
    setSourcesModalVisible: (visible: boolean) => void;
    docsLoading: boolean;
    activeDocs: Document[] | undefined;
    handleRemoveDocument: (documentId: string) => void;
    setAddSourceVisible: (visible: boolean) => void;
    removeDocMutation: any;
    handleAddDocument: (doc: Document) => void;
}

export default function SourceModal(
    {
        setSourcesModalVisible,
        docsLoading, 
        activeDocs,
        handleRemoveDocument,
        setAddSourceVisible,
        removeDocMutation,
        handleAddDocument
    }: SourceModalProps) {

    return (
        <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white dark:bg-zinc-950 h-[75%] rounded-t-2xl border-t border-zinc-100 dark:border-zinc-900 flex-col">

                {/* Modal Header */}
                <View className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-5 py-4">
                    <View className="flex-1 pr-4">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            Sources Documentaires
                        </Text>
                        <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-4">
                            L'IA utilisera exclusivement ces fichiers pour générer des réponses.
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => setSourcesModalVisible(false)}
                        className="h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100"
                    >
                        <X size={15} color="#71717A" />
                    </Pressable>
                </View>

                {/* Modal Body */}
                {docsLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#F97316" />
                    </View>
                ) : (
                    <View className="flex-1 p-4">
                        
                        {/* Association & Upload Row */}
                        <View className="flex-row gap-2 mb-4">
                            <Pressable
                                onPress={() => setAddSourceVisible(true)}
                                className="flex-1 flex-row items-center justify-center gap-2 h-11 bg-orange-500 rounded-xl active:bg-orange-600"
                            >
                                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                                <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Associer un documents</Text>
                            </Pressable>
                        </View>

                        <FlatList
                            data={activeDocs}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => <View className="h-2" />}
                            renderItem={({ item }) => (
                                <View className="flex-row items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl">
                                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                                        <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/20">
                                            <FileText size={15} color="#F97316" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100" numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                                {formatBytes(item.fileSize)} · {item.type.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <Pressable
                                        onPress={() => handleRemoveDocument(item.id)}
                                        disabled={removeDocMutation.isPending}
                                        className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20 active:opacity-80"
                                    >
                                        <Trash2 size={14} color="#EF4444" />
                                    </Pressable>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View className="items-center py-12 px-6">
                                    <FolderOpen size={32} color="#A1A1AA" className="mb-2" />
                                    <Text className="text-xs font-bold text-zinc-400 dark:text-zinc-500 text-center">
                                        Aucune source active
                                    </Text>
                                    <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center mt-1 px-4 leading-4">
                                        Associez des cours ou des livres afin d'activer la recherche contextuelle.
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </View>
        </View>
    )
}