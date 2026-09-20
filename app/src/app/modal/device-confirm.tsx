import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/shared/ui/button';

export default function DeviceConfirmModal() {
  const { name } = useLocalSearchParams<{ qrToken?: string; name?: string }>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-1 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Validation de l'appareil
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Sécurité & Liaison
          </Text>
        </View>
        
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <X size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* CONTENU PRINCIPAL : Style application mobile immersive */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-start mb-8">
          <Text className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            Association réussie !
          </Text>
          
          <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
            L’appareil <Text className="text-zinc-950 dark:text-white font-black">{name || 'Nouvel Appareil'}</Text> a été configuré et associé de manière sécurisée à votre compte universitaire.
          </Text>
        </View>

        {/* BLOC DE DÉTAILS (Arrondis 2xl, fond plein) */}
        <View className="p-2 mb-8 gap-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Statut</Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Sécurisé & Actif</Text>
          </View>
          <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />
          <View className="flex-row justify-between items-center">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Appareil</Text>
            <Text className="text-xs font-bold text-zinc-950 dark:text-white" numberOfLines={1}>{name || 'Nouvel Appareil'}</Text>
          </View>
        </View>

        {/* BOUTON D'ACTION PRINCIPAL (rounded-full) */}
        <Button 
          label="Terminer" 
          onPress={() => router.back()} 
          size="lg"
          className="w-full h-14 rounded-full bg-orange-500 active:bg-orange-600"
        />
      </ScrollView>
    </SafeAreaView>
  );
}