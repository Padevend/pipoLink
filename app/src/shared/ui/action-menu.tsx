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
  // Animation de translation verticale pour le geste et l'ouverture
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Gérer l'animation d'entrée/sortie selon la prop visible
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  // Fermeture animée avant de déclencher la callback onClose
  const animateClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Configuration du PanResponder pour intercepter le glissement vers le bas
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Active le responder uniquement si le mouvement va vers le bas (dy > 0)
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Empêche le menu de remonter plus haut que sa position initiale (dy < 0)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Si le glissement dépasse 100px ou si la vitesse vers le bas est élevée, on ferme
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          // Sinon, effet élastique pour remettre le menu en place
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={animateClose}>
      <View className="flex-1 justify-end bg-black/40 dark:bg-black/50">
        
        {/* Zone extérieure pour fermer au clic */}
        <Pressable className="absolute inset-0" onPress={animateClose} />

        {/* Panneau du menu animé */}
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="rounded-t-[24px] border-t border-border-light/30 bg-surface-light px-4 pb-8 pt-2.5 dark:border-border-dark/20 dark:bg-surface-dark/95 backdrop-blur-xl"
        >
          {/* Zone de saisie du geste (Header invisible + Encoche visuelle) */}
          <View {...panResponder.panHandlers} className="w-full items-center py-2 mb-3 active:opacity-80">
            <View className="h-1.5 w-12 rounded-full bg-text-secondary-light/20 dark:bg-text-secondary-dark/20" />
          </View>

          {title ? (
            <Text className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-text-secondary-light/40 dark:text-text-secondary-dark/50">
              {title}
            </Text>
          ) : null}

          {/* Liste des items de menu */}
          <View className="gap-y-2">
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  // Fermeture propre animée avant d'exécuter l'action du bouton
                  Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => {
                    onClose();
                    item.onPress();
                  });
                }}
                className="rounded-xl border border-border-light/20 bg-background-light/60 px-4 py-3.5 dark:border-border-dark/10 dark:bg-background-dark/40 active:scale-[0.99] transition-transform"
              >
                <Text
                  className={`text-[15px] font-bold tracking-tight ${
                    item.destructive 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  {item.label}
                </Text>
                {item.subtitle ? (
                  <Text className="mt-0.5 text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/40">
                    {item.subtitle}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>

          {/* Bouton Annuler épuré */}
          <Pressable 
            onPress={animateClose} 
            className="mt-4 items-center justify-center py-3 rounded-xl border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-95 transition-transform"
          >
            <Text className="text-[13px] font-bold text-text-secondary-light/60 dark:text-text-secondary-dark/60 uppercase tracking-wide">
              Annuler
            </Text>
          </Pressable>
        </Animated.View>

      </View>
    </Modal>
  );
}