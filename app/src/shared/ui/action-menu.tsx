import { Modal, Pressable, Text, View } from 'react-native';

export interface ActionMenuItem {
  id: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionMenuItem[];
}

export function ActionMenu({ visible, onClose, title, items }: ActionMenuProps): JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable className="rounded-t-[28px] bg-background-light px-4 pb-10 pt-4 dark:bg-background-dark" onPress={(e) => e.stopPropagation()}>
          {title ? (
            <Text className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              {title}
            </Text>
          ) : null}
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              className="mb-2 rounded-2xl bg-surface-light px-4 py-4 dark:bg-surface-dark active:opacity-80"
            >
              <Text
                className={`text-base font-bold ${item.destructive ? 'text-error' : 'text-text-primary-light dark:text-text-primary-dark'}`}
              >
                {item.label}
              </Text>
              {item.subtitle ? (
                <Text className="mt-0.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">{item.subtitle}</Text>
              ) : null}
            </Pressable>
          ))}
          <Pressable onPress={onClose} className="mt-2 items-center py-3">
            <Text className="font-bold text-text-secondary-light">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
