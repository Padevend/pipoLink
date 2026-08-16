import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Download,
  DownloadCloud,
  FileText,
  Info,
  Layers,
  User
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeArea } from '@/shared/hooks/use-safe-area';

import { useDocument } from '@/entities/document/hooks';
import { downloadManager } from '@/features/downloads/services/download.manager';
import { useToast } from '@/providers';
import { formatBytes } from '@/shared/lib/file';
import { displayFileName } from '@/shared/lib/display-file-name';
import { getStaticUri } from '@/shared/lib/static';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export default function DocumentDetailScreen() {
  const insets = useSafeArea();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data: doc, isLoading } = useDocument(id ?? '');

  const handleDownload = useCallback(async () => {
    if (!doc?.id) return;
    setDownloading(true);

    await downloadManager.start({
      filename: doc.fileName,
      url: getStaticUri(doc.fileUrl),
      documentId: doc.id,
    });
    
    showToast({ type: 'success', message: 'Téléchargement lancé !' });
    setDownloading(false);    
  }, [doc?.id, showToast]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
      
      {/* HEADER: Mat & Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable 
          onPress={() => router.back()} 
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={16} color="#71717A" />
        </Pressable>
        <Text className="ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ressource Académique
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-4 p-5">
          <View className="items-center gap-3 my-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/4 rounded-md" />
          </View>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </View>
      ) : !doc ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 mb-3">
            <FileText size={18} color="#F97316" />
          </View>
          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">
            Document introuvable ou archivé.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 16) + 80 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* HERO BLOCK: Présentation Focus Mat */}
            <View className="items-center mb-6">
              <View className="h-14 w-14 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/20 mb-3">
                <FileText size={24} color="#F97316" />
              </View>
              
              <Text className="text-lg font-bold tracking-tight text-center text-zinc-900 dark:text-zinc-50 px-2">
                {displayFileName(doc.fileName)}
              </Text>

              {/* Badges Opaques */}
              <View className="flex-row items-center gap-2 mt-2.5 flex-wrap justify-center">
                <View className="rounded bg-orange-500 px-2 py-0.5">
                  <Text className="text-[9px] font-bold tracking-wider text-white uppercase">
                    {doc.type || 'DOC'}
                  </Text>
                </View>
                <View className="rounded bg-zinc-100 border border-zinc-200 px-2 py-0.5 dark:bg-zinc-900 dark:border-zinc-800">
                  <Text className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                    {formatBytes(doc.fileSize)}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION: Note de l'auteur */}
            {doc.description && (
              <View className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <Info size={13} color="#71717A" />
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Note de l'auteur
                  </Text>
                </View>
                <Text className="text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                  {doc.description}
                </Text>
              </View>
            )}

            {/* SYSTÈME DE CARTES NON-LINÉAIRE (Aplats Mats) */}
            <View className="gap-2.5">
              
              {/* Carte Contextuelle : Enseignement */}
              {(doc.filiere || doc.ue) && (
                <View className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40 flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    <Layers size={14} color="#71717A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Classification & Cours
                    </Text>
                    <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mt-0.5" numberOfLines={1}>
                      {doc.ue ? doc.ue.toUpperCase() : 'Général'} {doc.filiere ? `· ${doc.filiere}` : ''}
                    </Text>
                    {doc.niveau && (
                      <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Niveau : {doc.niveau}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Carte Profil du Contributeur */}
              <View className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40 flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                  <User size={14} color="#71717A" />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Contributeur
                  </Text>
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {doc.uploadedBy.displayName}
                  </Text>
                </View>
              </View>

              {/* Double Grille de Statistiques Temporelles */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
                  <Calendar size={13} color="#71717A" />
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
                    Publié le
                  </Text>
                  <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                  </Text>
                </View>

                <View className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
                  <DownloadCloud size={13} color="#71717A" />
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
                    Consultations
                  </Text>
                  <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {doc.downloadCount} fois
                  </Text>
                </View>
              </View>

            </View>
          </ScrollView>

          {/* ZONE D'ACTION FIXE PANNEAU MAT */}
          <View 
            className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Button
              label={downloading ? 'Ouverture de la ressource...' : 'Télécharger le document'}
              leftIcon={
                downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Download size={14} color="#FFFFFF" />
                )
              }
              onPress={() => void handleDownload()}
              disabled={downloading}
              className="rounded-xl h-11 bg-orange-500 active:bg-orange-600"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}