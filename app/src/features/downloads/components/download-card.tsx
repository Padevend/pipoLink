import { downloadTask } from "@/shared/api/types";
import { formatBytes } from "@/shared/lib/file";
import { openLocalFile } from "@/shared/lib/open-local-file";
import { CheckCircle2, ExternalLink, Pause, Play, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { downloadManager } from "../services/download.manager";

export function DownloadCard({ task, onDelete }: { task: downloadTask, onDelete?: (id: string) => void }) {
  const progressPercent = Math.floor(task.progress * 100);
  const isCompleted = task.status === "completed";
  const isDownloading = task.status === "downloading";
  const isPaused = task.status === "paused";

  return (
    <View className="w-full rounded-2xl bg-zinc-100 p-5 dark:bg-[#1A1A1A]">
      
      {/* INFOS PRINCIPALES : TITRE & ACTION RAPIDE */}
      <View className="flex-row items-start justify-between gap-4 mb-4">
        <View className="flex-1 justify-center">
          <Text 
            className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {task.filename}
          </Text>
          
          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1.5">
            {formatBytes(task.writtenBytes)} / {task.totalBytes > 0 ? formatBytes(task.totalBytes) : "Inconnu"}
          </Text>
        </View>

        {/* Badge d'état (Arrondi complet) */}
        <View className="items-end pt-1">
          {isCompleted ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-green-500 px-3 py-1">
              <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={3} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                Prêt
              </Text>
            </View>
          ) : (
            <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                {progressPercent}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* BARRE DE PROGRESSION */}
      {!isCompleted && (
        <View className="h-1.5 w-full bg-zinc-200 dark:bg-[#222222] rounded-full overflow-hidden mb-4">
          <View 
            className="h-full rounded-full" 
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isPaused ? '#A1A1AA' : '#F97316' 
            }} 
          />
        </View>
      )}

      {/* COMMANDES D'ACTION ACTIONNABLES (Boutons pleins, rounded-full) */}
      <View className="flex-row items-center justify-between mt-1">
        
        <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {task.status}
        </Text>

        <View className="flex-row items-center gap-2">
          {isDownloading && (
            <Pressable
              onPress={() => downloadManager.pause(task.id)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222] active:opacity-80"
            >
              <Pause size={16} color="#71717A" strokeWidth={2.5} />
            </Pressable>
          )}

          {isPaused && (
            <Pressable
              onPress={() => downloadManager.resume(task.id)}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222] active:opacity-80"
            >
              <Play size={16} color="#F97316" strokeWidth={2.5} />
            </Pressable>
          )}

          {isCompleted && (
            <Pressable
              onPress={() => openLocalFile(task.local_uri, task.mimeType)}
              hitSlop={10}
              className="h-10 px-4 flex-row items-center gap-2 rounded-full bg-white dark:bg-[#222222] active:opacity-80"
            >
              <ExternalLink size={16} color="#71717A" strokeWidth={2.5} />
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                Ouvrir
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              onDelete ? onDelete(task.id) : downloadManager.cancel(task.id)
            }}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
          >
            <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
      
    </View>
  );
}