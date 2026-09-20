import {
  commentSchema,
  FEEDBACK_REASONS,
  type CommentFormValues,
} from '@/features/feedback/lib/comment.schema';
import { useComment } from '@/features/feedback/model/use-comment';
import { Button } from '@/shared/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, MessageSquareCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommentFeedbackScreen() {
  const { mutate, isPending } = useComment();
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const selectedSubject = watch('subject');
  const selectedLabel =
    FEEDBACK_REASONS.find((r) => r.value === selectedSubject)?.label ?? '';

  const onSubmit = (data: CommentFormValues) => {
    const label = FEEDBACK_REASONS.find((r) => r.value === data.subject)?.label ?? data.subject;
    mutate(
      { subject: label, message: data.message },
      {
        onSuccess: () => {
          Alert.alert('Merci !', 'Votre retour a bien été transmis à l\'équipe PipoLink.', [
            { text: 'Fermer', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          Alert.alert(
            'Échec de l\'envoi',
            'Une erreur est survenue lors de la transmission. Veuillez réessayer.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* OVERLAY CHARGEMENT (rounded-2xl) */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="flex-1 bg-black/60 items-center justify-center p-6"
        >
          <View className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl items-center w-full max-w-xs">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mt-4 text-center">
              Transmission en cours…
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 text-center">
              Nous acheminons votre retour d'expérience.
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* MODAL DE SÉLECTION (PICKER) : Arrondis 2xl, fond plein */}
      <Modal transparent visible={reasonPickerOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center p-6"
          onPress={() => setReasonPickerOpen(false)}
        >
          <Animated.View
            entering={FadeIn.duration(150)}
            className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-sm overflow-hidden p-2"
          >
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 p-4 pb-3">
              Sélectionner un motif
            </Text>
            {FEEDBACK_REASONS.map((reason, index) => {
              const isSelected = selectedSubject === reason.value;
              return (
                <View key={reason.value}>
                  {index > 0 && <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />}
                  <Pressable
                    className="p-4 active:opacity-80 flex-row items-center justify-between"
                    onPress={() => {
                      setValue('subject', reason.value, { shouldValidate: true });
                      setReasonPickerOpen(false);
                    }}
                  >
                    <Text className={`text-sm font-bold ${isSelected ? 'text-orange-500' : 'text-zinc-950 dark:text-white'}`}>
                      {reason.label}
                    </Text>
                    <View
                      className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Laissez un commentaire
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Support & Avis
          </Text>
        </View>
      </View>

      {/* FORMULAIRE */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
            Votre avis nous aide à faire évoluer PipoLink. Partagez vos suggestions, signalez un problème ou indiquez-nous simplement ce que vous préférez !
          </Text>
        </View>

        <View className="gap-y-6">
          {/* SÉLECTEUR DE MOTIF */}
          <Controller
            control={control}
            name="subject"
            render={() => (
              <View className="w-full gap-y-2">
                <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Motif
                </Text>
                <Pressable
                  onPress={() => setReasonPickerOpen(true)}
                  className={`w-full flex-row rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] px-5 items-center h-14 ${
                    errors.subject
                      ? 'border-2 border-red-500'
                      : 'border-2 border-transparent'
                  }`}
                >
                  <Text
                    className={`flex-1 text-sm font-bold ${
                      selectedLabel
                        ? 'text-zinc-950 dark:text-white'
                        : 'text-zinc-400'
                    }`}
                  >
                    {selectedLabel || 'Sélectionner un motif…'}
                  </Text>
                  <ChevronDown size={18} color="#A1A1AA" strokeWidth={2.5} />
                </Pressable>
                {errors.subject && (
                  <Text className="text-xs font-bold text-red-500 mt-1">
                    {errors.subject.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* ZONE DE TEXTE MESSAGE */}
          <Controller
            control={control}
            name="message"
            render={({ field: { onChange, value } }) => (
              <View className="gap-y-2">
                <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Contenu
                </Text>
                <TextInput
                  className={`min-h-[160px] rounded-2xl bg-zinc-100 px-5 py-4 text-sm font-bold text-zinc-950 dark:bg-[#1A1A1A] dark:text-white ${
                    errors.message
                      ? 'border-2 border-red-500'
                      : 'border-2 border-transparent'
                  }`}
                  placeholder="Décrivez votre idée ou votre problème en quelques lignes…"
                  placeholderTextColor="#A1A1AA"
                  multiline
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.message && (
                  <Text className="text-xs font-bold text-red-500 mt-1">
                    {errors.message.message}
                  </Text>
                )}
              </View>
            )}
          />

          <View className="mt-4">
            <Button
              label="Envoyer le commentaire"
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              size="lg"
              className="bg-orange-500 rounded-full h-14"
              rightIcon={<MessageSquareCheck size={18} color="#FFF" strokeWidth={2.5} />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}