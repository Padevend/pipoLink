import {
  deleteAccountSchema,
  type DeleteAccountFormValues,
} from '@/features/account/lib/delete-account.schema';
import { useDeleteAccount } from '@/features/account/model/use-delete-account';
import { useAuth } from '@/providers/auth-provider';
import { localDb } from '@/shared/storage/local-db';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  MessageCircleWarning,
  ShieldAlert,
  Trash2,
  UserX,
} from 'lucide-react-native';
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

const CONSEQUENCES = [
  {
    icon: MessageCircleWarning,
    text: 'Vos messages resteront visibles mais votre nom sera remplacé par "Compte supprimé".',
  },
  {
    icon: UserX,
    text: 'Retrait de tous vos groupes et conversations.',
  },
  {
    icon: ShieldAlert,
    text: 'Vos clés de chiffrement et appareils seront définitivement détruits.',
  },
  {
    icon: AlertTriangle,
    text: 'Aucune récupération ne sera possible après cette opération.',
  },
] as const;

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
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
                  localDb.resetDb();
                  await logout();
                  router.replace('/auth/login');
                },
                onError: (err) => {
                  const error = err as { status?: number; message?: string };
                  let message = 'Impossible de supprimer le compte.';

                  if (error.status === 401) {
                    message = 'Mot de passe incorrect.';
                  } else if (error.status === 409) {
                    message = 'Ce compte a déjà été supprimé.';
                  } else if (error.message) {
                    message = error.message;
                  }

                  Alert.alert('Erreur', message);
                },
              },
            );
          },
        },
      ],
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
            <ActivityIndicator size="small" color="#EF4444" />
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white mt-4 text-center">
              Suppression en cours…
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 text-center">
              Veuillez patienter, cette opération est irréversible.
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
          Supprimer le compte
        </Text>
      </View>

      {/* CONTENU */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête Statut Critique */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-4">
            <Trash2 size={28} color="#EF4444" strokeWidth={2.5} />
          </View>
          <Text className="text-base font-black uppercase tracking-widest text-red-500 text-center">
            Suppression définitive
          </Text>
          <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mt-1">
            Cette action ne peut pas être annulée.
          </Text>
        </Animated.View>

        {/* Panneau des Conséquences (rounded-2xl, fond plein) */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-5 mb-6 "
        >
          <Text className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4">
            Conséquences
          </Text>
          <View className="gap-y-3">
            {CONSEQUENCES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <View key={idx} className="flex-row items-start">
                  <Icon size={16} color="#EF4444" strokeWidth={2.5} />
                  <Text className="flex-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-3 leading-relaxed">
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Formulaire de validation */}
        <Animated.View entering={FadeInDown.delay(160).springify()} className="gap-y-6">
          <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Pour confirmer, veuillez saisir votre adresse email :
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Votre email"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                leftIcon={Lock}
                error={errors.email?.message}
              />
            )}
          />

          <View className="mt-2">
            <Button
              label="Supprimer définitivement"
              variant="danger"
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              size="lg"
              className="rounded-full h-14 bg-red-500 active:bg-red-600"
              rightIcon={<Trash2 size={18} color="#FFF" strokeWidth={2.5} />}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}