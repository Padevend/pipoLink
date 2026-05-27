import {
  commentSchema,
  FEEDBACK_REASONS,
  type CommentFormValues,
} from '@/features/feedback/lib/comment.schema';
import { useComment } from '@/features/feedback/model/use-comment';
import { BRAND } from '@/shared/config/brand';
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

export default function CommentFeedbackScreen() {
  const { mutate, isPending } = useComment();
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);

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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      {/* Loader overlay */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="flex-1 bg-black/40 items-center justify-center"
        >
          <View className="p-6 bg-surface-light dark:bg-zinc-900 border border-border-light/40 dark:border-border-dark/20 rounded-2xl items-center shadow-2xl max-w-[80%]">
            <ActivityIndicator size="small" color={BRAND.primary} />
            <Text className="text-[13px] font-bold text-text-primary-light dark:text-text-primary-dark tracking-wide uppercase mt-4 text-center">
              Transmission en cours…
            </Text>
            <Text className="text-[11px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1 text-center">
              Nous acheminons votre retour d'expérience.
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Reason picker modal */}
      <Modal transparent visible={reasonPickerOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center"
          onPress={() => setReasonPickerOpen(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-surface-light dark:bg-zinc-900 border border-border-light/40 dark:border-border-dark/20 rounded-2xl w-[85%] max-w-[340px] overflow-hidden"
          >
            <Text className="text-[13px] font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark p-4 pb-2">
              Sélectionner un motif
            </Text>
            {FEEDBACK_REASONS.map((reason) => (
              <Pressable
                key={reason.value}
                className="px-4 py-3 active:bg-primary/5 flex-row items-center"
                onPress={() => {
                  setValue('subject', reason.value, { shouldValidate: true });
                  setReasonPickerOpen(false);
                }}
              >
                <View
                  className={`h-5 w-5 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedSubject === reason.value
                      ? 'border-primary bg-primary'
                      : 'border-border-light/40 dark:border-border-dark/30'
                  }`}
                >
                  {selectedSubject === reason.value && (
                    <View className="h-2 w-2 rounded-full bg-white" />
                  )}
                </View>
                <Text className="text-[14px] text-text-primary-light dark:text-text-primary-dark">
                  {reason.label}
                </Text>
              </Pressable>
            ))}
            <View className="h-2" />
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center border-b border-border-light/20 bg-surface-light/40 px-5 py-4 dark:border-border-dark/10 dark:bg-surface-dark/40 backdrop-blur-md">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800/80 mr-3 active:scale-95"
        >
          <ArrowLeft size={16} className="text-text-secondary-light/70 dark:text-text-secondary-dark/70" />
        </Pressable>
        <Text className="font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark text-[16px]">
          Laissez un commentaire
        </Text>
      </View>

      {/* Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.springify()} className="mb-6">
          <Text className="text-[13px] leading-5 font-medium text-text-secondary-light/70 dark:text-text-secondary-dark/60">
            Votre avis nous aide à faire évoluer PipoLink. Partagez vos suggestions, signalez un
            problème ou indiquez-nous simplement ce que vous préférez !
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} className="gap-y-4">
          {/* Reason picker */}
          <Controller
            control={control}
            name="subject"
            render={() => (
              <View className="w-full gap-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-text-secondary-light/60 dark:text-text-secondary-dark/60 ml-1">
                  Motif
                </Text>
                <Pressable
                  onPress={() => setReasonPickerOpen(true)}
                  className={`w-full flex-row rounded-xl bg-surface-light/50 dark:bg-surface-dark/40 border px-4 items-center h-16 ${
                    errors.subject
                      ? 'border-error/40 bg-error/5 dark:border-error/30'
                      : 'border-border-light/40 dark:border-border-dark/20'
                  }`}
                >
                  <Text
                    className={`flex-1 text-[13px] font-medium ${
                      selectedLabel
                        ? 'text-text-primary-light dark:text-text-primary-dark'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {selectedLabel || 'Sélectionner un motif…'}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </Pressable>
                {errors.subject && (
                  <Text className="text-[11px] font-semibold text-error ml-1.5 mt-0.5">
                    {errors.subject.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Message textarea */}
          <Controller
            control={control}
            name="message"
            render={({ field: { onChange, value } }) => (
              <View className="gap-y-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-text-secondary-light/60 dark:text-text-secondary-dark/60 ml-1">
                  Contenu
                </Text>
                <TextInput
                  className={`min-h-[140px] rounded-xl border bg-surface-light/50 px-4 py-3 text-[13px] font-medium text-text-primary-light dark:bg-surface-dark/40 dark:text-text-primary-dark ${
                    errors.message
                      ? 'border-error/40 bg-error/5 dark:border-error/30'
                      : 'border-border-light/40 dark:border-border-dark/20'
                  }`}
                  placeholder="Décrivez votre idée ou votre problème en quelques lignes…"
                  placeholderTextColor="#64748B"
                  multiline
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                />
                {errors.message && (
                  <Text className="text-[11px] font-semibold text-error ml-1.5 mt-0.5">
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
            className="mt-4"
            rightIcon={<MessageSquareCheck size={16} color="#FFF" strokeWidth={2.5} />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}