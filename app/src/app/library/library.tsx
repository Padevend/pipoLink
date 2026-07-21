import LibraryExplorerComponnent from '@/features/library/components/explorer';
import { router } from 'expo-router';
import { ArrowDownToLine, ArrowLeft, Upload, User } from 'lucide-react-native';
import { useCallback } from 'react';
import type { Document } from '@/shared/api/types';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryExplorerScreen() {
    const openDocument = useCallback(
        (doc: Document) => {
            router.push({ pathname: '/library/document/[id]', params: { id: doc.id } } as never);
        },
        [],
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

            {/* En-tête Mat Épuré */}
            <View className="border-b border-zinc-100 bg-white px-5 pt-4 pb-3 dark:border-zinc-900 dark:bg-zinc-950">

                <View className="mb-4 flex-row items-center justify-between">

                    <Pressable
                        onPress={() => router.back()}
                        className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
                    >
                        <ArrowLeft size={16} color="#71717A" />
                    </Pressable>

                    <View className="flex-1 pl-3">
                        <Text className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Bibliothèque
                        </Text>
                    </View>

                    {/* Actions secondaires rectangulaires + Action principale orange */}
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => router.push("/library/history")}
                            className="h-10 w-10 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
                        >
                            <ArrowDownToLine size={18} color="#A1A1AA" />
                        </Pressable>

                        <Pressable
                            onPress={() => router.push("/library/my-documents")}
                            className="h-10 w-10 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
                        >
                            <User size={18} color="#A1A1AA" />
                        </Pressable>

                        <Pressable
                            onPress={() => router.push("/modal/upload-document")}
                            className="h-10 w-10 items-center justify-center rounded-xl bg-orange-500 dark:bg-orange-600 active:opacity-90"
                        >
                            <Upload size={18} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>
            </View>

            <LibraryExplorerComponnent
                documentAction={openDocument}
                showAISearch={true}
            />
        </SafeAreaView>
    );
}