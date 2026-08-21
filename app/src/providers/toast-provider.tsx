import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View, useWindowDimensions } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  type: ToastType;
  message: string;
  onPress?: () => void;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Composant Toast individuel gérant le geste de balayage et les animations de pile
function SwipeableToast({
  toast,
  index,
  total,
  onDismiss,
  meta,
}: {
  toast: ToastItem;
  index: number;
  total: number;
  onDismiss: (id: string) => void;
  meta: any;
}) {
  const { width } = useWindowDimensions();
  
  // Valeurs animées pour la fluidité des transitions de la pile
  const pan = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1 - index * 0.05)).current;
  const transYAnim = useRef(new Animated.Value(index * 18)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current; // Commence à 0 pour le fade-in
  const isMounted = useRef(false);

  const isTop = index === 0;

  // Animation réactive au changement de position (index)
  useEffect(() => {
    // Animation d'entrée pour un nouveau toast (index 0 initial)
    if (!isMounted.current && index === 0) {
      transYAnim.setValue(-30);
      scaleAnim.setValue(0.9);
    }
    isMounted.current = true;

    // Transition fluide vers la nouvelle position
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1 - index * 0.06, // Réduction de 6% par couche
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
      Animated.spring(transYAnim, {
        toValue: index * 18, // Décalage vertical très distinct (18px)
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: index === 0 ? 1 : index === 1 ? 0.85 : 0.4, // Transparence progressive
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, transYAnim, scaleAnim, opacityAnim]);

  // Configuration du PanResponder pour le slide à gauche
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isTop && gestureState.dx < -10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -width * 0.3) {
          // Si balayé suffisamment loin, on l'éjecte
          Animated.timing(pan, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDismiss(toast.id));
        } else {
          // Sinon, on le remet à sa place
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const IconComponent = meta.icon;

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          zIndex: total - index, // Le plus haut index (0) a le plus grand zIndex
          opacity: opacityAnim,
          transform: [
            { translateX: pan },
            { translateY: transYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* BOÎTIER MAITRE : Design moderne avec ombre portée forte pour détacher les couches */}
      <Pressable
        onPress={isTop && toast.onPress ? () => { onDismiss(toast.id); toast.onPress?.(); } : undefined}
        className={`flex-row items-center p-3.5 rounded-[18px] border bg-white/95 backdrop-blur-xl border-zinc-200/80 dark:bg-zinc-900/95 dark:border-zinc-800/80`}
      >
        
        {/* Icône */}
        <View className="w-8 h-8 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-950 mr-3 border border-zinc-100 dark:border-zinc-800">
          <IconComponent size={16} color={meta.color} strokeWidth={2.5} />
        </View>

        {/* Message */}
        <View className="flex-1 pr-2">
          <Text className="text-[13px] font-bold leading-5 text-zinc-900 dark:text-zinc-50">
            {toast.message}
          </Text>
        </View>

        {/* Bouton fermeture */}
        {isTop && (
          <Pressable
            onPress={() => onDismiss(toast.id)}
            hitSlop={8}
            className="w-7 h-7 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors"
          >
            <X size={14} color="#71717A" strokeWidth={2.5} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: ToastInput): void => {
    const id = `${Date.now()}-${Math.random()}`;
    
    // Ajoute le toast et limite strictement à 3 éléments maximum
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 3));
    
    // Auto-dismiss après 4 secondes
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const getMeta = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { color: '#F97316', icon: CheckCircle2 }; // Orange identitaire
      case 'error':
        return { color: '#EF4444', icon: AlertCircle };
      case 'warning':
        return { color: '#F59E0B', icon: AlertCircle };
      case 'info':
      default:
        return { color: '#71717A', icon: Info };
    }
  };

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Conteneur fixe, non-cliquable dans le vide */}
      {toasts.length > 0 && (
        <View 
          pointerEvents="box-none" 
          className="absolute left-5 right-5 top-16 z-[999]"
          style={{ height: 100 }}
        >
          {toasts.map((toast, index) => (
            <SwipeableToast
              key={toast.id}
              toast={toast}
              index={index}
              total={toasts.length}
              onDismiss={dismissToast}
              meta={getMeta(toast.type)}
            />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
}