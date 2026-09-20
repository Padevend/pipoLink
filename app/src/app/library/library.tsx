import LibraryExplorerComponnent from '@/features/library/components/explorer';
import type { Document } from '@/shared/api/types';
import { router } from 'expo-router';
import { ArrowDownToLine, ArrowLeft, Upload, User } from 'lucide-react-native';
import { useCallback } from 'react';
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
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

            {/* HEADER : Style Néo-banque Plat et Franc */}
            <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
                
                <View className="flex-row items-center gap-4 flex-1">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
                    >
                        <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
                    </Pressable>

                    <View className="flex-1">
                        <Text 
                            className="text-lg font-black tracking-tight text-zinc-950 dark:text-white"
                            numberOfLines={1}
                        >
                            Bibliothèque
                        </Text>
                    </View>
                </View>

                {/* Actions : Boutons strictement arrondis (rounded-full) sans transparence */}
                <View className="flex-row items-center gap-2.5">
                    <Pressable
                        onPress={() => router.push("/library/history")}
                        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
                    >
                        <ArrowDownToLine size={18} color="#A1A1AA" strokeWidth={2.5} />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/library/my-documents")}
                        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
                    >
                        <User size={18} color="#A1A1AA" strokeWidth={2.5} />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/modal/upload-document")}
                        className="h-10 w-10 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
                    >
                        <Upload size={18} color="#FFFFFF" strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <LibraryExplorerComponnent
                documentAction={openDocument}
                showAISearch={true}
            />
        </SafeAreaView>
    );
}