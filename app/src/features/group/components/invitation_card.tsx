import InviationLinkCard from '@/features/group/ui/card';
import { Link2 } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface GroupInvitationsCardProps {
  isAdmin: boolean;
  isInvitesLoading: boolean;
  invitations: any[];
  onOpenModal: () => void;
  onCopyLink: (token: string) => void;
  onRevokeLink: (id: string) => void;
}

export function GroupInvitationsCard({
  isAdmin,
  isInvitesLoading,
  invitations,
  onOpenModal,
  onCopyLink,
  onRevokeLink,
}: GroupInvitationsCardProps) {
  if (!isAdmin) return null;

  return (
    <View className="bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl overflow-hidden mb-6">
      <Pressable
        onPress={onOpenModal}
        className="flex-row items-center p-5 active:opacity-80 transition-opacity"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
          <Link2 size={20} color="#F97316" strokeWidth={2.5} />
        </View>
        <View className="ml-4 flex-1 justify-center">
          <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
            Créer un lien d'invitation
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Partager l'accès au groupe
          </Text>
        </View>
      </Pressable>

      <View className="p-5 pt-0">
        {isInvitesLoading ? (
          <ActivityIndicator size="small" color="#F97316" className="py-4" />
        ) : !invitations || invitations.length === 0 ? (
          <View className="py-6 items-center justify-center rounded-2xl bg-white dark:bg-[#222222]">
            <Text className="text-xs font-bold text-zinc-400 text-center">
              Aucun lien d'accès actif.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {invitations.map((invite: any) => (
              <InviationLinkCard
                key={invite.id}
                invite={invite}
                handleCopyLink={onCopyLink}
                handleRevokeLink={onRevokeLink}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}