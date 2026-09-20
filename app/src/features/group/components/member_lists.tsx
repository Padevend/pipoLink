import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { GroupMemberItem } from './member';

interface GroupMembersListProps {
  members: any[];
  chatId: string;
  currentUserId?: string;
  creatorId?: string;
  isAdmin: boolean;
  isCreator: boolean;
  onPromote: (id: string, name: string) => void;
  onDemote: (id: string, name: string) => void;
  onKick: (id: string, name: string) => void;
}

export function GroupMembersList({
  members,
  chatId,
  currentUserId,
  creatorId,
  isAdmin,
  isCreator,
  onPromote,
  onDemote,
  onKick,
}: GroupMembersListProps) {
  return (
    <View className="overflow-hidden mb-8">
      {/* En-tête */}
      <View className="flex-row items-center justify-between p-5 border-b border-zinc-200 dark:border-[#222222]">
        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Membres ({members.length})
        </Text>
        
        {isAdmin && (
          <Pressable
            onPress={() => {
              const memberIds = members.map((m) => m.id).join(',');
              router.push(`/messaging/new?chatId=${chatId}&existingMemberIds=${memberIds}` as any);
            }}
            className="flex-row items-center gap-2 bg-orange-500 px-4 py-2 rounded-full active:opacity-80"
          >
            <UserPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-xs font-black uppercase tracking-widest text-white">Ajouter</Text>
          </Pressable>
        )}
      </View>

      {/* Lignes */}
      <View>
        {members.map((member, index) => (
          <View key={member.id}>
            <GroupMemberItem
              member={member}
              currentUserId={currentUserId}
              creatorId={creatorId}
              isAdmin={isAdmin}
              isCreator={isCreator}
              onPromote={onPromote}
              onDemote={onDemote}
              onKick={onKick}
            />
          </View>
        ))}
      </View>
    </View>
  );
}