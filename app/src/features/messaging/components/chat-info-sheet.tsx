import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Calendar, Users, UserPlus } from 'lucide-react-native';

import type { Conversation } from '@/shared/api/messaging';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils/cn';

interface ChatInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | undefined;
  name: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onAddMember?: () => void;
}

export function ChatInfoSheet({
  visible,
  onClose,
  conversation,
  name,
  currentUserId,
  isAdmin = false,
  onAddMember,
}: ChatInfoSheetProps): JSX.Element {
  const members = conversation?.members ?? [];
  const createdAt = conversation?.updatedAt;
  const conversationName = conversation?.name ?? 'Conversation';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40 backdrop-blur-sm" onPress={onClose}>
        <Pressable 
          className="max-h-[85%] rounded-t-[36px] border-t border-border-light/30 bg-background-light/95 p-6 pb-8 dark:border-border-dark/20 dark:bg-background-dark/95 backdrop-blur-xl" 
          onPress={(e) => e.stopPropagation()}
        >
          
          {/* Indicateur visuel de glissement (Handle) */}
          <View className="items-center mb-4">
            <View className="h-1.5 w-12 rounded-full bg-text-secondary-light/20 dark:bg-text-secondary-dark/20" />
          </View>

          {/* Header du Modal */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Détails du chat
            </Text>
            <Pressable 
              onPress={onClose} 
              className="h-9 w-9 items-center justify-center rounded-full bg-surface-light/60 border border-border-light/30 dark:bg-surface-dark/50 dark:border-border-dark/30 active:opacity-80"
            >
              <X size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="space-y-6">
            
            {/* Carte Info Principale (Style Glassmorphism) */}
            <View className="rounded-2xl border border-border-light/40 bg-surface-light/40 p-4 dark:border-border-dark/20 dark:bg-surface-dark/30">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/70 dark:text-text-secondary-dark/70">
                {conversation?.type === 'group' ? 'Nom du groupe' : 'Nom de l\'utilisateur'}
              </Text>
              <Text className="mt-1 text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                {name || conversationName}
              </Text>

              {createdAt && (
                <View className="mt-4 pt-4 border-t border-border-light/20 dark:border-border-dark/10 flex-row items-center gap-2.5">
                  <Calendar size={16} className="text-text-secondary-light/60 dark:text-text-secondary-dark/60" />
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                      Création
                    </Text>
                    <Text className="text-sm text-text-primary-light/90 dark:text-text-primary-dark/90 mt-0.5">
                      {format(new Date(createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Section Membres */}
            <View className="mt-4">
              <View className="mb-3 flex-row items-center gap-2 px-1">
                <Users size={16} className="text-text-secondary-light/70 dark:text-text-secondary-dark/70" />
                <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary-light/70 dark:text-text-secondary-dark/70">
                  Membres ({members.length})
                </Text>
              </View>

              <View className="space-y-3">
                {members.map((m) => {
                  const isMe = m.id === currentUserId;
                  return (
                    <View 
                      key={m.id} 
                      className="flex-row items-center gap-3 rounded-xl bg-surface-light/20 p-2 dark:bg-surface-dark/10 border border-transparent hover:border-border-light/20"
                    >
                      <Avatar name={m.username} uri={m.avatarUrl} size="sm" />
                      
                      <View className="flex-1">
                        <Text className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {m.username} {isMe && <Text className="text-text-secondary-light/50 dark:text-text-secondary-dark/50 font-normal">(vous)</Text>}
                        </Text>
                      </View>

                      {/* Gestion des Badges d'état à droite */}
                      <View className="flex-row gap-1.5">
                        {isMe && (
                          <View className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-primary">Toi</Text>
                          </View>
                        )}
                        {isAdmin && isMe && (
                          <View className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Admin</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Actions Administrateur */}
            {isAdmin && onAddMember && (
              <View className="mt-6 pt-2">
                <Button
                  label="Ajouter un membre"
                  variant="outline"
                  className="rounded-xl border-primary/30 text-primary h-12 flex-row items-center justify-center gap-2"
                  onPress={onAddMember}
                  leftIcon={<UserPlus size={18} className="text-primary" />}
                />
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}