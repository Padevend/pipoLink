import { useSafeArea } from '@/shared/hooks/use-safe-area';
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

import { useDocument } from '@/entities/document/hooks';
import { downloadManager } from '@/features/downloads/services/download.manager';
import { useToast } from '@/providers';
import { displayFileName } from '@/shared/lib/display-file-name';
import { formatBytes } from '@/shared/lib/file';
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
      url: getStaticUri(doc.id),
      documentId: doc.id,
    });
    
    showToast({ type: 'success', message: 'Téléchargement lancé !' });
    setDownloading(false);    
  }, [doc?.id, showToast]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>
      
      {/* HEADER : Style Néo-banque Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A] z-10">
        <Pressable 
          onPress={() => router.back()} 
          hitSlop={10}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <View className="ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Ressource
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Visionneuse
          </Text>
        </View>
      </View>

      <View className="flex-1 bg-white dark:bg-[#0A0A0A]">
        {isLoading ? (
          <View className="flex-1 px-6 pt-8">
            <View className="items-center gap-y-4 my-6">
              <Skeleton className="h-24 w-24 rounded-full bg-zinc-100 dark:bg-[#1A1A1A]" />
              <Skeleton className="h-6 w-3/4 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]" />
              <Skeleton className="h-4 w-1/3 rounded-full bg-zinc-100 dark:bg-[#1A1A1A]" />
            </View>
            <Skeleton className="h-32 w-full rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] mb-4" />
            <View className="flex-row gap-4">
              <Skeleton className="h-28 flex-1 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]" />
              <Skeleton className="h-28 flex-1 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]" />
            </View>
          </View>
        ) : !doc ? (
          <View className="flex-1 items-center justify-center p-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-6">
              <FileText size={32} color="#F97316" strokeWidth={2.5} />
            </View>
            <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-3 text-center">
              Document indisponible
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center max-w-[260px] leading-relaxed">
              Cette ressource est introuvable ou a été archivée par son propriétaire.
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <ScrollView 
              className="flex-1" 
              contentContainerStyle={{ 
                paddingHorizontal: 24, 
                paddingTop: 32, 
                paddingBottom: Math.max(insets.bottom, 24) + 120 
              }}
              showsVerticalScrollIndicator={false}
            >
              
              {/* HERO BLOCK */}
              <View className="items-center mb-10">
                <View className="h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-6">
                  <FileText size={36} color="#F97316" strokeWidth={2.5} />
                </View>
                
                <Text className="text-2xl font-black tracking-tight text-center text-zinc-950 dark:text-white px-2 leading-tight">
                  {displayFileName(doc.fileName)}
                </Text>

                {/* Badges Techniques (rounded-full) */}
                <View className="flex-row items-center gap-3 mt-6 flex-wrap justify-center">
                  <View className="rounded-full bg-orange-500 px-4 py-2">
                    <Text className="text-[11px] font-black tracking-widest text-white uppercase">
                      {doc.type || 'DOC'}
                    </Text>
                  </View>
                  <View className="rounded-full bg-zinc-100 dark:bg-[#1A1A1A] px-4 py-2">
                    <Text className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                      {formatBytes(doc.fileSize)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* CONTENU & MÉTADONNÉES */}
              <View className="gap-y-6">
                
                {/* Note de l'auteur */}
                {doc.description && (
                  <View className="rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-6 border-l-4 border-orange-500">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Info size={18} color="#F97316" strokeWidth={2.5} />
                      <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Note de l'auteur
                      </Text>
                    </View>
                    <Text className="text-sm font-bold leading-relaxed text-zinc-950 dark:text-white">
                      {doc.description}
                    </Text>
                  </View>
                )}

                {/* Carte Principale : Classification & Contributeur (rounded-2xl) */}
                <View className="rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] overflow-hidden p-2">
                  
                  {(doc.filiere || doc.ue) && (
                    <View className="flex-row items-center p-4">
                      <View className="h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-[#222222]">
                        <Layers size={20} color="#F97316" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1 justify-center ml-4">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Classification
                        </Text>
                        <Text className="text-sm font-bold text-zinc-950 dark:text-white mt-1" numberOfLines={1}>
                          {doc.ue ? doc.ue.toUpperCase() : 'Général'} {doc.filiere ? `· ${doc.filiere}` : ''}
                        </Text>
                        {doc.niveau && (
                          <Text className="text-xs font-bold text-zinc-400 mt-1">
                            Niveau : {doc.niveau}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {(doc.filiere || doc.ue) && (
                    <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />
                  )}

                  <View className="flex-row items-center p-4">
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-[#222222]">
                      <User size={20} color="#F97316" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1 justify-center ml-4">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Mis en ligne par
                      </Text>
                      <Text className="text-sm font-bold text-zinc-950 dark:text-white mt-1">
                        {doc.uploadedBy.displayName}
                      </Text>
                    </View>
                  </View>

                </View>

                {/* Grille Statistiques Temporelles (2x2) */}
                <View className="flex-row gap-4">
                  <View className="flex-1 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-5">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#222222] mb-4">
                      <Calendar size={18} color="#F97316" strokeWidth={2.5} />
                    </View>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Publication
                    </Text>
                    <Text className="text-sm font-bold text-zinc-950 dark:text-white mt-2">
                      {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                    </Text>
                  </View>

                  <View className="flex-1 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-5">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#222222] mb-4">
                      <DownloadCloud size={18} color="#F97316" strokeWidth={2.5} />
                    </View>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Consultations
                    </Text>
                    <Text className="text-sm font-bold text-zinc-950 dark:text-white mt-2">
                      {doc.downloadCount} fois
                    </Text>
                  </View>
                </View>

              </View>
            </ScrollView>

            {/* BOTTOM BAR : Bouton d'action fixe 100% Plat */}
            <View 
              className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-white dark:bg-[#0A0A0A] border-t-2 border-zinc-100 dark:border-[#1A1A1A]"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <Button
                label={downloading ? 'Téléchargement en cours...' : 'Télécharger la ressource'}
                leftIcon={
                  downloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={18} color="#FFFFFF" strokeWidth={3} />
                  )
                }
                onPress={() => void handleDownload()}
                disabled={downloading}
                size="lg"
                className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}