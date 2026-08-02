import { useInitLibrary } from "@/entities/document/hooks/use-library";
import { ExplorerFileRow, RenderDocumentItem } from "@/features/library/components/explorer-file-row";
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

const ORANGE_PRINCIPAL = '#FF6B00';

export default function LibraryScreen() {
  const {
    isLoadingPopular,
    isLoadingRecommended,

    isErrorPopular,
    isErrorRecommended,

    recommendedDocuments,
    popularDocuments,

    refetchPopular,
    refetchRecommended
  } = useInitLibrary()

  const openDocument = useCallback(
    (id: string) => {
      router.push({ pathname: '/library/document/[id]', params: { id } } as never);
    },
    [router],
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-950"
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* En-tête de la page */}
        <View className="border-b border-zinc-100 bg-white px-5 pb-4 pt-4 dark:border-zinc-900 dark:bg-zinc-950">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                Bibliothèque
              </Text>

              {/* Indicateur technique de filière avec repère orange */}
              <View className="flex-row items-center gap-1.5 mt-1">
                <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <Text className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                  Filière · Niveau · UE
                </Text>
              </View>
            </View>

            {/* Barre d'outils et d'actions rapides (carrés aux angles nets) */}
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

        <View className="px-5 pt-5">
          {/* Panneau de bienvenue technique et minimaliste (remplace la photo) */}
          <View className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-900 dark:bg-zinc-900/30">
            <Text className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Espace de Connaissances Partagé
            </Text>
            <Text className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Consultez les fichiers de votre promotion ou importez de nouvelles ressources d'étude pour Hiro.
            </Text>
          </View>

          {/* Bouton principal - Focus Orange Électrique */}
          <Button
            label="Explorer la bibliothèque"
            leftIcon={<BookOpen size={16} color="#fff" />}
            onPress={() => router.push("/library/library")}
            className="mt-4 mb-8 rounded-xl h-12 bg-orange-500 dark:bg-orange-600 active:opacity-90"
          />

          {/* SECTION : Les plus téléchargés */}
          <View className="flex-row justify-between items-center border-b border-zinc-100 pb-2 dark:border-zinc-900">
            <View className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Les plus téléchargés
              </Text>
            </View>
            <Pressable
              onPress={() => refetchPopular()}
              className="h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
            >
              <RefreshCcw size={12} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
            className="flex flex-row overflow-auto max-w-full"
          >
            <DataUIProvider
              data={popularDocuments}
              renderItem={(row) => (
                <RenderDocumentItem item={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingPopular}
              LoadingComponent={() => (
                <View className="flex-row gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="w-[140px] h-[160px] rounded-xl bg-zinc-100 dark:bg-zinc-900"
                    />
                  ))}
                </View>
              )}
              isError={isErrorPopular}
              ErrorComponent={() => (
                <View className="py-4 w-full">
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    Erreur de synchronisation
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="py-4 w-full">
                  <Text className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Aucun document populaire actuellement.
                  </Text>
                </View>
              )}
            />
          </ScrollView>

          {/* SECTION : Recommandations */}
          <View className="flex-row justify-between items-center border-b border-zinc-100 pb-2 mt-4 dark:border-zinc-900">
            <View className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Sélection pour vous
              </Text>
            </View>
            <Pressable
              onPress={() => refetchRecommended()}
              className="h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
            >
              <RefreshCcw size={12} color="#A1A1AA" />
            </Pressable>
          </View>

          <View className="py-4 gap-2.5">
            <DataUIProvider
              data={recommendedDocuments}
              renderItem={(row) => (
                <ExplorerFileRow document={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingRecommended}
              LoadingComponent={() => (
                <View className="gap-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="w-full h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900"
                    />
                  ))}
                </View>
              )}
              isError={isErrorRecommended}
              ErrorComponent={() => (
                <View className="items-center justify-center py-6">
                  <Text className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Impossible de charger les suggestions de lecture.
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                  <View className="h-10 w-10 items-center justify-center rounded-lg border border-zinc-100 bg-white dark:border-zinc-900 mb-3">
                    <FolderOpen size={16} color={ORANGE_PRINCIPAL} />
                  </View>
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                    Répertoire vide
                  </Text>
                  <Text className="mt-1 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500 max-w-[200px]">
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