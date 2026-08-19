import { FileText, Image as ImageIcon, Plus, Send } from 'lucide-react-native';
import { useState } from 'react';
import {  Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '@/shared/utils/cn';

interface ChatInputBarProps {
  text: string;
  setText: (text: string) => void;
  onSend: (text: string) => void;
  onPickImage: () => void;
  onPickDocument: () => void;
}

export const ChatInputBar = ({ text, setText, onSend, onPickImage, onPickDocument }: ChatInputBarProps) => {
  const [showActions, setShowActions] = useState(false);

  const handleSendPress = () => {
    if (!text || !text.trim()) return;
    onSend(text.trim());
    setShowActions(false);
  };

  return (
    <View className="relative">
      {/* Menu Actions */}
      {showActions && (
        <View className="absolute bottom-14 left-0 z-50 min-w-[200px] overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/95 p-1.5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/95">
          <Pressable onPress={() => { setShowActions(false); onPickImage(); }} className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-zinc-100 dark:active:bg-zinc-800">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10">
              <ImageIcon size={16} color="#F97316" />
            </View>
            <Text className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Galerie photo</Text>
          </Pressable>
          <Pressable onPress={() => { setShowActions(false); onPickDocument(); }} className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-zinc-100 dark:active:bg-zinc-800">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10">
              <FileText size={16} color="#F97316" />
            </View>
            <Text className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Document / Fichier</Text>
          </Pressable>
        </View>
      )}

      {/* Capsule Principale Unifiée */}
      <View className="flex-row items-end gap-1.5 rounded-[28px] border border-zinc-200/60 bg-white/90 p-1 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90">

        <Pressable
          onPress={() => setShowActions(!showActions)}
          className={cn(
            "mb-0.5 h-10 w-10 items-center justify-center rounded-full transition-all",
            showActions ? "rotate-45 bg-zinc-200/50 dark:bg-zinc-800/50" : "bg-transparent active:scale-95"
          )}
        >
          <Plus size={20} color={showActions ? "#F97316" : "#71717A"} />
        </Pressable>

        <TextInput
          placeholder="Écrire un message…"
          placeholderTextColor="#A1A1AA"
          multiline
          value={text}
          onChangeText={setText}
          style={{ textAlignVertical: 'center' }}
          className="flex-1 min-h-[40px] max-h-[110px] py-2.5 text-[15px] font-normal leading-5 text-zinc-900 dark:text-zinc-50"
        />

        <Pressable
          onPress={handleSendPress}
          className={cn(
            "mb-0.5 me-1 h-10 w-10 items-center justify-center flex rounded-full transition-all",
            "bg-orange-500 shadow-sm active:scale-95 dark:bg-orange-600"
          )}
        >
          <Send
            size={16}
            color={"#FFFFFF"}
          />
        </Pressable>
      </View>
    </View>
  );
};
ChatInputBar.displayName = 'ChatInputBar';