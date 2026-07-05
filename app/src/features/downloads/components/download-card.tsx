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
    <View className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40">
      
      {/* INFOS PRINCIPALES : TITRE & ACTION RAPIDE */}
      <View className="flex-row items-start justify-between gap-x-3 mb-2.5">
        <View className="flex-1">
          <Text 
            className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {task.filename}
          </Text>
          
          {/* Métadonnées de poids / Statut de progression */}
          <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
            {formatBytes(task.writtenBytes)} / {task.totalBytes > 0 ? formatBytes(task.totalBytes) : "Taille inconnue"}
          </Text>
        </View>

        {/* Indicateur ou Pourcentage à droite */}
        <View className="items-end">
          {isCompleted ? (
            <View className="flex-row items-center gap-x-1 px-1.5 py-0.5 rounded">
              <CheckCircle2 size={10} color="#22C55E" />
              <Text className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Prêt</Text>
            </View>
          ) : (
            <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {progressPercent}%
            </Text>
          )}
        </View>
      </View>

      {/* BARRE DE PROGRESSION (MASQUÉE SI TERMINÉ) */}
      {!isCompleted && (
        <View className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
          <View 
            className="h-full rounded-full" 
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isPaused ? '#71717A' : '#F97316' 
            }} 
          />
        </View>
      )}

      {/* COMMANDES D'ACTION ACTIONNABLES */}
      <View className="flex-row items-center justify-between mt-0.5">
        
        {/* Label de statut stylisé */}
        <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {task.status}
        </Text>

        <View className="flex-row items-center gap-x-2">
          {/* Bouton Pause */}
          {isDownloading && (
            <Pressable
              onPress={() => downloadManager.pause(task.id)}
              hitSlop={6}
              className="h-8 px-2.5 flex-row items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Pause size={13} color="#71717A" />
            </Pressable>
          )}

          {/* Bouton Reprise */}
          {isPaused && (
            <Pressable
              onPress={() => downloadManager.resume(task.id)}
              hitSlop={6}
              className="h-8 px-2.5 flex-row items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Play size={13} color="#F97316" />
            </Pressable>
          )}

          {/* Bouton Ouvrir le fichier */}
          {isCompleted && (
            <Pressable
              onPress={() => openLocalFile(task.local_uri, task.mimeType)}
              hitSlop={6}
              className="h-8 px-3 flex-row items-center gap-x-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <ExternalLink size={12} color="#71717A" />
              <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Ouvrir</Text>
            </Pressable>
          )}

          {/* Bouton Supprimer / Annuler */}
          <Pressable
            onPress={() => {
              onDelete ? onDelete(task.id) : downloadManager.cancel(task.id)
            }}
            hitSlop={6}
            className="h-8 px-2.5 flex-row items-center justify-center rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 active:bg-red-100 dark:active:bg-red-950/40"
          >
            <Trash2 size={13} color="#EF4444" />
          </Pressable>
        </View>

      </View>
    </View>
  );
}