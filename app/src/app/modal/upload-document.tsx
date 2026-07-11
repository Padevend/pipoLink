import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUploadDocument } from '@/entities/document/hooks';
import { useToast } from '@/providers';
import type { PickedLibraryFile } from '@/shared/api/library';
import type { DocumentType } from '@/shared/api/types';
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
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<PickedLibraryFile | null>(null);
  const [docType, setDocType] = useState<DocumentType>('COURS');
  const [path, setPath] = useState<AcademicPath | null>(null);

  const handlePathChange = useCallback((p: AcademicPath) => {
    setPath(p);
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size,
        });
        if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
      }
    } catch (error) {
      console.error('DocumentPicker Error:', error);
      showToast({ type: 'error', message: 'Erreur lors de la sélection du document' });
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
      console.log(e);
      const message = 'Échec de l’upload — vérifiez votre connexion.';
      showToast({ type: 'error', message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-5 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Publier un document
        </Text>
        
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <X size={14} color="#71717A" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          
          {/* ZONE DE DÉPÔT : Aplat Mat Unifié */}
          <Pressable 
            onPress={() => void handlePickDocument()} 
            disabled={uploadMutation.isPending}
            className="active:opacity-80"
          >
            <View
              className={cn(
                'h-32 items-center justify-center gap-2 rounded-xl border transition-colors',
                file 
                  ? 'border-green-200 bg-green-50/50 dark:border-green-950/30 dark:bg-green-950/10' 
                  : 'border-zinc-200 bg-zinc-50 border-dashed dark:border-zinc-800 dark:bg-zinc-900/40',
              )}
            >
              {file ? (
                <>
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
                    <CheckCircle2 size={16} color="#22C55E" />
                  </View>
                  <Text className="font-bold text-xs text-green-700 dark:text-green-400 text-center px-6" numberOfLines={1}>
                    {file.name}
                  </Text>
                </>
              ) : (
                <>
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/30">
                    <Upload size={15} color="#F97316" />
                  </View>
                  <Text className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                    Sélectionner un document
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          {/* INPUT DU TITRE : Intégration Mate Complète */}
          <View className="my-5">
            <Input
              label="Titre du document"
              placeholder="ex. Polycopié de cours - Chapitre 3"
              value={title}
              onChangeText={setTitle}
              leftIcon={FileText}
              containerClassName="bg-transparent border-0 px-2 h-12"
              className="text-xs p-4 text-zinc-900 dark:text-zinc-50"
            />
          </View>

          {/* SECTION : Types de Document (Capsules Rectangulaires Mates) */}
          <View className="gap-1.5">
            <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Type de document
            </Text>
            
            <View className="flex-row flex-wrap gap-1.5">
              {DOC_TYPES.map((t) => {
                const isSelected = docType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setDocType(t.value)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 border',
                      isSelected 
                        ? 'bg-orange-500 border-orange-500 active:bg-orange-600' 
                        : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[11px] font-bold tracking-wide uppercase',
                        isSelected ? 'text-white' : 'text-zinc-500 dark:text-zinc-400',
                      )}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* SÉLECTEUR DE PARCOURS ACADÉMIQUE */}
          <View className="p-0.5">
            <AcademicPathPicker value={path ?? {}} onChange={handlePathChange} />
          </View>

          {/* BOUTON PRINCIPAL : Orange Mat Solide */}
          <Button
            label="Publier sur la bibliothèque"
            size="lg"
            onPress={() => void handleUpload()}
            loading={uploadMutation.isPending}
            disabled={!canSubmit}
            className="rounded-xl h-11 bg-orange-500 active:bg-orange-600 mt-2"
          />
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}