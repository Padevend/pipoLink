import { useChangePassword } from '@/features/account/model/use-change-password';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/account/lib/change-password.schema';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const { mutate, isPending } = useChangePassword();
  const insets = useSafeAreaInsets();

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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      {/* LOADER OVERLAY : Mat et sans ombre portée */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <View className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center max-w-[80%]">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 tracking-wider uppercase mt-3.5 text-center">
              Mise à jour…
            </Text>
            <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 text-center">
              Modification de vos accès en cours.
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 mr-3 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Changer le mot de passe
        </Text>
      </View>

      {/* FORMULAIRE */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête Descriptive Maté */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-6">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/20 mb-3.5">
            <ShieldCheck size={22} color="#F97316" />
          </View>
          <Text className="text-xs leading-5 font-semibold text-zinc-400 dark:text-zinc-500 text-center px-4">
            Modifiez votre mot de passe pour sécuriser l'accès à votre compte PipoLink.
          </Text>
        </Animated.View>

        {/* Champs de Saisie */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="gap-y-6">
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
            className="mt-4 rounded-xl h-11 bg-orange-500 active:bg-orange-600"
            rightIcon={<KeyRound size={14} color="#FFF" />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}