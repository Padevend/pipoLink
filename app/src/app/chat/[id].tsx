import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { conversationKeys, useConversations } from '@/entities/conversation/hooks';
import { useGetUser } from '@/features/auth/hooks/use-user';
import { ChatView } from '@/features/messaging/components/chat-view';
import { queryClient, useAuth } from '@/providers';
import { messagingApi } from '@/shared/api/messaging';
import { Avatar } from '@/shared/ui/avatar';
import { cn } from '@/shared/utils/cn';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ArrowLeft, EllipsisVertical, Info, LogOut, MessageSquareOff, Phone, Trash2 } from 'lucide-react-native';

const ORANGE_PRINCIPAL = '#FF6B00';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: conversations, isLoading: isConversationsLoading } = useConversations();
  const [menuOpen, setMenuOpen] = useState(false);

  const conversation = conversations?.find((c) => c.id === id);

  const { data: targetUser, isLoading: isUserLoading } = useGetUser(!conversation && !isConversationsLoading ? id || '' : '');

  const mockConversation = useMemo(() => {
    if (!targetUser) return undefined;
    const name = targetUser.profile?.firstname || targetUser.profile?.lastname
      ? `${targetUser.profile.firstname ?? ''} ${targetUser.profile.lastname ?? ''}`.trim()
      : (targetUser.username ?? '');

    return {
      id: targetUser.id,
      type: 'private' as const,
      name: name,
      avatarUrl: targetUser.profile?.avatarUrl ?? undefined,
      members: [
        { id: user?.id ?? '', username: user?.username ?? '' },
        {
          id: targetUser.id,
          username: targetUser.username ?? '',
          avatarUrl: targetUser.profile?.avatarUrl ?? undefined,
          phone: targetUser.profile?.phone ?? undefined,
          accountRole: targetUser.accountRole,
        }
      ],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      isPending: true,
      recipientUserId: targetUser.id,
    };
  }, [targetUser, user]);

  const activeConversation = conversation || mockConversation;

  const otherMembers = useMemo(() => {
    if (!activeConversation) return [];
    return activeConversation.members.filter(m => m.id !== user?.id);
  }, [activeConversation, user?.id]);

  const chatName = useMemo(() => {
    if (!activeConversation) return '';
    if (activeConversation.type === "group") {
      return activeConversation.name || 'Groupe';
    }
    const otherMember = otherMembers[0];
    return otherMember?.username || activeConversation.name || 'Privé';
  }, [activeConversation, otherMembers]);

  const userPhone = useMemo(() => {
    if (!activeConversation || activeConversation.type === "group") return null;
    const otherMember = otherMembers[0];
    return otherMember?.phone || null;
  }, [activeConversation, otherMembers]);

  const chatAvatar = useMemo(() => {
    if (!activeConversation) return undefined;
    if (activeConversation.type === "group") {
      return activeConversation.avatarUrl;
    }
    const otherMember = otherMembers[0];
    return otherMember?.avatarUrl;
  }, [activeConversation, otherMembers]);

  const userAccountRole = useMemo(() => {
    if (activeConversation?.type === 'group') {
      return null;
    }
    const otherMember = activeConversation?.members.find((m) => m.id !== user?.id);
    return otherMember?.accountRole;
  }, [activeConversation, user?.id]);

  // ÉCRAN 1 : Attente du chargement
  if (!activeConversation && (isConversationsLoading || isUserLoading)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="small" color={ORANGE_PRINCIPAL} />
      </SafeAreaView>
    );
  }

  // ÉCRAN 2 : Erreur / Discussion introuvable
  if (!activeConversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8 dark:bg-zinc-950">
        <View className="w-full max-w-sm items-center justify-center">

          {/* Illustration centrale géométrique */}
          <View className="mb-6 h-14 w-14 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40">
            <MessageSquareOff size={22} color={ORANGE_PRINCIPAL} />
          </View>

          <Text className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 text-center">
            Discussion Introuvable
          </Text>

          <Text className="mt-2 text-center text-xs font-medium leading-relaxed text-zinc-400 dark:text-zinc-500 px-4">
            Cet échange n'existe pas ou vous n'avez plus les droits d'accès pour consulter ces messages.
          </Text>

          {/* Bouton de retour strict */}
          <Pressable
            onPress={() => router.back()}
            className="mt-8 flex-row items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950 active:bg-zinc-50 dark:active:bg-zinc-900"
          >
            <ArrowLeft size={14} color="#A1A1AA" />
            <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Retour aux messages
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ÉCRAN INTERFACE PRINCIPALE
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* Barre supérieure d'en-tête (Header) de discussion */}
      <View className="z-10 flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row flex-1 items-center gap-3">

          {/* Retour flèche */}
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
          >
            <ArrowLeft size={16} color="#A1A1AA" />
          </Pressable>

          <View className="">
            <Avatar name={chatName} uri={chatAvatar} size="sm" role={userAccountRole} />
          </View>

          <View className="flex-1 justify-center">
            <Text
              className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50"
              numberOfLines={1}
            >
              {chatName}
            </Text>

            {/* Catégorie technique du chat */}
            <View className="flex-row items-center gap-1 mt-0.5">
              <View className={cn(
                "h-1.5 w-1.5 rounded-full",
                activeConversation?.type === 'group' ? "bg-orange-500" : "bg-zinc-400 dark:bg-zinc-500"
              )} />
              <Text className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {activeConversation?.type === 'group' ? 'Canal // Groupe' : 'Canal // Privé'}
              </Text>
            </View>
          </View>
        </View>

        {/* Boutons d'outils du haut */}
        <View className="flex-row items-center gap-2">
          {userPhone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${userPhone}`)}
              className="h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
            >
              <Phone size={16} color="#A1A1AA" />
            </Pressable>
          )}

          <View className="relative">
            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              className="h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 active:opacity-70"
            >
              <EllipsisVertical size={16} color="#A1A1AA" />
            </Pressable>

            {/* Menu dépliant (sans aucune ombre ni transparence) */}
            {menuOpen && (
              <>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  className="absolute right-0 inset-0 z-40 bg-transparent"
                  style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
                />
                <View className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
                  <Pressable
                    onPress={() => {
                      setMenuOpen(false);
                      if (activeConversation.type === 'group') {
                        router.push(`/group/${id}` as any);
                      } else {
                        router.push(`/user/${otherMembers[0]?.id}`);
                      }
                    }}
                    className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 active:bg-zinc-50 dark:active:bg-zinc-900"
                  >
                    <Info size={14} color="#A1A1AA" />
                    <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Voir les informations</Text>
                  </Pressable>

                  {activeConversation?.type === 'group' ? (
                    <Pressable
                      onPress={async () => {
                        setMenuOpen(false);
                        try {
                          await messagingApi.leaveGroup(id!);
                          queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
                          router.replace('/(tabs)');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-900 active:bg-red-500/5"
                    >
                      <LogOut size={14} color="#EF4444" />
                      <Text className="text-xs font-bold text-red-500">Quitter le groupe</Text>
                    </Pressable>
                  ) : !activeConversation?.isPending ? (
                    <Pressable
                      onPress={async () => {
                        setMenuOpen(false);
                        try {
                          await messagingApi.deleteChat(id!);
                          queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
                          router.replace('/(tabs)');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-900 active:bg-red-500/5"
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text className="text-xs font-bold text-red-500">Supprimer l'échange</Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Zone principale des messages de discussion */}
      <ChatView conversation={activeConversation} />
    </SafeAreaView>
  );
}