import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Shield, Users, Link } from 'lucide-react-native';

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
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      
      {/* Barre supérieure simple et mate */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-900">
        <Pressable 
          onPress={() => router.replace('/(tabs)')} 
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 active:opacity-70"
        >
          <ArrowLeft size={18} color="#71717A" />
        </Pressable>
        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 ml-3">
          Invitation de groupe
        </Text>
      </View>

      <View className="flex-1 justify-center px-4">
        {!activeToken ? (
          /* ÉCRAN 1 : Saisie ou collage du lien */
          <View className="w-full rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-900 items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 mb-4">
              <Link size={20} color="#FF7A00" />
            </View>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
              Rejoindre avec un lien
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 text-center px-2">
              Collez ci-dessous l'adresse ou le code d'invitation partagé par un membre de votre établissement.
            </Text>

            <TextInput
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="Exemple : https://..."
              placeholderTextColor="#A1A1AA"
              className="w-full h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-sm text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-950 mb-5"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={handleVerifyInput}
              className="w-full h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600"
            >
              <Text className="text-sm font-bold text-white">Vérifier l'invitation</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          /* ÉCRAN 2 : Attente pendant l'analyse */
          <View className="items-center">
            <ActivityIndicator size="small" color="#FF7A00" />
            <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-3">
              Analyse de l'invitation en cours...
            </Text>
          </View>
        ) : inviteDetails ? (
          /* ÉCRAN 3 : Aperçu de la fiche du groupe trouvé */
          <View className="w-full rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-900 items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 mb-4">
              <Users size={24} color="#FF7A00" />
            </View>

            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1 text-center">
              {inviteDetails.chatName}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 text-center">
              {inviteDetails.memberCount} personnes font déjà partie de ce groupe
            </Text>

            {inviteDetails.encryptedChatKey && (
              <View className="flex-row items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-3 py-1 mb-6">
                <Shield size={12} color="#10B981" />
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Espace d'échange sécurisé
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleJoin}
              disabled={isJoining}
              className="w-full h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600 disabled:opacity-50 mb-3"
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">Rejoindre le groupe maintenant</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveToken('');
                setInputUrl('');
              }}
              className="w-full h-10 items-center justify-center rounded-xl active:bg-zinc-50 dark:active:bg-zinc-800"
            >
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Utiliser un autre lien
              </Text>
            </Pressable>
          </View>
        ) : (
          /* ÉCRAN 4 : Message d'erreur */
          <View className="items-center rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-900 w-full">
            <Text className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-6">
              Ce lien n'est pas correct, il a peut-être expiré ou l'accès au groupe a été fermé.
            </Text>
            
            <Pressable
              onPress={() => {
                setActiveToken('');
                setInputUrl('');
              }}
              className="w-full h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600 mb-3"
            >
              <Text className="text-sm font-bold text-white">Réessayer avec un autre lien</Text>
            </Pressable>
            
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="w-full h-10 items-center justify-center rounded-xl active:bg-zinc-50 dark:active:bg-zinc-800"
            >
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Retourner à l'accueil
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}