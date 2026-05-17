import { useAuth } from '@/providers';
import { useIsPrimaryDevice } from '@/features/devices/hooks/use-is-primary-device';
import { useTheme } from '@/shared/hooks/use-theme';
import { Avatar } from '@/shared/ui/avatar';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/utils/cn';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Globe,
  Info,
  LogOut,
  Moon,
  Palette,
  QrCode,
  Shield,
  User,
} from 'lucide-react-native';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { mode, setMode, colorScheme } = useTheme();
  const { data: isPrimary } = useIsPrimaryDevice();
  const router = useRouter();
  const { t } = useTranslation('settings');

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    showChevron = true,
    destructive = false,
  }: {
    icon: typeof User;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
  }) => (
    <Pressable onPress={onPress} className="flex-row items-center py-4 px-1">
      <View className={cn('mr-4 h-10 w-10 items-center justify-center rounded-xl', destructive ? 'bg-error/10' : 'bg-slate-100 dark:bg-slate-800')}>
        <Icon size={20} color={destructive ? '#EF4444' : '#6B7280'} />
      </View>
      <View className="flex-1">
        <Text className={cn('text-base font-bold', destructive ? 'text-error' : 'text-text-primary-light dark:text-text-primary-dark')}>
          {label}
        </Text>
        {value ? <Text className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{value}</Text> : null}
      </View>
      {showChevron ? <ChevronRight size={20} color="#CBD5E1" /> : null}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className="mb-8 text-3xl font-black text-text-primary-light dark:text-text-primary-dark">{t('title')}</Text>

          <Pressable onPress={() => router.push('/settings/profile' as any)} className="mb-10 items-center">
            <Avatar
              name={user?.profile?.firstname || user?.username || 'User'}
              uri={user?.profile?.avatarUrl ?? undefined}
              size="xl"
              className="border-4 border-white dark:border-slate-800"
            />
            <Text className="mt-4 text-2xl font-black text-text-primary-light dark:text-text-primary-dark">{user?.username}</Text>
            <Text className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              {user?.role}
            </Text>
          </Pressable>

          <Text className="mb-4 ml-2 text-xs font-black uppercase tracking-[2px] text-text-secondary-light dark:text-text-secondary-dark">
            {t('account')}
          </Text>
          <Card className="mb-8">
            <SettingItem icon={User} label={t('personalInfo')} value={t('personalInfoDesc')} onPress={() => router.push('/settings/profile' as any)} />
            {isPrimary ? (
              <>
                <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
                <SettingItem icon={Shield} label={t('linkedDevices')} value={t('linkedDevicesDesc')} onPress={() => router.push('/devices' as any)} />
                <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
                <SettingItem icon={QrCode} label={t('linkDevice')} value={t('linkDeviceDesc')} onPress={() => router.push('/devices/scan' as any)} />
              </>
            ) : null}
            <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
            <SettingItem icon={CreditCard} label={t('subscription')} value={t('subscriptionDesc')} onPress={() => router.push('/settings/subscription' as any)} />
          </Card>

          <Text className="mb-4 ml-2 text-xs font-black uppercase tracking-[2px] text-text-secondary-light dark:text-text-secondary-dark">
            {t('preferences')}
          </Text>
          <Card className="mb-8">
            <SettingItem icon={Palette} label={t('appearance')} value={t('appearanceDesc')} onPress={() => router.push('/settings/appearance' as any)} />
            <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
            <SettingItem icon={Globe} label={t('language')} value={t('languageDesc')} onPress={() => router.push('/settings/language' as any)} />
            <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
            <View className="flex-row items-center py-4 px-1">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Moon size={20} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">{t('darkMode')}</Text>
              </View>
              <Switch value={colorScheme === 'dark'} onValueChange={(v) => setMode(v ? 'dark' : 'light')} trackColor={{ true: '#FFFFFF' }} />
            </View>
            <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
            <SettingItem icon={Bell} label={t('notifications')} value={t('notificationsDesc')} onPress={() => router.push('/settings/notifications' as any)} />
          </Card>

          <Text className="mb-4 ml-2 text-xs font-black uppercase tracking-[2px] text-text-secondary-light dark:text-text-secondary-dark">
            {t('help')}
          </Text>
          <Card className="mb-12">
            <SettingItem icon={Info} label={t('about')} value={t('aboutDesc')} onPress={() => router.push('/settings/about' as any)} />
            <View className="mx-4 h-px bg-border-light dark:bg-border-dark" />
            <SettingItem icon={LogOut} label={t('logout')} destructive showChevron={false} onPress={() => void handleLogout()} />
          </Card>

          <Text className="mb-8 text-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
