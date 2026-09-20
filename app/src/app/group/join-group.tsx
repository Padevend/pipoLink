import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Shield, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConversations } from '@/entities/conversation/hooks';
import { useToast } from '@/providers';
import { messagingApi } from '@/shared/api/messaging';
import { userApi } from '@/shared/api/user';
import {
  cacheChatKey,
  decryptChatKeyWithToken,
  encryptChatKeyForDevice,
} from '@/shared/crypto/chat-key';

const extractToken = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.includes('://') || trimmed.startsWith('http')) {
      const url = new URL(trimmed);
      const parsedToken = url.searchParams.get('token');
      if (parsedToken) return parsedToken;
    }
  } catch (e) {}
  if (trimmed.includes('token=')) {
    const parts = trimmed.split('token=');
    if (parts[1]) {
      return parts[1].split('&')[0];
    }
  }
  return trimmed;
};

export default function JoinGroupScreen() {
  const { token: paramToken } = useLocalSearchParams<{ token?: string }>();
  const { showToast } = useToast();
  const { data: conversations, refetch: refetchConversations } = useConversations();
  const insets = useSafeAreaInsets();

  const [activeToken, setActiveToken] = useState(paramToken || '');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{
    chatId: string;
    chatName: string;
    memberCount: number;
    encryptedChatKey: string | null;
  } | null>(null);

  useEffect(() => {
    if (!activeToken) {
      setInviteDetails(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loadDetails = async () => {
      try {
        const details = await messagingApi.getInvitationDetails(activeToken);
        setInviteDetails(details);

        const alreadyMember = conversations?.some((c) => c.id === details.chatId);
        if (alreadyMember) {
          showToast({ message: 'Vous faites déjà partie de ce groupe.', type: 'info' });
          router.replace(`/chat/${details.chatId}` as any);
        }
      } catch (e: any) {
        showToast({
          message: "Cette invitation ne semble plus valide.",
          type: 'error',
        });
        setInviteDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [activeToken, conversations]);

  const handleVerifyInput = () => {
    const token = extractToken(inputUrl);
    if (!token) {
      showToast({ message: 'Veuillez coller un lien de groupe valide.', type: 'error' });
      return;
    }
    setActiveToken(token);
  };

  const handleJoin = async () => {
    if (!inviteDetails || !activeToken) return;
    setIsJoining(true);

    try {
      let encryptedKeys: { deviceId: string; encryptedKey: string }[] = [];

      if (inviteDetails.encryptedChatKey) {
        const chatKey = decryptChatKeyWithToken(inviteDetails.encryptedChatKey, activeToken);
        if (chatKey) {
          const keys = await userApi.listDevicePublicKeys('me');
          encryptedKeys = await Promise.all(
            keys.map(async ({ deviceId, publicKey }) => ({
              deviceId,
              encryptedKey: await encryptChatKeyForDevice(chatKey, publicKey),
            }))
          );

          await cacheChatKey(inviteDetails.chatId, chatKey);
          chatKey.fill(0);
        }
      }

      await messagingApi.joinViaInvitation(activeToken, { encryptedKeys });
      await refetchConversations();

      showToast({ message: 'Bienvenue dans le groupe !', type: 'success' });
      router.replace(`/chat/${inviteDetails.chatId}` as any);
    } catch (e: any) {
      showToast({ message: 'Impossible de rejoindre la discussion pour le moment.', type: 'error' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable 
          onPress={() => router.replace('/(tabs)')} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Invitation de groupe
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Accès sécurisé
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!activeToken ? (
          /* ÉCRAN 1 : Saisie ou collage du lien (Style application mobile immersive) */
          <View className="w-full">
            <View className="items-start mb-8">
              <Text className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white text-center">
                Rejoindre avec un lien
              </Text>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-2 text-start leading-relaxed">
                Collez ci-dessous l'adresse ou le code d'invitation partagé par un membre de votre établissement.
              </Text>
            </View>

            <View className="gap-y-6 mb-8">
              <View className="gap-y-2">
                <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Lien ou Code d'invitation
                </Text>
                <TextInput
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  placeholder="Exemple : https://..."
                  placeholderTextColor="#A1A1AA"
                  className="w-full h-14 bg-zinc-100 dark:bg-[#1A1A1A] rounded-full px-6 text-sm font-bold text-zinc-950 dark:text-white"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <Pressable
              onPress={handleVerifyInput}
              className="w-full h-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
            >
              <Text className="text-xs font-black uppercase tracking-widest text-white">
                Vérifier l'invitation
              </Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          /* ÉCRAN 2 : Attente pendant l'analyse */
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-6">
              Analyse de l'invitation en cours…
            </Text>
          </View>
        ) : inviteDetails ? (
          /* ÉCRAN 3 : Aperçu de la fiche du groupe trouvé */
          <View className="w-full items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-5">
              <Users size={32} color="#F97316" strokeWidth={2.5} />
            </View>

            <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white mb-2 text-center">
              {inviteDetails.chatName}
            </Text>
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6 text-center">
              {inviteDetails.memberCount} personne{inviteDetails.memberCount > 1 ? 's' : ''} active{inviteDetails.memberCount > 1 ? 's' : ''}
            </Text>

            {inviteDetails.encryptedChatKey && (
              <View className="flex-row items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-4 py-2 mb-8 border border-emerald-500/20">
                <Shield size={14} color="#10B981" strokeWidth={2.5} />
                <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Espace d'échange sécurisé
                </Text>
              </View>
            )}

            <View className="w-full gap-y-4">
              <Pressable
                onPress={handleJoin}
                disabled={isJoining}
                className="w-full h-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-black uppercase tracking-widest text-white">
                    Rejoindre le groupe maintenant
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setActiveToken('');
                  setInputUrl('');
                }}
                className="w-full h-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                  Utiliser un autre lien
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ÉCRAN 4 : Message d'erreur */
          <View className="w-full items-center py-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-5">
              <Users size={32} color="#EF4444" strokeWidth={2.5} />
            </View>

            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white mb-2 text-center">
              Invitation invalide
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mb-8 leading-relaxed px-4">
              Ce lien n'est pas correct, il a peut-être expiré ou l'accès au groupe a été fermé.
            </Text>
            
            <View className="w-full gap-y-4">
              <Pressable
                onPress={() => {
                  setActiveToken('');
                  setInputUrl('');
                }}
                className="w-full h-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-white">
                  Réessayer avec un autre lien
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                className="w-full h-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                  Retourner à l'accueil
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}