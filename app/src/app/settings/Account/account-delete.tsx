import { useDeleteAccount } from '@/features/account/model/use-delete-account';
import {
  deleteAccountSchema,
  type DeleteAccountFormValues,
} from '@/features/account/lib/delete-account.schema';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Mail,
  MessageCircleWarning,
  ShieldAlert,
  Trash2,
  UserX,
} from 'lucide-react-native';
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

const CONSEQUENCES = [
  {
    icon: MessageCircleWarning,
    text: 'Suppression irréversible de tous vos messages et conversations.',
  },
  {
    icon: UserX,
    text: 'Retrait de tous vos contacts et groupes.',
  },
  {
    icon: ShieldAlert,
    text: 'Vos clés de chiffrement et données locales seront détruites.',
  },
  {
    icon: AlertTriangle,
    text: 'Aucune récupération ne sera possible après cette opération.',
  },
] as const;

export default function DeleteAccountScreen() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useDeleteAccount();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: DeleteAccountFormValues) => {
    Alert.alert(
      'Suppression définitive',
      'Cette action est irréversible. Êtes-vous absolument sûr de vouloir supprimer votre compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            mutate(
              { email: data.email },
              {
                onSuccess: async () => {
                  queryClient.clear();
                  await logout();
                  router.replace('/auth/login');
                },
                onError: (err) => {
                  Alert.alert(
                    'Erreur',
                    (err as Error).message || 'Impossible de supprimer le compte.',
                  );
                },
              },
            );
          },
        },
      ],
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
            <ActivityIndicator size="small" color="#EF4444" />
            <Text className="text-[13px] font-bold text-text-primary-light dark:text-text-primary-dark tracking-wide uppercase mt-4 text-center">
              Suppression en cours…
            </Text>
            <Text className="text-[11px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1 text-center">
              Veuillez patienter, cette opération est irréversible.
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
          Supprimer le compte
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Danger icon */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-3">
            <Trash2 size={30} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-red-500 text-center">
            Suppression définitive
          </Text>
          <Text className="text-[12px] text-text-secondary-light/60 dark:text-text-secondary-dark/50 text-center mt-1">
            Cette action ne peut pas être annulée.
          </Text>
        </Animated.View>

        {/* Consequences card */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 p-4 mb-6"
        >
          <Text className="text-[12px] font-bold uppercase tracking-wider text-red-500 mb-3">
            Conséquences
          </Text>
          {CONSEQUENCES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View key={idx} className="flex-row items-start mb-2.5 last:mb-0">
                <Icon size={14} color="#EF4444" className="mt-0.5 mr-2.5 shrink-0" />
                <Text className="flex-1 text-[13px] leading-5 text-text-primary-light dark:text-text-primary-dark">
                  {item.text}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Email confirmation */}
        <Animated.View entering={FadeInDown.delay(160).springify()} className="gap-y-4">
          <Text className="text-[13px] font-medium text-text-primary-light dark:text-text-primary-dark">
            Pour confirmer, saisissez l'adresse email associée à votre compte :
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="votre@email.com"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={Mail}
                error={errors.email?.message}
              />
            )}
          />

          <Button
            label="Supprimer définitivement"
            variant="danger"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            className="mt-4"
            rightIcon={<Trash2 size={16} color="#FFF" strokeWidth={2.5} />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
