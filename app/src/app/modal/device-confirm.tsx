import React from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLinkDevice } from '@/features/devices/hooks/use-link-device';
import { Button } from '@/shared/ui/button';
import { Shield, Smartphone, X } from 'lucide-react-native';
import { useToast } from '@/shared/hooks/use-toast';

export default function DeviceConfirmModal() {
  const { qrToken, name } = useLocalSearchParams<{ qrToken: string; name: string }>();
  const { showToast } = useToast();
  const mutation = useLinkDevice();

  const handleApprove = async () => {
    if (!qrToken) return;
    
    try {
      await mutation.mutateAsync(qrToken);
      showToast({ type: 'success', message: 'Device successfully linked!' });
      router.back();
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Failed to link device' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
          Security Check
        </Text>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 items-center justify-center gap-10">
        <View className="w-24 h-24 bg-primary/10 rounded-[32px] items-center justify-center">
          <Shield size={48} color="#FF7A00" />
        </View>

        <View className="items-center gap-2">
          <Text className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark text-center">
            Link New Device?
          </Text>
          <Text className="text-text-secondary-light dark:text-text-secondary-dark text-center px-8 leading-6">
            An external device named <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{name || 'Unknown Device'}</Text> is requesting access to your account.
          </Text>
        </View>

        <View className="w-full gap-4">
          <Button 
            label="Approve & Link"
            onPress={handleApprove}
            loading={mutation.isPending}
            size="xl"
          />
          <Button 
            label="Deny Request"
            variant="ghost"
            onPress={() => router.back()}
            size="lg"
            className="text-error"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
