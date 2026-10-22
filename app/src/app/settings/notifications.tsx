import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellRing,
  RefreshCw,
  Vibrate,
  Volume2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotificationSettings } from '@/features/notifications/hooks/use-notification-settings';
import {
  isPushEnabled,
  registerForPushNotifications,
  setPushEnabled,
} from '@/features/notifications/push';
import { cn } from '@/shared/utils/cn';
import { notificationsApi } from '@/shared/api/notifications';
import { refreshChannel } from '@/features/notifications/background-handler';

const SOUND_OPTIONS: { value: 'default' | 'custom' | null; label: string }[] = [
  { value: 'default', label: 'Par défaut' },
  { value: null, label: 'Aucun' },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-6 text-[11px] font-black uppercase tracking-widest text-zinc-500">
      {children}
    </Text>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: typeof Bell;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-row items-center flex-1 pr-4 gap-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
          <Icon size={18} color={value ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
            {label}
          </Text>
          {description ? (
            <Text className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: '#F97316', false: '#E4E4E7' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function Separator() {
  return <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />;
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */

export default function NotificationsScreen(): JSX.Element {
  const { settings, loading, updateSettings, resetSettings } = useNotificationSettings();
  const client = useQueryClient();
  const [pushEnabled, setPushEnabledState] = useState(true);
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getNotifications });
  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markRead = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    void isPushEnabled().then(setPushEnabledState);
    void registerForPushNotifications();
  }, []);

  const togglePush = async (value: boolean) => {
    setPushEnabledState(value);
    await setPushEnabled(value);
    if (value) await registerForPushNotifications();
  };

  const applyAndRegister = async () => {
    if (Platform.OS === 'android') {
      await refreshChannel();
    }
    await registerForPushNotifications();
  };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
        <ActivityIndicator size="small" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Néo-banque, Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center flex-1 gap-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
          
          <View className="flex-1 justify-center">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Notifications
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
              Alertes & Sons
            </Text>
          </View>
        </View>

        {/* Bouton de réinitialisation (rounded-full) */}
        <Pressable
          onPress={async () => {
            await resetSettings();
            await applyAndRegister();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
        >
          <RefreshCw size={16} color="#A1A1AA" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 32 }}>
        
        {/* ── Section: Activation globale ──────────────────────────── */}
        <SectionLabel>Alertes système</SectionLabel>
        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          <ToggleRow
            icon={BellRing}
            label="Push notifications"
            description="Nouveaux messages lorsque l'app est fermée"
            value={pushEnabled}
            onValueChange={(v) => void togglePush(v)}
          />
        </View>

        {/* ── Section: Son & Vibration ────────────────────────────── */}
        <SectionLabel>Son & Vibration</SectionLabel>
        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          {/* Options de son */}
          {SOUND_OPTIONS.map((opt, idx) => {
            const isSelected = settings.sound === opt.value;
            return (
              <View key={String(opt.value)}>
                {idx > 0 && <Separator />}
                <Pressable
                  onPress={async () => {
                    await updateSettings({ sound: opt.value });
                    await applyAndRegister();
                  }}
                  className="flex-row items-center justify-between p-4 active:opacity-80 transition-opacity"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                      <Volume2 size={18} color={isSelected ? '#F97316' : '#A1A1AA'} strokeWidth={2.5} />
                    </View>
                    <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                      {opt.label}
                    </Text>
                  </View>
                  
                  {/* Bouton Radio Géométrique (rounded-full) */}
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent',
                    )}
                  >
                    {isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
                  </View>
                </Pressable>
              </View>
            );
          })}

          <Separator />

          {/* Commutateur de vibration */}
          <ToggleRow
            icon={Vibrate}
            label="Vibration"
            description={settings.enableVibrate ? 'Modèle : Dynamique' : 'Désactivée'}
            value={settings.enableVibrate}
            onValueChange={async (v) => {
              await updateSettings({ enableVibrate: v });
              await applyAndRegister();
            }}
          />
        </View>

        <View className="mt-7 flex-row items-center justify-between">
          <SectionLabel>Dans l’application</SectionLabel>
          {notifications.some((notification) => !notification.isRead) ? (
            <Pressable onPress={() => markAllRead.mutate()} className="mt-6">
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">Tout lire</Text>
            </Pressable>
          ) : null}
        </View>
        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          {notifications.slice(0, 20).map((notification, index) => (
            <View key={notification.id}>
              {index > 0 && <Separator />}
              <Pressable onPress={() => !notification.isRead && markRead.mutate(notification.id)} className="p-4 active:opacity-80">
                <View className="flex-row items-start gap-3">
                  <View className={cn('mt-1 h-2 w-2 rounded-full', notification.isRead ? 'bg-zinc-300' : 'bg-orange-500')} />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-zinc-950 dark:text-white">{notification.title}</Text>
                    <Text className="mt-1 text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{notification.body}</Text>
                    <Text className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">{new Date(notification.createdAt).toLocaleString('fr-FR')}</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
          {!notifications.length && <Text className="p-5 text-center text-xs font-semibold text-zinc-500">Aucune notification pour le moment.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
