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
  
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable 
          onPress={() => router.back()} 
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          À propos
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1 : LOGO & IDENTITY */}
        <View className="items-center mb-6">
          <AppLogo size="lg" showWordmark />
          
          <View className="mt-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 px-2.5 py-0.5">
            <Text className="text-[9px] font-bold tracking-wider text-orange-600 dark:text-orange-400 uppercase">
              Version {version}
            </Text>
          </View>
          
          <Text className="mt-3.5 text-center text-xs leading-5 font-semibold text-zinc-400 dark:text-zinc-500 px-4">
            PipoLink is a secure, offline-first academic messaging platform with end-to-end encryption and multi-device support.
          </Text>
        </View>

        {/* SECTION 2 : SITE OFFICIEL */}
        <Pressable 
          onPress={() => void openUrl('https://pipolink.lyrastudio.org')}
          className="mb-5 flex-row items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-900 dark:bg-zinc-950 active:bg-zinc-50 dark:active:bg-zinc-900/50"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50">
              <Globe size={14} color="#F97316" />
            </View>
            <View>
              <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Site officiel
              </Text>
              <Text className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                pipolink.lyrastudio.org
              </Text>
            </View>
          </View>
        </Pressable>

        {/* SECTION 3 : FONCTIONNALITÉS CLÉS */}
        <Text className="mb-2 ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Fonctionnalités clés
        </Text>
        
        <View className="gap-y-3 mb-5">
          {FEATURES.map((feat) => {
            const IconComponent = ICON_MAP[feat.id as keyof typeof ICON_MAP] || Shield;
            return (
              <View 
                key={feat.id}
                className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-900 dark:bg-zinc-950 flex-row gap-x-3.5"
              >
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50 shrink-0">
                  <IconComponent size={14} color="#F97316" />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {feat.title}
                  </Text>
                  <Text className="mt-1 text-[11px] leading-4 font-semibold text-zinc-400 dark:text-zinc-500">
                    {feat.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* SECTION 4 : RÉSEAUX SOCIAUX */}
        <Text className="mb-2 ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Communauté & Réseaux
        </Text>

        <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          {SOCIALS.map((social, index) => {
            const SocialIcon = social.icon;
            return (
              <View key={social.label}>
                {index > 0 && <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />}
                <Pressable
                  onPress={() => void openUrl(social.href)}
                  className="flex-row items-center justify-between px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-900/50"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                      <SocialIcon size={14} color="#71717A" />
                    </View>
                    <Text className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {social.label}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    Rejoindre
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}