import { downloadTask } from "@/shared/api/types";
import { BRAND } from "@/shared/config/brand";
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
    <View className="overflow-hidden rounded-xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
      
      {/* INFOS PRINCIPALES : TITRE & ACTION RAPIDE */}
      <View className="flex-row items-start justify-between gap-x-3 mb-2">
        <View className="flex-1">
          <Text 
            className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {task.filename}
          </Text>
          
          {/* Métadonnées de poids / Statut de progression */}
          <Text className="text-[11px] font-medium text-text-secondary-light/40 dark:text-text-secondary-dark/50 mt-0.5">
            {formatBytes(task.writtenBytes)} / {task.totalBytes > 0 ? formatBytes(task.totalBytes) : "Taille inconnue"}
          </Text>
        </View>

        {/* Indicateur ou Pourcentage à droite */}
        <View className="items-end">
          {isCompleted ? (
            <View className="flex-row items-center gap-x-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md">
              <CheckCircle2 size={10} className="text-green-600 dark:text-green-400" strokeWidth={2.5} />
              <Text className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Prêt</Text>
            </View>
          ) : (
            <Text className="text-[13px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {progressPercent}%
            </Text>
          )}
        </View>
      </View>

      {/* BARRE DE PROGRESSION (MASQUÉE SI TERMINÉ) */}
      {!isCompleted && (
        <View className="h-1.5 w-full bg-text-secondary-light/10 dark:bg-text-secondary-dark/10 rounded-full overflow-hidden mb-3.5">
          <View 
            className="h-full rounded-full" 
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isPaused ? '#94A3B8' : BRAND.primary 
            }} 
          />
        </View>
      )}

      {/* LIGNE DE SÉPARATEUR INTERNE (UNIQUEMENT PENDANT L'ACTION) */}
      {!isCompleted && <View className="h-[0.5px] bg-border-light/20 dark:bg-border-dark/10 mb-3" />}

      {/* COMMANDES D'ACTION ACTIONNABLES */}
      <View className="flex-row items-center justify-between">
        
        {/* Label de statut stylisé */}
        <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/30 dark:text-text-secondary-dark/40">
          {task.status}
        </Text>

        <View className="flex-row items-center gap-x-2">
          {/* Bouton Pause */}
          {isDownloading && (
            <Pressable
              onPress={() => downloadManager.pause(task.id)}
              hitSlop={6}
              className="h-8 px-3 flex-row items-center justify-center rounded-lg border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-95 transition-transform"
            >
              <Pause size={13} color="#64748B" strokeWidth={2.5} />
            </Pressable>
          )}

          {/* Bouton Reprise */}
          {isPaused && (
            <Pressable
              onPress={() => downloadManager.resume(task.id)}
              hitSlop={6}
              className="h-8 px-3 flex-row items-center justify-center rounded-lg border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-95 transition-transform"
            >
              <Play size={13} color={BRAND.primary} strokeWidth={2.5} />
            </Pressable>
          )}

          {/* Bouton Ouvrir le fichier */}
          {isCompleted && (
            <Pressable
              onPress={() => openLocalFile(task.local_uri, task.mimeType)}
              hitSlop={6}
              className="h-8 px-3 flex-row items-center gap-x-1.5 rounded-lg border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-95 transition-transform"
            >
              <ExternalLink size={12} color="#64748B" strokeWidth={2} />
              <Text className="text-[11px] font-bold text-text-secondary-light/70 dark:text-text-secondary-dark/70">Ouvrir</Text>
            </Pressable>
          )}

          {/* Bouton Supprimer / Annuler */}
          <Pressable
            onPress={() => {
              onDelete ? onDelete(task.id) : downloadManager.cancel(task.id)
            }}
            hitSlop={6}
            className="h-8 px-3 flex-row items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform"
          >
            <Trash2 size={13} color="red" strokeWidth={2} />
          </Pressable>
        </View>

      </View>
    </View>
  );
}