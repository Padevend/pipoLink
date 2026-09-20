import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/account/lib/change-password.schema';
import { useChangePassword } from '@/features/account/model/use-change-password';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      {/* LOADER OVERLAY (rounded-2xl) */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="flex-1 bg-black/60 items-center justify-center p-6"
        >
          <View className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl items-center w-full max-w-xs">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mt-4 text-center">
              Mise à jour…
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 text-center">
              Modification de vos accès en cours.
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white ml-4" numberOfLines={1}>
          Changer le mot de passe
        </Text>
      </View>

      {/* FORMULAIRE */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête Descriptive */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
            <ShieldCheck size={28} color="#F97316" strokeWidth={2.5} />
          </View>
          <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center px-4 leading-relaxed">
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

          <View className="mt-4">
            <Button
              label="Mettre à jour le mot de passe"
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              size="lg"
              className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
              rightIcon={<KeyRound size={18} color="#FFF" strokeWidth={2.5} />}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}