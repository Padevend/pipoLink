import { STUDY_AIDS } from '@/app/ai/[id]';
import type { Document } from '@/shared/api/types';
import {
  Plus,
  Send,
} from 'lucide-react-native';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { cn } from '../utils/cn';
import { TextInput } from 'react-native';

interface AiInputBarProps {
  text: string;
  setText: (text: string) => void;
  onSend: (text: string) => void;
  studyMenuOpen: boolean;
  setStudyMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  STUDY_AIDS: typeof STUDY_AIDS;
  activeDocs?: Document[];
  handleGenerateStudyAid: (type: string) => void;
  isLocked: boolean;
}

export const AiInputBar = ({
  text,
  setText,
  onSend,
  studyMenuOpen,
  setStudyMenuOpen,
  STUDY_AIDS,
  activeDocs,
  handleGenerateStudyAid,
  isLocked,
}: AiInputBarProps) => {
  const handleSendPress = () => {
    if (!text || !text.trim() || isLocked) return;
    onSend(text.trim());
    setStudyMenuOpen(false);
  };

  return (
    <View className="relative mx-auto w-full max-w-[680px]">
      {/* Menu Déroulant des Outils de Révision (Study Aids) */}
      {studyMenuOpen && (
        <View className="absolute bottom-[66px] left-0 right-0 z-50 rounded-3xl border border-zinc-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
          <Text className="mb-2 px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Outils de révision
          </Text>
          <View className="flex-row flex-wrap">
            {STUDY_AIDS.map((aid) => {
              const Icon = aid.icon;
              const disabled = !activeDocs?.length;
              return (
                <Pressable
                  key={aid.id}
                  disabled={disabled}
                  onPress={() => handleGenerateStudyAid(aid.id)}
                  className={cn("w-1/2 flex-row items-center gap-2 rounded-2xl px-3 py-3 active:bg-zinc-100 dark:active:bg-zinc-800", disabled && "opacity-40")}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                    <Icon size={15} color="#F97316" />
                  </View>
                  <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    {aid.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Capsule Unique Flottante (Fonctionnement similaire au ChatView) */}
      <View className="flex-row items-end gap-1.5 rounded-[28px] border border-zinc-200/60 bg-white/90 p-1 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90">
        
        {/* Bouton d'ouverture de menu Outils de révision */}
        <Pressable
          onPress={() => setStudyMenuOpen((open) => !open)}
          className={cn(
            "mb-0.5 h-10 w-10 items-center justify-center rounded-full transition-all",
            studyMenuOpen ? "bg-orange-500 rotate-45" : "bg-transparent active:scale-95"
          )}
        >
          <Plus size={20} color={studyMenuOpen ? "#FFFFFF" : "#71717A"} />
        </Pressable>

        {/* Champ de saisie direct basé sur le draft */}
        <TextInput
          placeholder={isLocked ? "Solde de jetons insuffisant" : "Demandez une explication, un plan..."}
          placeholderTextColor="#A1A1AA"
          editable={!isLocked}
          multiline
          value={text}
          onChangeText={setText}
          style={{ textAlignVertical: 'center' }}
          className="flex-1 min-h-[40px] max-h-[110px] py-2.5 text-[15px] font-normal leading-5 text-zinc-900 dark:text-zinc-50"
        />

        {/* Bouton d'envoi intégré */}
        <Pressable
          onPress={handleSendPress}
          disabled={ isLocked}
          className={cn(
            "mb-0.5 h-10 w-10 items-center justify-center rounded-full transition-all",
            !isLocked ? "bg-orange-500 shadow-sm active:scale-95 dark:bg-orange-600" : "bg-transparent"
          )}
        >
          <Send 
            size={16} 
            color={!isLocked ? "#FFFFFF" : "#D4D4D8"} 
            style={{ marginLeft: !isLocked ? 2 : 0 }} 
          />
        </Pressable>
      </View>
    </View>
  );
};
AiInputBar.displayName = 'AiInputBar';