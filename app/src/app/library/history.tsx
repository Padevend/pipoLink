import { router } from 'expo-router';
import { ArrowLeft, BrushCleaning, HardDriveDownload } from "lucide-react-native";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DownloadCard } from "@/features/downloads/components/download-card";
import { useDownloadHistory } from "@/features/downloads/hooks/use-download-history";

export default function DownloadHistoryScreen() {
  const { history, clearHistory } = useDownloadHistory();

  const handleClearHistory = () => {
    if (!history || history.length === 0) return;

    Alert.alert(
      "Nettoyer l'historique",
      "Voulez-vous vraiment effacer tout votre historique de téléchargement ? Les fichiers locaux ne seront pas supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: () => clearHistory()
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

      {/* HEADER PANEL SATINÉ */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/40 bg-surface-light/75 px-4 py-3 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <View className="flex-row items-center flex-1 gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-xl bg-background-light/40 dark:bg-background-dark/30 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} color="#64748B" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Téléchargements
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/40 mt-0.5">
              Historique des fichiers
            </Text>
          </View>
        </View>

        {/* Bouton de nettoyage contextuel */}
        {history && history.length > 0 && (
          <Pressable
            onPress={handleClearHistory}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform"
          >
            <BrushCleaning size={16} color={"red"} strokeWidth={2} />
          </Pressable>
        )}
        <Pressable
          onPress={handleClearHistory}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform"
        >
          <BrushCleaning size={16} color={"red"} strokeWidth={2} />
        </Pressable>
        
      </View>

      {/* LISTE DES TÉLÉCHARGEMENTS */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        renderItem={({ item }) => (
          <View className="mb-3">
            <DownloadCard task={item} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-40 gap-y-3 px-8">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-text-secondary-light/5 border border-border-light/10 dark:border-border-dark/10">
              <HardDriveDownload size={20} className="text-text-secondary-light/40 dark:text-text-secondary-dark/40" strokeWidth={1.5} />
            </View>
            <Text className="text-[14px] font-bold text-text-primary-light dark:text-text-primary-dark text-center">
              Aucun téléchargement
            </Text>
            <Text className="text-[12px] font-medium text-center text-text-secondary-light/50 dark:text-text-secondary-dark/50 leading-[18px]">
              Les documents ou fichiers HD d'annonces téléchargés s'afficheront ici.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}