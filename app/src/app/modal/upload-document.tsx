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

const MAX_FILE_BYTES = 50 * 1024 * 1024;

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

    if (file.size && file.size > MAX_FILE_BYTES) {
      showToast({ type: 'error', message: 'Fichier trop volumineux (max 50 Mo).' });
      return;
    }

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
    } catch (e: any) {
      const msg = e?.message || 'Échec de l\'upload — vérifiez votre connexion.';
      showToast({ type: 'error', message: msg });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Style Plat et Franc */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
          Publier un document
        </Text>
        
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
        >
          <X size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom + 24, 40),
          paddingLeft: 24,
          paddingRight: 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6">
          
          {/* ZONE DE DÉPÔT : Format Carte (rounded-2xl) */}
          <Pressable 
            onPress={() => void handlePickDocument()} 
            disabled={uploadMutation.isPending}
            className="active:opacity-80"
          >
            <View
              className={cn(
                'h-36 items-center justify-center gap-3 rounded-2xl border-2 transition-colors',
                file 
                  ? 'border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-950/20' 
                  : 'border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#1A1A1A]',
              )}
            >
              {file ? (
                <>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <CheckCircle2 size={20} color="#22C55E" strokeWidth={2.5} />
                  </View>
                  <Text className="font-bold text-sm text-green-700 dark:text-green-400 text-center px-6" numberOfLines={1}>
                    {file.name}
                  </Text>
                </>
              ) : (
                <>
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-[#222222]">
                    <Upload size={20} color="#F97316" strokeWidth={2.5} />
                  </View>
                  <Text className="font-bold text-sm text-zinc-950 dark:text-white">
                    Appuyez pour sélectionner un fichier
                  </Text>
                  <Text className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">
                    Max 50 Mo
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          {/* INPUT DU TITRE */}
          <View>
            <Input
              label="Titre du document"
              placeholder="ex. Polycopié de cours - Chapitre 3"
              value={title}
              onChangeText={setTitle}
              leftIcon={FileText}
            />
          </View>

          {/* SÉLECTEUR DE TYPE (Pilules Boutons : rounded-full) */}
          <View className="gap-3">
            <Text className="ml-1 text-[11px] font-black uppercase tracking-widest text-zinc-500">
              Catégorie
            </Text>
            
            <View className="flex-row flex-wrap gap-2">
              {DOC_TYPES.map((t) => {
                const isSelected = docType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setDocType(t.value)}
                    className={cn(
                      'rounded-full px-4 py-2 border-2 active:opacity-80 transition-all',
                      isSelected 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'bg-zinc-100 border-transparent dark:bg-[#1A1A1A]',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-black tracking-widest uppercase',
                        isSelected ? 'text-white' : 'text-zinc-950 dark:text-white',
                      )}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* SÉLECTEUR DE PARCOURS ACADÉMIQUE (Gère ses propres inputs) */}
          <View className="mt-2">
            <AcademicPathPicker value={path ?? {}} onChange={handlePathChange} />
          </View>

          {/* BOUTON PRINCIPAL */}
          <View className="mt-6">
            <Button
              label="Publier le document"
              size="lg"
              onPress={() => void handleUpload()}
              loading={uploadMutation.isPending}
              disabled={!canSubmit}
            />
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}