import { router } from 'expo-router';
import { ArrowLeft, BrushCleaning, HardDriveDownload, RefreshCw } from "lucide-react-native";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DownloadCard } from "@/features/downloads/components/download-card";
import { useDownloadHistory } from "@/features/downloads/hooks/use-download-history";

export default function DownloadHistoryScreen() {
  const { history, clearHistory, refresh, isRefreshing, deleteItem } = useDownloadHistory();

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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* HEADER : Panneau Mat Fixe */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center flex-1 gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={16} color="#71717A" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Téléchargements
            </Text>
            <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              Historique des fichiers
            </Text>
          </View>
        </View>

        {/* Bouton Rafraîchir */}
        <Pressable
          onPress={refresh}
          hitSlop={8}
          disabled={isRefreshing}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 me-2"
        >
          <RefreshCw size={14} color="#71717A" />
        </Pressable>

        {/* Bouton de nettoyage contextuel rouge mat */}
        {history && history.length > 0 && (
          <Pressable
            onPress={handleClearHistory}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 active:bg-red-100 dark:active:bg-red-950/40"
          >
            <BrushCleaning size={14} color="#EF4444" />
          </Pressable>
        )}
        
      </View>

      {/* LISTE DES TÉLÉCHARGEMENTS */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        renderItem={({ item }) => (
          <View className="mb-2.5">
            <DownloadCard task={item} onDelete={deleteItem} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-32 px-6">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 mb-3">
              <HardDriveDownload size={18} color="#A1A1AA" />
            </View>
            <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50 text-center">
              Aucun téléchargement
            </Text>
            <Text className="text-[11px] font-medium text-center text-zinc-500 dark:text-zinc-400 mt-1 leading-4">
              Les documents ou fichiers HD d'annonces téléchargés s'afficheront ici.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}