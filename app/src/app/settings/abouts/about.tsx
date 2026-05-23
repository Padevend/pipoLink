import { ScrollView, Text, View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Globe, 
  Shield, 
  BookOpen, 
  Cpu, 
  Users, 
  Bell, 
  WifiOff,
  Disc
} from 'lucide-react-native';

import { AppLogo } from '@/shared/ui/app-logo';
import { BRAND } from '@/shared/config/brand';

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
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Pur (Sans Shadow) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} color="#64748B" />
        </Pressable>
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {t('about')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 28, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1 : LOGO & IDENTITY */}
        <View className="items-center mb-8">
          <AppLogo size="lg" showWordmark />
          
          <View className="mt-4 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5">
            <Text className="text-[11px] font-bold tracking-wider text-primary uppercase">
              Version {version}
            </Text>
          </View>
          
          <Text className="mt-4 text-center text-[13px] leading-[22px] font-medium text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4">
            PipoLink is a secure, offline-first academic messaging platform with end-to-end encryption and multi-device support.
          </Text>
        </View>

        {/* SECTION 2 : SITE OFFICIEL */}
        <Pressable 
          onPress={() => void openUrl('https://pipolink.lyrastudio.org')}
          className="mb-8 flex-row items-center justify-between rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 active:scale-[0.99] transition-all"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Globe size={16} color={BRAND.primary} />
            </View>
            <View>
              <Text className="text-[13px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Site officiel
              </Text>
              <Text className="text-[11px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/50 mt-0.5">
                pipolink.lyrastudio.org
              </Text>
            </View>
          </View>
        </Pressable>

        {/* SECTION 3 : FONCTIONNALITÉS CLÉS */}
        <Text className="mb-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Fonctionnalités clés
        </Text>
        
        <View className="gap-3 mb-8">
          {FEATURES.map((feat) => {
            const IconComponent = ICON_MAP[feat.id as keyof typeof ICON_MAP] || Shield;
            return (
              <View 
                key={feat.id}
                className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md flex-row gap-4"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                  <IconComponent size={16} color={BRAND.primary} />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                    {feat.title}
                  </Text>
                  <Text className="mt-1 text-[12px] leading-[18px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                    {feat.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* SECTION 4 : RÉSEAUX SOCIAUX */}
        <Text className="mb-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Communauté & Réseaux
        </Text>

        <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
          {SOCIALS.map((social, index) => {
            const SocialIcon = social.icon;
            return (
              <View key={social.label}>
                {index > 0 && <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />}
                <Pressable
                  onPress={() => void openUrl(social.href)}
                  className="flex-row items-center justify-between px-4 py-3.5 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 transition-all active:scale-[0.99]"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-text-secondary-light/5 border border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10">
                      <SocialIcon size={14} color="#64748B" />
                    </View>
                    <Text className="text-[13px] font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {social.label}
                    </Text>
                  </View>
                  <Text className="text-[11px] font-medium text-text-secondary-light/40 dark:text-text-secondary-dark/40">
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