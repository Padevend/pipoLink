import type { ReactNode } from 'react';
import { Pressable, Modal as RNModal, Text } from 'react-native';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
}

export function Modal({ visible, onClose, title, children }: ModalProps): JSX.Element {
  return (
    <RNModal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 px-4 justify-end" onPress={onClose}>
        <Pressable className="mb-4 rounded-3xl bg-white p-5" onPress={() => undefined}>
          <Text className="mb-4 text-lg font-semibold text-slate-900">{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
