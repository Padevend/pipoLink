import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Eye,
  EyeOff,
  Flashlight,
  RefreshCw,
  ShieldOff,
  Vibrate,
  Volume2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotificationSettings } from '@/features/notifications/hooks/use-notification-settings';
import {
  isPushEnabled,
  registerForPushNotifications,
  setPushEnabled,
} from '@/features/notifications/push';
import {
  AndroidImportance,
  AndroidNotificationVisibility,
} from '@/features/notifications/types';
import { BRAND } from '@/shared/config/brand';
import { cn } from '@/shared/utils/cn';

const SOUND_OPTIONS: { value: 'default' | 'custom' | null; label: string }[] = [
  { value: 'default', label: 'Par défaut' },
  { value: null, label: 'Aucun' },
];


/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-3 ml-3 mt-6 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
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
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-row items-start flex-1 pr-4 gap-3.5">
        <View
          className={cn(
            'h-9 w-9 items-center justify-center rounded-xl border',
            value
              ? 'bg-primary/10 border-primary/20'
              : 'bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10',
          )}
        >
          <Icon size={16} color={value ? BRAND.primary : '#64748B'} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {label}
          </Text>
          {description ? (
            <Text className="mt-0.5 text-[11px] font-medium leading-[16px] text-text-secondary-light/60 dark:text-text-secondary-dark/60">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: BRAND.primary, false: '#D1D5DB' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function Separator() {
  return <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />;
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */

export default function NotificationsScreen(): JSX.Element {
  const { settings, loading, updateSettings, resetSettings } = useNotificationSettings();

  const [pushEnabled, setPushEnabledState] = useState(true);

  useEffect(() => {
    void isPushEnabled().then(setPushEnabledState);
    void registerForPushNotifications();
  }, []);

  const togglePush = async (value: boolean) => {
    setPushEnabledState(value);
    await setPushEnabled(value);
    if (value) await registerForPushNotifications();
  };

  /** Apply changes & re-register the channel on Android */
  const applyAndRegister = async () => {
    if (Platform.OS === 'android') {
      await registerForPushNotifications();
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark" edges={['top']}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Notifications
        </Text>

        {/* Reset button */}
        <Pressable
          onPress={async () => {
            await resetSettings();
            await applyAndRegister();
          }}
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <RefreshCw size={18} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5">
          {/* ── Section: Activation globale ──────────────────────────── */}
          <SectionLabel>Alertes système</SectionLabel>
          <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <ToggleRow
              icon={BellRing}
              label="Push notifications"
              description="Nouveaux messages et alertes lorsque l'app est fermée"
              value={pushEnabled}
              onValueChange={(v) => void togglePush(v)}
            />
          </View>

          {/* ── Section: Son & Vibration ────────────────────────────── */}
          <SectionLabel>Son & Vibration</SectionLabel>
          <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            {/* Sound picker */}
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
                    className="flex-row items-center justify-between px-4 py-3.5 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5"
                  >
                    <View className="flex-row items-center gap-3.5">
                      <View
                        className={cn(
                          'h-9 w-9 items-center justify-center rounded-xl border',
                          isSelected
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10',
                        )}
                      >
                        <Volume2 size={16} color={isSelected ? BRAND.primary : '#64748B'} />
                      </View>
                      <Text
                        className={cn(
                          'text-[14px] font-semibold tracking-tight',
                          isSelected ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark',
                        )}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    <View
                      className={cn(
                        'h-5 w-5 items-center justify-center rounded-full border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border-light/60 dark:border-border-dark/40 bg-transparent',
                      )}
                    >
                      {isSelected && <View className="h-2 w-2 rounded-full bg-primary" />}
                    </View>
                  </Pressable>
                </View>
              );
            })}

            <Separator />

            {/* Vibration toggle */}
            <ToggleRow
              icon={Vibrate}
              label="Vibration"
              description={settings.enableVibrate ? 'Pattern : 0-250-250-250 ms' : 'Désactivée'}
              value={settings.enableVibrate}
              onValueChange={async (v) => {
                await updateSettings({ enableVibrate: v });
                await applyAndRegister();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}