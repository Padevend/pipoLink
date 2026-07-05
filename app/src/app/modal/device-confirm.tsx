import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/ui/button';

/**
 * Confirmation visuelle après liaison d'un nouvel appareil.
 * Style mat épuré et solide, s'alignant sur l'identité Zinc / Orange.
 */
export default function DeviceConfirmModal() {
  const { name } = useLocalSearchParams<{ qrToken?: string; name?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
      
      {/* Header Minimaliste et Mat */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-900">
        <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Appareil lié
        </Text>
        
        <Pressable 
          onPress={() => router.back()} 
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <X size={16} color="#71717A" />
        </Pressable>
      </View>

      {/* Zone de Contenu Principale Centrée */}
      <View className="flex-1 items-center justify-center px-6 pb-12">
        
        {/* Conteneur Central Opaque et Net */}
        <View className="w-full max-w-sm items-center rounded-2xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-900 dark:bg-zinc-900/40">
          
          {/* Badge d'état de Sécurité - Teintes Vertes d'Opération Réussie */}
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 mb-5">
            <ShieldCheck size={28} color="#10B981" />
          </View>

          {/* Titre d'état */}
          <Text className="text-center text-base font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Association réussie !
          </Text>

          {/* Description textuelle épurée */}
          <Text className="text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400 mb-6 px-1">
            L’appareil{' '}
            <Text className="font-bold text-zinc-900 dark:text-zinc-50">
              {name || 'Nouvel Appareil'}
            </Text>{' '}
            a été configuré et associé de manière sécurisée à votre compte universitaire.
          </Text>

          {/* Bouton de Fermeture Orange Principal */}
          <View className="w-full">
            <Button 
              label="Terminer" 
              onPress={() => router.back()} 
              size="xl"
              className="w-full h-12 rounded-xl bg-orange-500 active:bg-orange-600"
            />
          </View>
          
        </View>
      </View>
    </SafeAreaView>
  );
}