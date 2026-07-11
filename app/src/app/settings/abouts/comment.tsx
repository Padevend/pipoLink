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
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* OVERLAY CHARGEMENT : Mat & Strict */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <View className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center max-w-[80%]">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-[10px] font-bold tracking-wider text-zinc-900 dark:text-zinc-50 uppercase mt-3 text-center">
              Transmission en cours…
            </Text>
            <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 text-center">
              Nous acheminons votre retour d'expérience.
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* MODAL DE SÉLECTION (PICKER) : Mat & Linéaire */}
      <Modal transparent visible={reasonPickerOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center"
          onPress={() => setReasonPickerOpen(false)}
        >
          <Animated.View
            entering={FadeIn.duration(150)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-[85%] max-w-[320px] overflow-hidden"
          >
            <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 p-4 pb-2">
              Sélectionner un motif
            </Text>
            {FEEDBACK_REASONS.map((reason, index) => {
              const isSelected = selectedSubject === reason.value;
              return (
                <View key={reason.value}>
                  {index > 0 && <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-800" />}
                  <Pressable
                    className="px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800/50 flex-row items-center"
                    onPress={() => {
                      setValue('subject', reason.value, { shouldValidate: true });
                      setReasonPickerOpen(false);
                    }}
                  >
                    <View
                      className={`h-4 w-4 rounded-full border items-center justify-center mr-3 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </View>
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                      {reason.label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
            <View className="h-2" />
          </Animated.View>
        </Pressable>
      </Modal>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Laissez un commentaire
        </Text>
      </View>

      {/* FORMULAIRE */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-5">
          <Text className="text-xs leading-5 font-semibold text-zinc-400 dark:text-zinc-500">
            Votre avis nous aide à faire évoluer PipoLink. Partagez vos suggestions, signalez un
            problème ou indiquez-nous simplement ce que vous préférez !
          </Text>
        </View>

        <View className="gap-y-4">
          {/* SÉLECTEUR DE MOTIF */}
          <Controller
            control={control}
            name="subject"
            render={() => (
              <View className="w-full gap-y-1.5">
                <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Motif
                </Text>
                <Pressable
                  onPress={() => setReasonPickerOpen(true)}
                  className={`w-full flex-row rounded-xl bg-white dark:bg-zinc-950 border px-4 items-center h-12 ${
                    errors.subject
                      ? 'border-red-500 dark:border-red-900/50 bg-red-50/10'
                      : 'border-zinc-200 dark:border-zinc-900 active:bg-zinc-50 dark:active:bg-zinc-900/50'
                  }`}
                >
                  <Text
                    className={`flex-1 text-xs font-semibold ${
                      selectedLabel
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {selectedLabel || 'Sélectionner un motif…'}
                  </Text>
                  <ChevronDown size={14} color="#71717A" />
                </Pressable>
                {errors.subject && (
                  <Text className="ml-1 text-[10px] font-bold text-red-500 dark:text-red-400">
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
              <View className="gap-y-1.5">
                <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Contenu
                </Text>
                <TextInput
                  className={`min-h-[140px] rounded-xl border bg-white px-4 py-3 text-xs font-semibold text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 ${
                    errors.message
                      ? 'border-red-500 dark:border-red-900/50 bg-red-50/10'
                      : 'border-zinc-200 dark:border-zinc-900 focus:border-orange-500 dark:focus:border-orange-500'
                  }`}
                  placeholder="Décrivez votre idée ou votre problème en quelques lignes…"
                  placeholderTextColor="#71717A"
                  multiline
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.message && (
                  <Text className="ml-1 text-[10px] font-bold text-red-500 dark:text-red-400">
                    {errors.message.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Button
            label="Envoyer le commentaire"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            className="mt-2 bg-orange-500 rounded-xl"
            rightIcon={<MessageSquareCheck size={14} color="#FFF" strokeWidth={2.5} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}