import { useInitLibrary } from "@/entities/document/hooks/use-library";
import { ExplorerFileRow, RenderDocumentItem } from "@/features/library/components/explorer-file-row";
import { useAuth } from "@/providers";
import { Button } from "@/shared/ui/button";
import DataUIProvider from "@/shared/ui/data-ui-provider";
import { Skeleton } from "@/shared/ui/skeleton";
import { router } from "expo-router";
import { ArrowDownToLine, BookOpen, FolderOpen, RefreshCcw, Upload, User } from "lucide-react-native";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE_PRINCIPAL = '#F97316';

export default function LibraryScreen() {
  const { user } = useAuth();
  const {
    isLoadingPopular,
    isLoadingRecommended,
    isErrorPopular,
    isErrorRecommended,
    recommendedDocuments,
    popularDocuments,
    refetchPopular,
    refetchRecommended
  } = useInitLibrary(user?.profile ?? undefined);

  const openDocument = useCallback(
    (id: string) => {
      router.push({ pathname: '/library/document/[id]', params: { id } } as never);
    },
    [router],
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* EN-TÊTE PLAT (Header) */}
        <View className="border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-900 dark:bg-[#0A0A0A]">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                Bibliothèque
              </Text>

              <View className="flex-row items-center gap-2 mt-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <Text className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                  Filière · Niveau · UE
                </Text>
              </View>
            </View>

            {/* BOUTONS D'ACTION (Arrondis complets : rounded-full) */}
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
        </View>

        <View className="px-6 pt-6">
          {/* CARD D'INFORMATION (Arrondis modérés : rounded-2xl) */}
          <View className="rounded-2xl bg-zinc-100 p-5 dark:bg-[#1A1A1A]">
            <Text className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white">
              Espace de Connaissances
            </Text>
            <Text className="mt-2 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
              Consultez les fichiers de votre promotion ou importez de nouvelles ressources d'étude pour vos camarades.
            </Text>
          </View>

          {/* BOUTON PRINCIPAL (Arrondi complet : rounded-full) */}
          <View className="mt-6 mb-8">
            <Button
              label="Explorer la bibliothèque"
              leftIcon={<BookOpen size={18} color="#fff" strokeWidth={2.5} />}
              onPress={() => router.push("/library/library")}
              className="rounded-full h-12 bg-orange-500 active:bg-orange-600"
            />
          </View>

          {/* SECTION : LES PLUS TÉLÉCHARGÉS */}
          <View className="flex-row justify-between items-center border-b-2 border-zinc-100 pb-3 mb-4 dark:border-[#1A1A1A]">
            <View className="flex-row items-center gap-3">
              <View className="h-2 w-2 bg-orange-500 rounded-full" />
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Les plus téléchargés
              </Text>
            </View>
            <Pressable
              onPress={() => refetchPopular()}
              className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
            >
              <RefreshCcw size={14} color="#A1A1AA" strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            className="flex flex-row overflow-auto max-w-full"
          >
            <DataUIProvider
              data={popularDocuments}
              renderItem={(row) => (
                <RenderDocumentItem item={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingPopular}
              LoadingComponent={() => (
                <View className="flex-row gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    // Cards Skeletons en rounded-2xl
                    <Skeleton
                      key={idx}
                      className="w-[140px] h-[160px] rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]"
                    />
                  ))}
                </View>
              )}
              isError={isErrorPopular}
              ErrorComponent={() => (
                <View className="py-4 w-full">
                  <Text className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    Erreur de synchronisation
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="py-4 w-full">
                  <Text className="text-xs font-bold text-zinc-400">
                    Aucun document populaire actuellement.
                  </Text>
                </View>
              )}
            />
          </ScrollView>

          {/* SECTION : RECOMMANDATIONS */}
          <View className="flex-row justify-between items-center border-b-2 border-zinc-100 pb-3 mt-6 mb-4 dark:border-[#1A1A1A]">
            <View className="flex-row items-center gap-3">
              <View className="h-2 w-2 bg-orange-500 rounded-full" />
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Sélection pour vous
              </Text>
            </View>
            <Pressable
              onPress={() => refetchRecommended()}
              className="h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
            >
              <RefreshCcw size={14} color="#A1A1AA" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View className="gap-y-3">
            <DataUIProvider
              data={recommendedDocuments}
              renderItem={(row) => (
                <ExplorerFileRow document={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingRecommended}
              LoadingComponent={() => (
                <View className="gap-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    // List Skeletons en rounded-2xl
                    <Skeleton
                      key={idx}
                      className="w-full h-16 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]"
                    />
                  ))}
                </View>
              )}
              isError={isErrorRecommended}
              ErrorComponent={() => (
                <View className="items-center justify-center py-6">
                  <Text className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    Impossible de charger les suggestions
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                // EMPTY STATE (Card en rounded-2xl)
                <View className="items-center justify-center py-10 px-6 border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] rounded-2xl bg-zinc-50 dark:bg-[#0A0A0A]">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                    <FolderOpen size={24} color={ORANGE_PRINCIPAL} strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-widest text-center">
                    Répertoire vide
                  </Text>
                  <Text className="mt-2 text-center text-xs font-bold text-zinc-400">
                    Ajoutez vos propres cours pour recevoir des suggestions personnalisées.
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}