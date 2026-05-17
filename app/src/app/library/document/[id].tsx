import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  Download,
  FileText,
  HardDrive,
  User,
} from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocument } from '@/entities/document/hooks';
import { openDocumentDownload } from '@/features/library/lib/download-document';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatBytes } from '@/shared/lib/file';
import { useToast } from '@/shared/hooks/use-toast';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="mb-4 flex-row items-start gap-3">
      <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </Text>
        <Text className="mt-0.5 text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data: doc, isLoading, refetch } = useDocument(id ?? '');

  const handleDownload = useCallback(async () => {
    if (!doc?.id) return;
    setDownloading(true);
    try {
      await openDocumentDownload(doc.id);
      void refetch();
    } catch (e) {
      showToast({
        type:    'error',
        message: e instanceof Error ? e.message : 'Échec du téléchargement.',
      });
    } finally {
      setDownloading(false);
    }
  }, [doc?.id, refetch, showToast]);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center border-b border-border-light px-2 dark:border-border-dark">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 pr-4 text-lg font-black text-text-primary-light dark:text-text-primary-dark"
        >
          Détail du document
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-4 p-5">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </View>
      ) : !doc ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-text-secondary-light dark:text-text-secondary-dark">
            Document introuvable.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="mb-6 flex-row items-start gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileText size={32} color="#FF7A00" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
                {doc.title}
              </Text>
              {doc.ue ? (
                <Text className="mt-1 text-sm font-medium text-primary">{doc.ue}</Text>
              ) : null}
              <View className="mt-2 self-start rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {doc.type}
                </Text>
              </View>
            </View>
          </View>

          {doc.description ? (
            <Text className="mb-6 text-[15px] leading-6 text-text-primary-light dark:text-text-primary-dark">
              {doc.description}
            </Text>
          ) : null}

          <View className="mb-8 rounded-3xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
            <InfoRow
              icon={<HardDrive size={18} color="#64748B" />}
              label="Taille"
              value={formatBytes(doc.fileSize)}
            />
            <InfoRow
              icon={<Calendar size={18} color="#64748B" />}
              label="Date de publication"
              value={format(new Date(doc.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            />
            <InfoRow
              icon={<Download size={18} color="#64748B" />}
              label="Téléchargements"
              value={String(doc.downloadCount)}
            />
            <InfoRow
              icon={<User size={18} color="#64748B" />}
              label="Publié par"
              value={doc.uploadedBy.displayName}
            />
            {doc.filiere && doc.niveau ? (
              <InfoRow
                icon={<FileText size={18} color="#64748B" />}
                label="Parcours"
                value={`${doc.filiere} · ${doc.niveau}`}
              />
            ) : null}
          </View>

          <Button
            label={downloading ? 'Ouverture…' : 'Télécharger'}
            leftIcon={
              downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={20} color="#FFFFFF" />
              )
            }
            onPress={() => void handleDownload()}
            disabled={downloading}
            size="lg"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
