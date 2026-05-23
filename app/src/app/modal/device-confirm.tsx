import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/ui/button';
import { BRAND } from '@/shared/config/brand';

/**
 * Confirmation visuelle après liaison d'un nouvel appareil.
 * Style épuré Glassmorphism sans ombrage.
 */
export default function DeviceConfirmModal() {
  const { name } = useLocalSearchParams<{ qrToken?: string; name?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'bottom']}>
      
      {/* Header Translucide Style Glassmorphism (Sans Shadow) */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/20 bg-surface-light/75 px-5 py-4 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Appareil lié
        </Text>
        
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <X size={18} color="#64748B" />
        </Pressable>
      </View>

      {/* Zone de Contenu Principale */}
      <View className="flex-1 items-center justify-center px-6 pb-12">
        
        {/* Conteneur Central Satiné */}
        <View className="w-full max-w-sm items-center rounded-3xl border border-border-light/40 bg-surface-light/50 p-8 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
          
          {/* Badge d'état de Sécurité */}
          <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10 border border-primary/20 mb-6">
            <ShieldCheck size={38} color={BRAND.primary} />
          </View>

          {/* Titre d'état */}
          <Text className="text-center text-[18px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark mb-3">
            Association réussie !
          </Text>

          {/* Description textuelle */}
          <Text className="text-center text-[13px] leading-[20px] font-medium text-text-secondary-light/70 dark:text-text-secondary-dark/60 mb-8 px-2">
            L’appareil{' '}
            <Text className="font-bold text-primary">
              {name || 'Nouvel Appareil'}
            </Text>{' '}
            a été configuré et associé de manière sécurisée à votre compte universitaire.
          </Text>

          {/* Bouton d'action principal de fermeture */}
          <View className="w-full">
            <Button 
              label="Terminer" 
              onPress={() => router.back()} 
              size="xl"
              className="w-full rounded-xl"
            />
          </View>
          
        </View>
      </View>
    </SafeAreaView>
  );
}