import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  Check,
  Link2,
  Shield,
  ShieldAlert,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react-native';

import {
  useConversations,
  useUpdateGroupDetails,
  usePromoteMember,
  useDemoteMember,
  useKickMember,
  useGroupInvitations,
  useCreateGroupInvitation,
  useRevokeGroupInvitation,
} from '@/entities/conversation/hooks';
import { useAuth, useToast } from '@/providers';
import { getCachedChatKey, encryptChatKeyWithToken } from '@/shared/crypto/chat-key';
import { Avatar } from '@/shared/ui/avatar';
import AddLinkModal from '@/features/group/ui/modal';
import InviationLinkCard from '@/features/group/ui/card';
import { cn } from '@/shared/utils/cn';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: conversations, isLoading: isConversationsLoading } = useConversations();

  const conversation = useMemo(() => {
    return conversations?.find((c) => c.id === id);
  }, [conversations, id]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [maxUses, setMaxUses] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');

  const updateDetails = useUpdateGroupDetails();
  const promoteMember = usePromoteMember();
  const demoteMember = useDemoteMember();
  const kickMember = useKickMember();
  const createInvite = useCreateGroupInvitation();
  const revokeInvite = useRevokeGroupInvitation();

  const { data: invitations, isLoading: isInvitesLoading } = useGroupInvitations(id || '');

  const meInMembers = useMemo(() => {
    return conversation?.members.find((m) => m.id === user?.id);
  }, [conversation, user?.id]);

  const myRole = meInMembers?.role;
  const isCreator = conversation?.created_by_id === user?.id;
  const isAdmin = myRole === 'admin' || isCreator;

  React.useEffect(() => {
    if (conversation?.name) {
      setGroupName(conversation.name);
    }
  }, [conversation]);

  if (isConversationsLoading || !conversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <ActivityIndicator size="small" color="#FF7A00" />
      </SafeAreaView>
    );
  }

  const handleSaveName = async () => {
    if (!groupName.trim()) {
      showToast({ message: 'Le nom du groupe ne peut pas être vide.', type: 'error' });
      return;
    }
    try {
      await updateDetails.mutateAsync({ chatId: conversation.id, name: groupName });
      setIsEditingName(false);
      showToast({ message: 'Nom du groupe mis à jour !', type: 'success' });
    } catch (e: any) {
      showToast({ message: 'Impossible de modifier le nom.', type: 'error' });
    }
  };

  const handlePromote = (targetUserId: string, username: string) => {
    Alert.alert(
      'Nommer responsable',
      `Accorder les droits d'administration à ${username} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              await promoteMember.mutateAsync({ chatId: conversation.id, targetUserId });
              showToast({ message: `${username} est désormais gestionnaire.`, type: 'success' });
            } catch (e: any) {
              showToast({ message: 'Erreur lors du changement de rôle.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleDemote = (targetUserId: string, username: string) => {
    Alert.alert(
      'Retirer les droits',
      `Retirer les privilèges de gestion de ${username} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await demoteMember.mutateAsync({ chatId: conversation.id, targetUserId });
              showToast({ message: `${username} n'est plus gestionnaire.`, type: 'success' });
            } catch (e: any) {
              showToast({ message: 'Erreur lors du changement de rôle.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleKick = (targetUserId: string, username: string) => {
    Alert.alert(
      'Exclure le membre',
      `Retirer définitivement ${username} du groupe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exclure',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickMember.mutateAsync({ chatId: conversation.id, targetUserId });
              showToast({ message: `${username} a été retiré.`, type: 'success' });
            } catch (e: any) {
              showToast({ message: 'Impossible de retirer ce membre.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleCreateInvite = async () => {
    try {
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const chatKey = await getCachedChatKey(conversation.id);

      let encryptedChatKey: string | undefined;
      if (chatKey) {
        encryptedChatKey = encryptChatKeyWithToken(chatKey, token);
      }

      const parsedMaxUses = maxUses ? parseInt(maxUses, 10) : undefined;
      let expiresAt: string | undefined;
      if (expiresInHours) {
        const date = new Date();
        date.setHours(date.getHours() + parseFloat(expiresInHours));
        expiresAt = date.toISOString();
      }

      await createInvite.mutateAsync({
        chatId: conversation.id,
        maxUses: parsedMaxUses,
        expiresAt,
        encryptedChatKey,
      });

      setInviteModalVisible(false);
      setMaxUses('');
      setExpiresInHours('');
      showToast({ message: "Le lien d'invitation est prêt !", type: 'success' });
    } catch (e: any) {
      showToast({ message: "Impossible de créer le lien d'invitation.", type: 'error' });
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = Linking.createURL('/join-group', { queryParams: { token } });
    await Clipboard.setStringAsync(url);
    showToast({ message: 'Lien copié dans votre presse-papiers.', type: 'success' });
  };

  const handleRevokeLink = (invitationId: string) => {
    Alert.alert(
      'Désactiver le lien',
      `Si vous supprimez ce lien, plus personne ne pourra l'utiliser pour rejoindre l'équipe.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInvite.mutateAsync({ invitationId, chatId: conversation.id });
              showToast({ message: "Lien d'accès supprimé.", type: 'success' });
            } catch (e: any) {
              showToast({ message: 'Erreur lors de la suppression.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      
      {/* Barre supérieure */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-900">
        <Pressable 
          onPress={() => router.back()} 
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 active:opacity-70"
        >
          <ArrowLeft size={18} color="#71717A" />
        </Pressable>
        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          Options de groupe
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        
        {/* CARTE 1 : Identité et En-tête du groupe */}
        <View className="items-center bg-white border border-zinc-100 rounded-2xl p-6 dark:bg-zinc-900 dark:border-zinc-900 mb-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 mb-3">
            <Users size={26} color="#FF7A00" />
          </View>

          {isEditingName ? (
            <View className="w-full flex-row items-center gap-2 mt-1">
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Nommez votre groupe..."
                placeholderTextColor="#A1A1AA"
                className="flex-1 h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                autoFocus
              />
              <Pressable
                onPress={handleSaveName}
                className="h-11 w-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600"
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : (
            <View className="items-center w-full">
              <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50 text-center px-2">
                {conversation.name}
              </Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Discussion • {conversation.members.length} participants
              </Text>

              {isAdmin && (
                <Pressable
                  onPress={() => setIsEditingName(true)}
                  className="mt-4 rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 px-4 py-2 active:bg-zinc-100"
                >
                  <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Modifier le nom
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* CARTE 2 : Section Liens d'invitations */}
        {isAdmin && (
          <View className="bg-white border border-zinc-100 rounded-2xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-900 mb-4">
            <Pressable
              onPress={() => setInviteModalVisible(true)}
              className="flex-row items-center px-4 py-4 border-b border-zinc-50 dark:border-zinc-800/60 active:bg-zinc-50/50"
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-500">
                <Link2 size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Créer un lien d'invitation
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Partager l'accès ou révoquer des liens
                </Text>
              </View>
            </Pressable>

            {/* Zone interne de la liste des liens actifs */}
            <View className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/20">
              {isInvitesLoading ? (
                <ActivityIndicator size="small" color="#FF7A00" className="py-2" />
              ) : !invitations || invitations.length === 0 ? (
                <Text className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2 font-medium">
                  Aucun lien d'accès n'est actif pour le moment.
                </Text>
              ) : (
                <View className="gap-2 py-1">
                  {invitations.map((invite: any) => (
                    <InviationLinkCard
                      key={invite.id}
                      invite={invite}
                      handleCopyLink={handleCopyLink}
                      handleRevokeLink={handleRevokeLink}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* CARTE 3 : Liste des participants */}
        <View className="bg-white border border-zinc-100 rounded-2xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-900">
          
          {/* En-tête de la carte participants */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-50 dark:border-zinc-800">
            <Text className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Membres du groupe ({conversation.members.length})
            </Text>
            
            {isAdmin && (
              <Pressable
                onPress={() => {
                  const memberIds = conversation.members.map((m) => m.id).join(',');
                  router.push(`/messaging/new?chatId=${conversation.id}&existingMemberIds=${memberIds}` as any);
                }}
                className="flex-row items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1.5 rounded-lg active:opacity-70"
              >
                <UserPlus size={13} color="#FF7A00" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">Ajouter</Text>
              </Pressable>
            )}
          </View>

          {/* Liste des lignes membres */}
          <View>
            {conversation.members.map((member, index) => {
              const isMemberCreator = conversation.created_by_id === member.id;
              const isMemberAdmin = member.role === 'admin' || isMemberCreator;

              const canCurrentPromoteDemote = member.id !== user?.id && (isCreator || isAdmin);
              const canCurrentKick =
                isAdmin &&
                member.id !== user?.id &&
                !isMemberCreator &&
                (isCreator || member.role !== 'admin');

              return (
                <View
                  key={member.id}
                  className={cn(
                    "flex-row items-center justify-between px-4 py-3.5",
                    index !== conversation.members.length - 1 && "border-b border-zinc-50 dark:border-zinc-800/40"
                  )}
                >
                  <Pressable
                    className="flex-row items-center gap-3 flex-1 pr-2"
                    onPress={() => {
                      if (member.id !== user?.id) {
                        router.push(`/user/${member.id}`)
                      }
                    }}
                  >
                    <Avatar uri={member.avatarUrl} name={member.username} size={36} />

                    <View className="flex-1 justify-center">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50" numberOfLines={1}>
                          {member.username}
                        </Text>
                        {member.id === user?.id && (
                          <View className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5">
                            <Text className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Vous</Text>
                          </View>
                        )}
                      </View>

                      {/* Badges de rôle */}
                      {isMemberCreator ? (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <ShieldAlert size={11} color="#FF7A00" />
                          <Text className="text-[11px] font-bold text-orange-500">Créateur</Text>
                        </View>
                      ) : isMemberAdmin ? (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Shield size={11} color="#A1A1AA" />
                          <Text className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Responsable</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>

                  {/* Actions à droite de la ligne */}
                  <View className="flex-row items-center gap-1.5">
                    {canCurrentPromoteDemote && (
                      <Pressable
                        onPress={() =>
                          member.role === 'admin'
                            ? handleDemote(member.id, member.username)
                            : handlePromote(member.id, member.username)
                        }
                        className="h-8 px-2.5 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 active:bg-zinc-50"
                      >
                        <Text className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                          {member.role === 'admin' ? 'Retirer' : 'Nommer Admin'}
                        </Text>
                      </Pressable>
                    )}
                    
                    {canCurrentKick && (
                      <Pressable
                        onPress={() => handleKick(member.id, member.username)}
                        className="h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20 active:bg-red-100"
                      >
                        <UserMinus size={14} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Boîte de dialogue (Modal) */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <AddLinkModal 
          maxUses={maxUses}
          setMaxUses={setMaxUses}
          expiresInHours={expiresInHours}
          setExpiresInHours={setExpiresInHours}
          setInviteModalVisible={setInviteModalVisible}
          handleCreateInvite={handleCreateInvite}
          inviteModalVisible={inviteModalVisible}
        />
      </Modal>
    </SafeAreaView>
  );
}