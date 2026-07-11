import { useDeleteAccount } from '@/features/account/model/use-delete-account';
import {
  deleteAccountSchema,
  type DeleteAccountFormValues,
} from '@/features/account/lib/delete-account.schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useAuth } from '@/providers/auth-provider';
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
import { localDb } from '@/shared/storage/local-db';

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
    defaultValues: { password: '' },
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
              { password: data.password },
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      {/* LOADER OVERLAY : Mat et sans ombre portée */}
      <Modal transparent visible={isPending} animationType="fade">
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <View className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center max-w-[80%]">
            <ActivityIndicator size="small" color="#EF4444" />
            <Text className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 tracking-wider uppercase mt-3.5 text-center">
              Suppression en cours…
            </Text>
            <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 text-center">
              Veuillez patienter, cette opération est irréversible.
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
          Supprimer le compte
        </Text>
      </View>

      {/* CONTENU */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête Statut Critique */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-6">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 mb-3.5">
            <Trash2 size={22} color="#EF4444" />
          </View>
          <Text className="text-sm font-bold text-red-500 text-center">
            Suppression définitive
          </Text>
          <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 text-center mt-1">
            Cette action ne peut pas être annulée.
          </Text>
        </Animated.View>

        {/* Panneau Mat des Conséquences */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          className="rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 p-4 mb-5"
        >
          <Text className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-3">
            Conséquences
          </Text>
          {CONSEQUENCES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View key={idx} className="flex-row items-start pb-2">
                <Icon size={13} color="#EF4444" className="shrink-0" />
                <Text className="flex-1 text-xs ps-2 font-medium text-zinc-800 dark:text-zinc-200 leading-4">
                  {item.text}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Formulaire de validation */}
        <Animated.View entering={FadeInDown.delay(160).springify()} className="gap-y-3.5">
          <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 px-1">
            Pour confirmer, saisissez votre mot de passe :
          </Text>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Mot de passe"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoCapitalize="none"
                leftIcon={Lock}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            label="Supprimer définitivement"
            variant="danger"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            className="mt-2 rounded-xl h-11 bg-red-500 active:bg-red-600"
            rightIcon={<Trash2 size={14} color="#FFF" />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}