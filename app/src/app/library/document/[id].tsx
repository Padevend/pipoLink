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
import { BRAND } from '@/shared/config/brand';
import { formatBytes } from '@/shared/lib/file';
import { getStaticUri } from '@/shared/lib/static';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data: doc, isLoading} = useDocument(id ?? '');

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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'bottom']}>
      
      {/* HEADER: Épuré & Transparent */}
      <View className="z-10 flex-row items-center border-b border-border-light/40 bg-surface-light/75 px-4 py-3 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>
        <Text className="ml-3 text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Ressource Académique
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-5 p-5">
          <View className="items-center gap-3 my-4">
            <Skeleton className="h-16 w-16 rounded-2xl opacity-70" />
            <Skeleton className="h-6 w-3/4 rounded-lg opacity-70" />
            <Skeleton className="h-4 w-1/4 rounded-md opacity-70" />
          </View>
          <Skeleton className="h-[120px] w-full rounded-2xl opacity-70" />
          <Skeleton className="h-[180px] w-full rounded-2xl opacity-70" />
        </View>
      ) : !doc ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-text-secondary-light/5 border border-border-light/10 mb-3">
            <FileText size={22} color={BRAND.primary} />
          </View>
          <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark text-center">
            Document introuvable ou archivé.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* HERO BLOCK: Présentation Focus du Document */}
            <View className="items-center text-center mb-6">
              <View 
                className="h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 mb-4"
                style={{ backgroundColor: `${BRAND.primary}12` }}
              >
                <FileText size={32} color={BRAND.primary} />
              </View>
              
              <Text className="text-[20px] font-bold tracking-tight text-center text-text-primary-light dark:text-text-primary-dark px-2">
                {doc.fileName}
              </Text>

              {/* Métadonnées directes sous forme de capsules horizontales */}
              <View className="flex-row items-center gap-2 mt-3 flex-wrap justify-center">
                <View className="rounded-md border border-primary/20 px-2 py-0.5 bg-primary/5">
                  <Text className="text-[10px] font-bold tracking-wide uppercase" style={{ color: BRAND.primary }}>
                    {doc.type || 'DOC'}
                  </Text>
                </View>
                <View className="rounded-md border border-border-light/60 bg-surface-light px-2 py-0.5 dark:border-border-dark/30 dark:bg-surface-dark">
                  <Text className="text-[10px] font-semibold text-text-secondary-light/70 dark:text-text-secondary-dark/70">
                    {formatBytes(doc.fileSize)}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION: Description de l'auteur */}
            {doc.description && (
              <View className="mb-5 rounded-2xl border border-border-light/30 bg-surface-light/30 p-4 dark:border-border-dark/10 dark:bg-surface-dark/20 backdrop-blur-md">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Info size={13} color="#64748B" />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                    Note de l'auteur
                  </Text>
                </View>
                <Text className="text-[13.5px] leading-[20px] text-text-primary-light/80 dark:text-text-primary-dark/80">
                  {doc.description}
                </Text>
              </View>
            )}

            {/* GRID/CARDS SYSTEM: Nouvelle disposition non-linéaire */}
            <View className="gap-3">
              
              {/* Carte Contextuelle : UE / Filière / Niveau */}
              {(doc.filiere || doc.ue) && (
                <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md flex-row items-center gap-3.5">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/10 dark:bg-blue-500/15">
                    <Layers size={16} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/50">
                      Classification & Cours
                    </Text>
                    <Text className="text-[14px] font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5" numberOfLines={1}>
                      {doc.ue ? doc.ue.toUpperCase() : 'Général'} {doc.filiere ? `· ${doc.filiere}` : ''}
                    </Text>
                    {doc.niveau && (
                      <Text className="text-[11px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-0.5">
                        Niveau ciblé : {doc.niveau}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Carte Profil de l'Uploader */}
              <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md flex-row items-center gap-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/10 dark:bg-purple-500/15">
                  <User size={16} color="#64748B" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/50">
                    Contributeur
                  </Text>
                  <Text className="text-[14px] font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                    {doc.uploadedBy.displayName}
                  </Text>
                  <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                    Communauté étudiante
                  </Text>
                </View>
              </View>

              {/* Carte Statistiques et Date (Agencée en ligne partagée) */}
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl border border-border-light/40 bg-surface-light/50 p-3.5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
                  <Calendar size={15} color="#64748B"/>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/50">
                    Publié le
                  </Text>
                  <Text className="text-[12px] font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                    {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                  </Text>
                </View>

                <View className="flex-1 rounded-2xl border border-border-light/40 bg-surface-light/50 p-3.5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
                  <DownloadCloud size={15} color="#64748B"  />
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/50">
                    Consultations
                  </Text>
                  <Text className="text-[12px] font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                    {doc.downloadCount} fois
                  </Text>
                </View>
              </View>

            </View>
          </ScrollView>

          {/* ZONE ACTIONS FIXE: Bouton ancré en bas style Floating Panel */}
          <View className="absolute bottom-0 left-0 right-0 p-5 border-t border-border-light/20 bg-background-light/80 dark:border-border-dark/10 dark:bg-background-dark/80 backdrop-blur-lg">
            <Button
              label={downloading ? 'Ouverture de la ressource...' : 'Télécharger le document'}
              leftIcon={
                downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Download size={16} color="#FFFFFF" />
                )
              }
              onPress={() => void handleDownload()}
              disabled={downloading}
              className="rounded-xl h-12 active:scale-[0.99] transition-transform"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}