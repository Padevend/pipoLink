import { useAuth } from '@/providers';
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
  LogOut,
  Moon,
  Shield,
  User
} from 'lucide-react-native';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { mode, setMode, colorScheme } = useTheme();
  const router = useRouter();

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
    destructive = false 
  }: any) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center py-4 px-1"
    >
      <View className={cn(
        "w-10 h-10 rounded-xl items-center justify-center mr-4",
        destructive ? "bg-error/10" : "bg-slate-100 dark:bg-slate-800"
      )}>
        <Icon size={20} color={destructive ? "#EF4444" : "#6B7280"} />
      </View>
      <View className="flex-1">
        <Text className={cn(
          "text-base font-bold",
          destructive ? "text-error" : "text-text-primary-light dark:text-text-primary-dark"
        )}>
          {label}
        </Text>
        {value && (
          <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
            {value}
          </Text>
        )}
      </View>
      {showChevron && <ChevronRight size={20} color="#CBD5E1" />}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-8">
            Profile
          </Text>

          {/* Profile Header */}
          <View className="items-center mb-10">
            <View className="relative">
              <Avatar 
                name={user?.username || 'User'} 
                uri={null} 
                size="xl" 
                className="border-4 border-white dark:border-slate-800 shadow-xl"
              />
              <Pressable className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-white dark:border-slate-900">
                <User size={16} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="items-center mt-4">
              <Text className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark">
                {user?.username}
              </Text>
              <Text className="text-text-secondary-light dark:text-text-secondary-dark font-bold uppercase tracking-widest text-[10px] mt-1">
                {user?.role} • Student ID: #4421
              </Text>
            </View>
          </View>

          {/* Account Settings */}
          <Text className="text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-[2px] mb-4 ml-2">
            Account
          </Text>
          <Card className="mb-8">
            <SettingItem icon={User} label="Personal Information" value="Name, Email, Phone" />
            <View className="h-[1px] bg-border-light dark:bg-border-dark mx-4" />
            <SettingItem 
              icon={Shield} 
              label="Linked Devices" 
              value="Manage your active sessions" 
              onPress={() => router.push('/devices')}
            />
            <View className="h-[1px] bg-border-light dark:bg-border-dark mx-4" />
            <SettingItem icon={CreditCard} label="Subscription" value="Pipo Premium" />
          </Card>

          {/* App Settings */}
          <Text className="text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-[2px] mb-4 ml-2">
            Preferences
          </Text>
          <Card className="mb-8">
            <View className="flex-row items-center py-4 px-1">
              <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4">
                <Moon size={20} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  Dark Mode
                </Text>
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                  {mode === 'system' ? 'System Dependent' : mode === 'dark' ? 'Always Dark' : 'Always Light'}
                </Text>
              </View>
              <Switch 
                value={colorScheme === 'dark'} 
                onValueChange={(val) => setMode(val ? 'dark' : 'light')}
                trackColor={{ false: '#E2E8F0', true: '#FF7A00' }}
              />
            </View>
            <View className="h-[1px] bg-border-light dark:bg-border-dark mx-4" />
            <SettingItem icon={Bell} label="Notifications" />
          </Card>

          {/* Support */}
          <Text className="text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-[2px] mb-4 ml-2">
            Help & Support
          </Text>
          <Card className="mb-12">
            <SettingItem icon={CircleHelp} label="Help Center" />
            <View className="h-[1px] bg-border-light dark:bg-border-dark mx-4" />
            <SettingItem 
              icon={LogOut} 
              label="Log Out" 
              destructive 
              showChevron={false}
              onPress={handleLogout}
            />
          </Card>

          <Text className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium mb-8">
            PipoLink Mobile • Version 1.0.0 (Build 42)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
