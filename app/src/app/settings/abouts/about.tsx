import Constants from 'expo-constants';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Cpu,
  Disc,
  Globe,
  Shield,
  Users,
  WifiOff
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/shared/ui/app-logo';
import { router } from 'expo-router';

const ICON_MAP = {
  1: Shield,
  2: BookOpen,
  3: Cpu,
  4: Users,
  5: Bell,
  6: WifiOff,
};

const SOCIALS = [
  { label: 'WhatsApp', href: 'https://chat.whatsapp.com/DSVfiwNBfcTKdwCQ6MEBNh?s=cl&p=a&mlu=1', icon: Disc }
];

const FEATURES = [
  {
    id: 1,
    title: "Messagerie Sécurisée",
    description: "Échangez avec vos camarades et enseignants via un chiffrement de bout en bout (E2E) garantissant une confidentialité totale.",
  },
  {
    id: 2,
    title: "Bibliothèque Académique",
    description: "Accédez à des milliers de documents (cours, TD, examens) classés par niveau et par unité d'enseignement.",
  },
  {
    id: 3,
    title: "Assistant IA Étudiant",
    description: "Un assistant intelligent capable de répondre à vos questions académiques et de vous aider dans vos révisions.",
  },
  {
    id: 4,
    title: "Groupes d'Étude",
    description: "Créez ou rejoignez des groupes de travail collaboratifs pour progresser ensemble sur vos projets.",
  },
  {
    id: 5,
    title: "Annonces Officielles",
    description: "Ne manquez aucune information importante de votre établissement grâce aux canaux de diffusion certifiés.",
  },
  {
    id: 6,
    title: "Mode Hors-ligne",
    description: "Consultez vos documents téléchargés même sans connexion internet, idéal pour les zones à faible couverture.",
  },
];

export default function AboutScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const insets = useSafeAreaInsets();
  
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Néo-banque, Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            À propos
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Informations & Application
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION 1 : LOGO & IDENTITY (Arrondis 2xl, fond plein) */}
        <View className="items-center mb-8 rounded-2xl bg-zinc-100 p-8 dark:bg-[#1A1A1A]">
          <AppLogo size="lg" showWordmark />
          
          <View className="mt-4 rounded-full bg-orange-500 px-4 py-1.5">
            <Text className="text-[10px] font-black tracking-widest text-white uppercase">
              Version {version}
            </Text>
          </View>
          
          <Text className="mt-4 text-center text-xs font-bold leading-relaxed text-zinc-600 dark:text-zinc-300">
            PipoLink is a secure, offline-first academic messaging platform with end-to-end encryption and multi-device support.
          </Text>
        </View>

        {/* SECTION 2 : SITE OFFICIEL (Arrondis 2xl, fond plein) */}
        <Pressable 
          onPress={() => void openUrl('https://pipolink.lyrastudio.org')}
          className="mb-8 flex-row items-center justify-between rounded-2xl bg-zinc-100 p-5 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <View className="flex-row items-center gap-4 flex-1 pr-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
              <Globe size={20} color="#F97316" strokeWidth={2.5} />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                Site officiel
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
                pipolink.lyrastudio.org
              </Text>
            </View>
          </View>
        </Pressable>

        {/* SECTION 3 : FONCTIONNALITÉS CLÉS */}
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Fonctionnalités clés
        </Text>
        
        <View className="gap-y-4 mb-8">
          {FEATURES.map((feat) => {
            const IconComponent = ICON_MAP[feat.id as keyof typeof ICON_MAP] || Shield;
            return (
              <View 
                key={feat.id}
                className="rounded-2xl bg-zinc-100 p-5 dark:bg-[#1A1A1A] flex-row gap-x-4 items-center"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#222222] shrink-0">
                  <IconComponent size={20} color="#F97316" strokeWidth={2.5} />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                    {feat.title}
                  </Text>
                  <Text className="mt-1 text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {feat.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* SECTION 4 : RÉSEAUX SOCIAUX */}
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Communauté & Réseaux
        </Text>

        <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
          {SOCIALS.map((social, index) => {
            const SocialIcon = social.icon;
            return (
              <View key={social.label}>
                {index > 0 && <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />}
                <Pressable
                  onPress={() => void openUrl(social.href)}
                  className="flex-row items-center justify-between p-4 active:opacity-80 transition-opacity"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                      <SocialIcon size={18} color="#F97316" strokeWidth={2.5} />
                    </View>
                    <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                      {social.label}
                    </Text>
                  </View>
                  <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      Rejoindre
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}