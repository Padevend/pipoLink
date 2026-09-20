import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
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

const ORANGE_PRINCIPAL = '#F97316';

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

  if (!activeConversation && (isConversationsLoading || isUserLoading)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#0A0A0A]">
        <ActivityIndicator size="large" color={ORANGE_PRINCIPAL} />
      </SafeAreaView>
    );
  }

  if (!activeConversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8 dark:bg-[#0A0A0A]">
        <View className="w-full max-w-sm items-center justify-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
            <MessageSquareOff size={24} color={ORANGE_PRINCIPAL} strokeWidth={2.5} />
          </View>

          <Text className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white text-center">
            Discussion Introuvable
          </Text>

          <Text className="mt-2 text-center text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400 px-4">
            Cet échange n'existe pas ou vous n'avez plus les droits d'accès pour consulter ces messages.
          </Text>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-zinc-100 px-6 py-3.5 dark:bg-[#1A1A1A] active:opacity-80"
          >
            <ArrowLeft size={16} color="#F97316" strokeWidth={2.5} />
            <Text className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
              Retour aux messages
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>
      {/* Header Néo-banque plat : text moins gros, bordures discrètes, boutons arrondis full */}
      <View className="z-10 flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-[#0A0A0A]">
        <View className="flex-row flex-1 items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center gap-2.5"
            onPress={() => {
              setMenuOpen(false);
              if (activeConversation.type === 'group') {
                router.push(`/group/${id}` as any);
              } else {
                router.push(`/user/${otherMembers[0]?.id}`);
              }
            }}
          >
            <Avatar name={chatName} uri={chatAvatar} size="sm" role={userAccountRole} />

            <View className="flex-1 justify-center">
              <Text
                className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
                numberOfLines={1}
              >
                {chatName}
              </Text>

              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  activeConversation?.type === 'group' ? "bg-orange-500" : "bg-zinc-400"
                )} />
                <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {activeConversation?.type === 'group' ? 'Canal de groupe' : 'Discussion privée'}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          {userPhone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${userPhone}`)}
              className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
            >
              <Phone size={18} color="#F97316" strokeWidth={2.5} />
            </Pressable>
          )}

          <View className="relative">
            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
            >
              <EllipsisVertical size={18} color="#F97316" strokeWidth={2.5} />
            </Pressable>

            {menuOpen && (
              <>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  className="absolute inset-0 z-40 bg-transparent"
                  style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
                />
                {/* Dropdown : Coins standards (pas rounded-full), style plat néo-banque */}
                <View className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white p-2 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 gap-y-1">
                  <Pressable
                    onPress={() => {
                      setMenuOpen(false);
                      if (activeConversation.type === 'group') {
                        router.push(`/group/${id}` as any);
                      } else {
                        router.push(`/user/${otherMembers[0]?.id}`);
                      }
                    }}
                    className="flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 bg-zinc-50 dark:bg-[#222222] active:opacity-80"
                  >
                    <Info size={16} color="#F97316" strokeWidth={2.5} />
                    <Text className="text-xs font-bold text-zinc-950 dark:text-white">Voir les informations</Text>
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
                      className="flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 bg-red-50 dark:bg-red-950/30 active:opacity-80"
                    >
                      <LogOut size={16} color="#EF4444" strokeWidth={2.5} />
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
                      className="flex-row items-center gap-2.5 rounded-xl px-3 py-2.5 bg-red-50 dark:bg-red-950/30 active:opacity-80"
                    >
                      <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                      <Text className="text-xs font-bold text-red-500">Supprimer l'échange</Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <ChatView conversation={activeConversation} />
    </SafeAreaView>
  );
}