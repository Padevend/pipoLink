import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUploadDocument } from '@/entities/document/hooks';
import type { PickedLibraryFile } from '@/shared/api/library';
import type { DocumentType } from '@/shared/api/types';
import { BRAND } from '@/shared/config/brand';
import { useToast } from '@/shared/hooks/use-toast';
import { AcademicPathPicker, type AcademicPath } from '@/shared/ui/academic-path-picker';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';

const DOC_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Cours', value: 'COURS' },
  { label: 'TD', value: 'TD' },
  { label: 'TP', value: 'TP' },
  { label: 'CC', value: 'CC' },
  { label: 'Examen', value: 'EXAMEN' },
  { label: 'Résumé', value: 'RESUME' },
];

export default function UploadDocumentModal() {
  const { showToast } = useToast();
  const uploadMutation = useUploadDocument();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<PickedLibraryFile | null>(null);
  const [docType, setDocType] = useState<DocumentType>('COURS');
  const [path, setPath] = useState<AcademicPath | null>(null);

  const handlePathChange = useCallback((p: AcademicPath) => {
    setPath(p);
  }, []);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      });
      if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
    }
  };

  const canSubmit = Boolean(file && title.trim() && path?.filiere && path.niveau && path.ue);

  const handleUpload = async () => {
    if (!file || !title.trim() || !path) return;

    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: {
          title: title.trim(),
          type: docType,
          filiere: path.filiere,
          niveau: path.niveau,
          ue: path.ue,
        },
      });
      showToast({
        type: 'success',
        message: `Document rangé dans ${path.filiere} › ${path.niveau} › ${path.ue}`,
      });
      router.back();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Échec de l’upload — vérifiez votre connexion.';
      showToast({ type: 'error', message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Style Glassmorphism Solide */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/20 bg-surface-light/75 px-5 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Publier un document
        </Text>
        
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:opacity-80"
        >
          <X size={16} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-10">
          
          {/* Zone de Dépôt / Sélecteur de fichier Glassmorphic */}
          <Pressable 
            onPress={handlePickDocument} 
            disabled={uploadMutation.isPending}
            className="active:opacity-90"
          >
            <View
              className={cn(
                'h-36 items-center justify-center gap-2.5 rounded-2xl border backdrop-blur-md ',
                file 
                  ? 'border-success/30 bg-success/5 dark:border-success/20' 
                  : 'border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40',
              )}
            >
              {file ? (
                <>
                  <View className="p-2.5 rounded-xl bg-success/10">
                    <CheckCircle2 size={22} color="#22C55E" />
                  </View>
                  <Text className="font-semibold text-sm text-success text-center px-6" numberOfLines={1}>
                    {file.name}
                  </Text>
                </>
              ) : (
                <>
                  <View className="p-2.5 rounded-xl bg-primary/10">
                    <Upload size={22} color={BRAND.primary} />
                  </View>
                  <Text className="font-semibold text-sm text-text-primary-light/90 dark:text-text-primary-dark/90">
                    Sélectionner un document
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          {/* Input du Titre (Style Input Épuré Intégré) */}
          <View className="bg-surface-light/30 dark:bg-surface-dark/20 rounded-2xl p-0.5">
            <Input
              label="Titre du document"
              placeholder="ex. Polycopié de cours - Chapitre 3"
              value={title}
              onChangeText={setTitle}
              leftIcon={FileText}
              containerClassName="bg-transparent border-0"
              className="text-[14px] text-text-primary-light dark:text-text-primary-dark"
            />
          </View>

          {/* Section Sélection Type de Document */}
          <View className="gap-2">
            <Text className="ml-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light/60 dark:text-text-secondary-dark/60">
              Type de document
            </Text>
            
            <View className="flex-row flex-wrap gap-2">
              {DOC_TYPES.map((t) => {
                const isSelected = docType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setDocType(t.value)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 border active:opacity-80',
                      isSelected 
                        ? 'bg-primary border-primary' 
                        : 'bg-surface-light/50 border-border-light/40 dark:bg-surface-dark/40 dark:border-border-dark/20',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[12px] font-semibold tracking-wide',
                        isSelected ? 'text-white' : 'text-text-secondary-light dark:text-text-secondary-dark',
                      )}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sélecteur de Parcours Académique */}
          <View className="p-1">
            <AcademicPathPicker value={path ?? {}} onChange={handlePathChange} />
          </View>

          {/* Bouton Principal Soumettre */}
          <Button
            label="Publier sur la bibliothèque"
            size="lg"
            onPress={() => void handleUpload()}
            loading={uploadMutation.isPending}
            disabled={!canSubmit}
            className="rounded-2xl h-12  mt-2 active:opacity-90"
          />
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}