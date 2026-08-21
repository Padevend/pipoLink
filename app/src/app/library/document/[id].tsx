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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* ========================================= */}
      {/* HEADER : Blanc pur, minimaliste et solide   */}
      {/* ========================================= */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-900/80 dark:bg-zinc-950 z-10">
        <Pressable 
          onPress={() => router.back()} 
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} color="#52525B" />
        </Pressable>
        <View className="ml-4">
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">
            Visionneuse
          </Text>
          <Text className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Ressource Académique
          </Text>
        </View>
      </View>

      {/* ========================================= */}
      {/* BODY : Fond gris clair pour détacher le contenu */}
      {/* ========================================= */}
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950/50">
        {isLoading ? (
          <View className="flex-1 p-6">
            <View className="items-center gap-4 my-6">
              <Skeleton className="h-20 w-20 rounded-[24px]" />
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-1/3 rounded-full" />
            </View>
            <Skeleton className="h-28 w-full rounded-[20px] mb-4" />
            <View className="flex-row gap-4">
              <Skeleton className="h-24 flex-1 rounded-[20px]" />
              <Skeleton className="h-24 flex-1 rounded-[20px]" />
            </View>
          </View>
        ) : !doc ? (
          <View className="flex-1 items-center justify-center p-8">
            <View className="h-16 w-16 items-center justify-center rounded-[24px] bg-white border border-zinc-200 shadow-sm shadow-zinc-200/50 dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none mb-4">
              <FileText size={24} color="#F97316" />
            </View>
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Document indisponible
            </Text>
            <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center max-w-[260px]">
              Cette ressource est introuvable ou a été archivée par son propriétaire.
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView 
              className="flex-1" 
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: Math.max(insets.bottom, 16) + 100 }}
              showsVerticalScrollIndicator={false}
            >
              
              {/* HERO BLOCK : Présentation visuelle forte */}
              <View className="items-center mb-8">
                <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none mb-5">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10">
                    <FileText size={26} color="#F97316" strokeWidth={1.5} />
                  </View>
                </View>
                
                <Text className="text-2xl font-black tracking-tight text-center text-zinc-900 dark:text-zinc-50 px-2 leading-tight">
                  {displayFileName(doc.fileName)}
                </Text>

                {/* Badges Techniques */}
                <View className="flex-row items-center gap-2 mt-4 flex-wrap justify-center">
                  <View className="rounded-lg bg-orange-500 px-2.5 py-1 shadow-sm shadow-orange-500/20">
                    <Text className="text-[10px] font-black tracking-widest text-white uppercase">
                      {doc.type || 'DOC'}
                    </Text>
                  </View>
                  <View className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 shadow-sm shadow-zinc-200/30 dark:bg-zinc-900 dark:border-zinc-800">
                    <Text className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                      {formatBytes(doc.fileSize)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* CONTENU & MÉTADONNÉES */}
              <View className="gap-3">
                
                {/* Note de l'auteur (Si présente) */}
                {doc.description && (
                  <View className="rounded-[20px] border border-orange-200/60 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-950/20">
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <Info size={14} color="#F97316" />
                      <Text className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-500">
                        Note de l'auteur
                      </Text>
                    </View>
                    <Text className="text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-300">
                      {doc.description}
                    </Text>
                  </View>
                )}

                {/* Carte Principal : Classification & Contributeur */}
                <View className="rounded-[20px] border border-zinc-200/60 bg-white p-4 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none gap-4">
                  
                  {(doc.filiere || doc.ue) && (
                    <View className="flex-row items-center gap-3.5">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800">
                        <Layers size={16} color="#71717A" />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Classification & Cours
                        </Text>
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-0.5" numberOfLines={1}>
                          {doc.ue ? doc.ue.toUpperCase() : 'Général'} {doc.filiere ? `· ${doc.filiere}` : ''}
                        </Text>
                        {doc.niveau && (
                          <Text className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Niveau : {doc.niveau}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {(doc.filiere || doc.ue) && (
                    <View className="h-px w-full bg-zinc-100 dark:bg-zinc-800/60 ml-12" />
                  )}

                  <View className="flex-row items-center gap-3.5">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800">
                      <User size={16} color="#71717A" />
                    </View>
                    <View className="flex-1 justify-center">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Mis en ligne par
                      </Text>
                      <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                        {doc.uploadedBy.displayName}
                      </Text>
                    </View>
                  </View>

                </View>

                {/* Grille Statistiques Temporelles (2x2) */}
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-[20px] border border-zinc-200/60 bg-white p-4 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 mb-2 dark:bg-zinc-950">
                      <Calendar size={14} color="#71717A" />
                    </View>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Publication
                    </Text>
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-[20px] border border-zinc-200/60 bg-white p-4 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 mb-2 dark:bg-zinc-950">
                      <DownloadCloud size={14} color="#71717A" />
                    </View>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Consultations
                    </Text>
                    <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {doc.downloadCount} fois
                    </Text>
                  </View>
                </View>

              </View>
            </ScrollView>

            {/* ========================================= */}
            {/* BOTTOM BAR : Bouton d'action flottant     */}
            {/* ========================================= */}
            <View 
              className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/90 border-t border-zinc-200/60 dark:bg-zinc-950/90 dark:border-zinc-900/80 backdrop-blur-xl"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                label={downloading ? 'Téléchargement en cours...' : 'Télécharger la ressource'}
                leftIcon={
                  downloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={18} color="#FFFFFF" strokeWidth={2.5} />
                  )
                }
                onPress={() => void handleDownload()}
                disabled={downloading}
                className="rounded-2xl h-14 bg-orange-500 shadow-lg shadow-orange-500/25 active:bg-orange-600 active:scale-[0.98] transition-all"
                
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}