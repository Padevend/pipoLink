import { RegisterForm } from '@/features/auth/components/register-form';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        {/* Bouton Retour Géométrique Mat */}
        <Pressable 
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        
        {/* Bloc Titre & Sous-titre Contextuel */}
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inscription
          </Text>
          <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            Nouveau compte étudiant
          </Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-4 pt-6 pb-10">
          
          {/* Section d'accueil textuelle épurée */}
          <View className="mb-6">
            <Text className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Rejoignez votre communauté
            </Text>
            <Text className="text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500 mt-2">
              Accédez à vos cours, vos notes et vos services académiques en quelques instants.
            </Text>
          </View>

          {/* Formulaire d'inscription (Structure Mat Intégrée) */}
          <View className="w-full">
            <RegisterForm />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}