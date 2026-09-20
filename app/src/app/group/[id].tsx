import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useConversations,
  useCreateGroupInvitation,
  useDemoteMember,
  useGroupInvitations,
  useKickMember,
  usePromoteMember,
  useRevokeGroupInvitation,
  useUpdateGroupDetails,
} from '@/entities/conversation/hooks';
import { GroupHeaderCard } from '@/features/group/components/header_card';
import { GroupInvitationsCard } from '@/features/group/components/invitation_card';
import { GroupMembersList } from '@/features/group/components/member_lists';
import AddLinkModal from '@/features/group/ui/modal';
import { useAuth, useToast } from '@/providers';
import { encryptChatKeyWithToken, getCachedChatKey } from '@/shared/crypto/chat-key';


export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { data: conversations, isLoading: isConversationsLoading } = useConversations();

  const conversation = useMemo(() => {
    return conversations?.find((c) => c.id === id);
  }, [conversations, id]);

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

  if (isConversationsLoading || !conversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-[#0A0A0A]">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  const handleSaveName = async (groupName: string) => {
    if (!groupName.trim()) {
      showToast({ message: 'Le nom du groupe ne peut pas être vide.', type: 'error' });
      return;
    }
    try {
      await updateDetails.mutateAsync({ chatId: conversation.id, name: groupName });
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Options de groupe
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Paramètres & Membres
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* BLOC 1 : Identité et En-tête du groupe */}
        <GroupHeaderCard
          name={conversation.name as string}
          memberCount={conversation.members.length}
          isAdmin={isAdmin}
          onSaveName={handleSaveName}
        />

        {/* BLOC 2 : Liens d'invitations */}
        <GroupInvitationsCard
          isAdmin={isAdmin}
          isInvitesLoading={isInvitesLoading}
          invitations={invitations ?? []}
          onOpenModal={() => setInviteModalVisible(true)}
          onCopyLink={handleCopyLink}
          onRevokeLink={handleRevokeLink}
        />

        {/* BLOC 3 : Liste des participants */}
        <GroupMembersList
          members={conversation.members}
          chatId={conversation.id}
          currentUserId={user?.id}
          creatorId={conversation.created_by_id}
          isAdmin={isAdmin}
          isCreator={isCreator}
          onPromote={handlePromote}
          onDemote={handleDemote}
          onKick={handleKick}
        />
      </ScrollView>

      {/* Modal d'invitation */}
      <Modal
        visible={inviteModalVisible}
        transparent
        statusBarTranslucent
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