import { useInitLibrary } from "@/entities/document/hooks/use-library";
import { ExplorerFileRow, RenderDocumentItem } from "@/features/library/components/explorer-file-row";
import { BRAND } from "@/shared/config/brand";
import { Button } from "@/shared/ui/button";
import DataUIProvider from "@/shared/ui/data-ui-provider";
import { Skeleton } from "@/shared/ui/skeleton";
import { router } from "expo-router";
import { BookOpen, FolderOpen, Upload, User } from "lucide-react-native";
import { useCallback } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const {
    isLoadingPopular,
    isLoadingRecommended,

    isErrorPopular,
    isErrorRecommended,

    recommendedDocuments,
    popularDocuments,
  } = useInitLibrary()

  const openDocument = useCallback(
    (id: string) => {
      router.push({ pathname: '/library/document/[id]', params: { id } } as never);
    },
    [router],
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background-light dark:bg-background-dark"
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="z-10 border-b border-border-light/20 bg-surface-light/75 px-5 pb-0 pt-4 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Bibliothèque
              </Text>

              <View className="flex-row mt-1">
                <View className="rounded-full bg-text-secondary-light/5 px-2 py-0.5 dark:bg-text-secondary-dark/5 border border-border-light/10 dark:border-border-dark/10">
                  <Text className="text-[10px] font-semibold tracking-wide text-text-secondary-light/80 dark:text-text-secondary-dark/80">
                    Filière · Niveau · UE
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Bouton profil utilisateur */}
              <Pressable
                onPress={() => router.push("/library/my-documents" as never)}
                className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:opacity-80"
              >
                <User size={22} color="#64748B" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/modal/upload-document")}
                className="h-12 w-12 items-center justify-center rounded-full bg-primary  shadow-primary/20 active:opacity-80"
              >
                <Upload size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Banniere de la bibliotheque */}
        <View className="mx-3 my-4">
          <ImageBackground
            source={require("@/assets/images/image01.jpg")}
            className="rounded-2xl min-h-[150px] overflow-hidden"
          >
            <View className="flex-1 justify-end rounded-2xl bg-surface-dark/40 p-5">
              <Text className="text-xl font-semibold text-white">
                Bienvenue dans votre bibliothèque
              </Text>
              <Text className="mt-1 text-md text-white/90">
                Accédez à tous vos documents et dossiers organisés.
              </Text>
            </View>
          </ImageBackground>
          <Button
            label="Ouvrir"
            leftIcon={<BookOpen size={18} color="#fff" />}
            onPress={() => router.push("/library/library")}
            className="my-5 rounded-xl h-13"
          />

          {/* section des plus telecharges */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Les plus telecharges
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-4 gap-5 flex flex-row overflow-auto max-w-full"
          >
            <DataUIProvider
              data={popularDocuments}
              renderItem={(row) => (
                <RenderDocumentItem item={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingPopular}
              LoadingComponent={() => (
                <>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="mx-3 w-[180px] min-h-[160px] rounded-2xl opacity-70"
                    />
                  ))}
                </>
              )}
              isError={isErrorPopular}
              ErrorComponent={() => (
                <View className="items-center justify-center py-4 px-6 max-w-full">
                  <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                    Impossible de charger les recommandations
                  </Text>

                  <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4 flex-wrap">
                    Vérifiez votre connexion ou réessayez plus tard.
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-4 px-6 max-w-full">
                  <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                    Rien à voir ici pour le moment
                  </Text>

                  <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4 flex-wrap">
                    Nous n'avons pas de documents populaires à vous montrer pour le moment. Revenez plus tard !
                  </Text>
                </View>
              )}
            />
          </ScrollView>

          {/* section des recommandations */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Pour vous
          </Text>
          <View className="py-4 gap-5 flex">
            <DataUIProvider
              data={recommendedDocuments}
              renderItem={(row) => (
                <ExplorerFileRow document={row.item} onPress={() => openDocument(row.item.id)} />
              )}
              isLoading={isLoadingRecommended}
              LoadingComponent={() => (
                <>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="w-full min-h-[60px] rounded-2xl opacity-70"
                    />
                  ))}
                </>
              )}
              isError={isErrorRecommended}
              ErrorComponent={() => (
                <View className="items-center justify-center py-4 px-6 max-w-full">
                  <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                    Impossible de charger les recommandations
                  </Text>

                  <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4 flex-wrap">
                    Vérifiez votre connexion ou réessayez plus tard.
                  </Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-20 px-6">
                  {/* Icône enveloppée dans un conteneur Soft Glassmorphism */}
                  <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border-light/40 bg-surface-light/40 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-xl  mb-4">
                    <View className="p-2.5 rounded-xl bg-primary/10">
                      <FolderOpen size={26} color={BRAND.primary} />
                    </View>
                  </View>
                  <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                    Rien à voir ici pour le moment
                  </Text>
                  <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4">
                    Nous n'avons pas de recommandations à vous faire pour le moment. Revenez plus tard !
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
