import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function ActionMenu({ visible, onClose, title, items }: ActionMenuProps): JSX.Element {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const animateClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onDismiss={onClose}
      onRequestClose={animateClose}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="absolute inset-0" onPress={animateClose} />

        {/* Panneau bas massif avec coins très arrondis */}
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="rounded-t-[40px] bg-white dark:bg-[#0A0A0A] pb-12 pt-4 px-6"
        >
          {/* Poignée de drag */}
          <View {...panResponder.panHandlers} className="w-full items-center py-2 mb-4">
            <View className="h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </View>

          {/* Titre */}
          <View className="mb-6 flex-row items-center gap-3">
            <View className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">
              {title || 'Actions disponibles'}
            </Text>
          </View>

          {/* Liste des items en blocs arrondis */}
          <View className="gap-y-3">
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => {
                    onClose();
                    item.onPress();
                  });
                }}
                className="w-full flex-row items-center justify-between rounded-[24px] bg-zinc-100 dark:bg-[#1A1A1A] p-5 active:opacity-80 transition-all"
              >
                <View className="flex-1 pr-4">
                  <Text
                    className={`text-sm font-black tracking-tight ${
                      item.destructive ? 'text-red-500' : 'text-zinc-950 dark:text-white'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.subtitle ? (
                    <Text className="mt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>

                <View className="h-2 w-2 bg-orange-500 rounded-full" />
              </Pressable>
            ))}
          </View>

          {/* Bouton Annuler massif */}
          <View className="mt-6">
            <Pressable
              onPress={animateClose}
              className="w-full items-center justify-center py-5 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
            >
              <Text className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-widest">
                Annuler
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}