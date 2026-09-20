import { Check, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface GroupHeaderCardProps {
  name: string;
  memberCount: number;
  isAdmin: boolean;
  onSaveName: (newName: string) => Promise<void>;
}

export function GroupHeaderCard({
  name,
  memberCount,
  isAdmin,
  onSaveName,
}: GroupHeaderCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(name);

  useEffect(() => {
    setGroupName(name);
  }, [name]);

  const handleSave = async () => {
    await onSaveName(groupName);
    setIsEditingName(false);
  };

  return (
    <View className="items-center bg-zinc-100 dark:bg-[#1A1A1A] rounded-2xl p-6 mb-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-[#222222] mb-4">
        <Users size={28} color="#F97316" strokeWidth={2.5} />
      </View>

      {isEditingName ? (
        <View className="w-full flex-row items-center gap-3 mt-2">
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Nommez votre groupe..."
            placeholderTextColor="#A1A1AA"
            className="flex-1 h-14 rounded-full bg-white dark:bg-[#222222] px-6 text-sm font-bold text-zinc-950 dark:text-white"
            autoFocus
          />
          <Pressable
            onPress={handleSave}
            className="h-14 w-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80"
          >
            <Check size={20} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        </View>
      ) : (
        <View className="items-center w-full">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white text-center px-2" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
            Discussion • {memberCount} participant{memberCount > 1 ? 's' : ''}
          </Text>

          {isAdmin && (
            <Pressable
              onPress={() => setIsEditingName(true)}
              className="mt-5 rounded-full bg-white dark:bg-[#222222] px-5 py-2.5 active:opacity-80"
            >
              <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                Modifier le nom
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}