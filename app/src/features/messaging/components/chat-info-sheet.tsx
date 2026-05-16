import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { Conversation } from '@/shared/api/messaging';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X } from 'lucide-react-native';

interface ChatInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | undefined;
  currentUserId?: string;
  isAdmin?: boolean;
  onAddMember?: () => void;
}

export function ChatInfoSheet({
  visible,
  onClose,
  conversation,
  currentUserId,
  isAdmin = false,
  onAddMember,
}: ChatInfoSheetProps): JSX.Element {
  const members = conversation?.members ?? [];
  const createdAt = conversation?.updatedAt;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable className="max-h-[85%] rounded-t-[32px] bg-background-light p-6 dark:bg-background-dark" onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
              Infos du chat
            </Text>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Nom
            </Text>
            <Text className="mb-4 text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              {conversation?.name ?? 'Conversation'}
            </Text>

            {createdAt ? (
              <>
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-text-secondary-light">
                  Créé le
                </Text>
                <Text className="mb-4 text-base text-text-primary-light dark:text-text-primary-dark">
                  {format(new Date(createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </Text>
              </>
            ) : null}

            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary-light">
              Membres ({members.length})
            </Text>
            {members.map((m) => (
              <View key={m.id} className="mb-3 flex-row items-center gap-3">
                <Avatar name={m.username} uri={m.avatarUrl} size="sm" />
                <View className="flex-1">
                  <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{m.username}</Text>
                  {m.id === currentUserId ? (
                    <Text className="text-xs text-primary">Vous</Text>
                  ) : null}
                </View>
                {isAdmin && m.id === currentUserId ? (
                  <Text className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Admin</Text>
                ) : null}
              </View>
            ))}

            {isAdmin ? (
              <Button
                label="Ajouter un membre"
                variant="outline"
                className="mt-4"
                onPress={onAddMember}
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
