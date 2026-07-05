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

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80, // Légèrement plus sec/nerveux pour le côté technique
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={animateClose}>
      <View className="flex-1 justify-end bg-black/50 dark:bg-black/70">
        
        {/* Backdrop sombre et net */}
        <Pressable className="absolute inset-0" onPress={animateClose} />

        {/* Panneau principal : Coins moins arrondis, structure monochrome solide */}
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="rounded-t-2xl border-t border-zinc-200 bg-white pb-10 pt-2 dark:border-zinc-900 dark:bg-zinc-950"
        >
          {/* Poignée de drag géométrique et fine */}
          <View {...panResponder.panHandlers} className="w-full items-center py-3 mb-2">
            <View className="h-1 w-10 bg-zinc-200 dark:bg-zinc-800" />
          </View>

          {/* En-tête / Titre typé console de commande */}
          <View className="px-6 mb-4 flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <Text className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {title || 'Actions'}
            </Text>
          </View>

          {/* Liste des items sous forme de grille de commande empilée */}
          <View className="px-5 gap-y-2">
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
                className="w-full flex-row items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/40 active:border-orange-500/30 dark:active:border-orange-500/40 active:scale-[0.99] transition-all"
              >
                <View className="flex-1 pr-4">
                  <Text
                    className={`text-sm font-bold tracking-tight ${
                      item.destructive 
                        ? 'text-red-500' 
                        : 'text-zinc-900 dark:text-zinc-50'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.subtitle ? (
                    <Text className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>

                {/* Petit chevron ou indicateur technique discret à droite */}
                {!item.destructive && (
                  <View className="h-1.5 w-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Bouton Fermer / Annuler - Format strict */}
          <View className="px-5 mt-3">
            <Pressable 
              onPress={animateClose} 
              className="w-full items-center justify-center py-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 active:opacity-80"
            >
              <Text className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Annuler
              </Text>
            </Pressable>
          </View>
          
        </Animated.View>
      </View>
    </Modal>
  );
}