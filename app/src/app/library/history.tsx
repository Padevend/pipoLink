import { router } from 'expo-router';
import { ArrowLeft, Brush, HardDriveDownload, RefreshCw } from "lucide-react-native";
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

      {/* HEADER : Néo-banque, plat, sans bordures sur les boutons */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center flex-1 gap-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>

          <View className="flex-1 justify-center">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
              Téléchargements
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">
              Historique local
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Bouton Rafraîchir */}
          <Pressable
            onPress={refresh}
            hitSlop={10}
            disabled={isRefreshing}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
          >
            <RefreshCw size={16} color="#A1A1AA" strokeWidth={2.5} />
          </Pressable>

          {/* Bouton de nettoyage contextuel */}
          {history && history.length > 0 && (
            <Pressable
              onPress={handleClearHistory}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
            >
              <Brush size={16} color="#EF4444" strokeWidth={2.5} />
            </Pressable>
          )}
        </View>
      </View>

      {/* LISTE DES TÉLÉCHARGEMENTS */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        renderItem={({ item }) => (
          <View className="mb-3">
            <DownloadCard task={item} onDelete={deleteItem} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-24 px-6 mt-10 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A]">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-5">
              <HardDriveDownload size={24} color="#A1A1AA" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
              Aucun téléchargement
            </Text>
            <Text className="text-xs font-bold text-center text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed px-4">
              Les documents ou fichiers HD d'annonces téléchargés s'afficheront ici.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}