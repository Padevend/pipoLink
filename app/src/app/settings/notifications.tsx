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

const SOUND_OPTIONS: { value: 'default' | 'custom' | null; label: string }[] = [
  { value: 'default', label: 'Par défaut' },
  { value: null, label: 'Aucun' },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 ml-1 mt-5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
      <View className="flex-row items-start flex-1 pr-4 gap-3">
        <View
          className={cn(
            'h-8 w-8 items-center justify-center rounded-lg border',
            value
              ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50'
              : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800',
          )}
        >
          <Icon size={14} color={value ? '#F97316' : '#71717A'} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {label}
          </Text>
          {description ? (
            <Text className="mt-0.5 text-[10px] font-semibold leading-4 text-zinc-400 dark:text-zinc-500">
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
  return <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />;
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

  const applyAndRegister = async () => {
    if (Platform.OS === 'android') {
      await registerForPushNotifications();
    }
  };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
        <ActivityIndicator size="small" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Notifications
        </Text>

        {/* Bouton de réinitialisation géométrique */}
        <Pressable
          onPress={async () => {
            await resetSettings();
            await applyAndRegister();
          }}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <RefreshCw size={13} color="#71717A" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View className="px-4">
          
          {/* ── Section: Activation globale ──────────────────────────── */}
          <SectionLabel>Alertes système</SectionLabel>
          <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
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
          <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
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
                    className={cn(
                      'flex-row items-center justify-between px-4 py-3.5 transition-colors',
                      isSelected 
                        ? 'bg-orange-50/20 dark:bg-orange-950/5' 
                        : 'active:bg-zinc-50 dark:active:bg-zinc-900/50'
                    )}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={cn(
                          'h-8 w-8 items-center justify-center rounded-lg border',
                          isSelected
                            ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50'
                            : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800',
                        )}
                      >
                        <Volume2 size={14} color={isSelected ? '#F97316' : '#71717A'} />
                      </View>
                      <Text
                        className={cn(
                          'text-xs font-semibold tracking-tight',
                          isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-50',
                        )}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    <View
                      className={cn(
                        'h-4 w-4 items-center justify-center rounded-full border',
                        isSelected
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-zinc-300 dark:border-zinc-700 bg-transparent',
                      )}
                    >
                      {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-white" />}
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