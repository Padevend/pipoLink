import { Avatar } from '@/shared/ui/avatar';
import { router } from 'expo-router';
import { Shield, ShieldAlert, UserMinus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

interface GroupMemberItemProps {
  member: {
    id: string;
    username: string;
    avatarUrl?: string;
    role?: string;
  };
  currentUserId?: string;
  creatorId?: string;
  isAdmin: boolean;
  isCreator: boolean;
  onPromote: (id: string, name: string) => void;
  onDemote: (id: string, name: string) => void;
  onKick: (id: string, name: string) => void;
}

export function GroupMemberItem({
  member,
  currentUserId,
  creatorId,
  isAdmin,
  isCreator,
  onPromote,
  onDemote,
  onKick,
}: GroupMemberItemProps) {
  const isMemberCreator = creatorId === member.id;
  const isMemberAdmin = member.role === 'admin' || isMemberCreator;

  const canCurrentPromoteDemote = member.id !== currentUserId && (isCreator || isAdmin);
  const canCurrentKick =
    isAdmin &&
    member.id !== currentUserId &&
    !isMemberCreator &&
    (isCreator || member.role !== 'admin');

  return (
    <View className="flex-row items-center justify-between p-4 active:opacity-80">
      <Pressable
        className="flex-row items-center gap-4 flex-1 pr-3"
        onPress={() => {
          if (member.id !== currentUserId) {
            router.push(`/user/${member.id}` as any);
          }
        }}
      >
        <Avatar uri={member.avatarUrl} name={member.username} size={40} />

        <View className="flex-1 justify-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              {member.username}
            </Text>
            {member.id === currentUserId && (
              <View className="rounded-full bg-white dark:bg-[#222222] px-2.5 py-0.5">
                <Text className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Vous</Text>
              </View>
            )}
          </View>

          {/* Badges de rôle */}
          {isMemberCreator ? (
            <View className="flex-row items-center gap-1.5 mt-1">
              <ShieldAlert size={14} color="#F97316" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">Créateur</Text>
            </View>
          ) : isMemberAdmin ? (
            <View className="flex-row items-center gap-1.5 mt-1">
              <Shield size={14} color="#A1A1AA" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Responsable</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* Actions à droite */}
      <View className="flex-row items-center gap-2">
        {canCurrentPromoteDemote && (
          <Pressable
            onPress={() =>
              member.role === 'admin'
                ? onDemote(member.id, member.username)
                : onPromote(member.id, member.username)
            }
            className="h-10 px-4 items-center justify-center rounded-full bg-white dark:bg-[#222222] active:opacity-80"
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">
              {member.role === 'admin' ? 'Retirer' : 'Promouvoir'}
            </Text>
          </Pressable>
        )}
        
        {canCurrentKick && (
          <Pressable
            onPress={() => onKick(member.id, member.username)}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
          >
            <UserMinus size={16} color="#EF4444" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
    </View>
  );
}