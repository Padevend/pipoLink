import { useChangePassword } from '@/features/account/model/use-change-password';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/account/lib/change-password.schema';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const { mutate, isPending } = useChangePassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (err) => {
          Alert.alert(
            'Échec de la modification',
            (err as Error).message || 'Impossible de modifier le mot de passe.',
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
              Mise à jour…
            </Text>
            <Text className="text-[11px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1 text-center">
              Modification de vos accès en cours.
            </Text>
          </View>
        </Animated.View>
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
          Changer le mot de passe
        </Text>
      </View>

      {/* Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon + Description */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck size={28} color={BRAND.primary} />
          </View>
          <Text className="text-[13px] leading-5 font-medium text-text-secondary-light/70 dark:text-text-secondary-dark/60 text-center px-4">
            Modifiez votre mot de passe pour sécuriser l'accès à votre compte PipoLink.
          </Text>
        </Animated.View>

        {/* Form fields */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="gap-y-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Mot de passe actuel"
                placeholder="Saisissez l'ancien mot de passe"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                leftIcon={Lock}
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nouveau mot de passe"
                placeholder="Créer un mot de passe sécurisé"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                leftIcon={Lock}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirmer le nouveau mot de passe"
                placeholder="Répétez le nouveau mot de passe"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                leftIcon={Lock}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            label="Mettre à jour le mot de passe"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            className="mt-6"
            rightIcon={<KeyRound size={16} color="#FFF" strokeWidth={2.5} />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}