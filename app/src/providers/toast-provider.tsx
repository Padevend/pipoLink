import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useMemo, useState, useRef } from 'react';
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

// Composant Toast individuel gérant le geste de balayage gauche (Swipe-to-dismiss)
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
  const pan = useRef(new Animated.Value(0)).current;

  // Calculs d'empilement géométrique strict
  const position = index; 
  const isTop = position === 0;

  // Décalage vertical et effet d'échelle plat pour la pile
  const translateY = position * 6;
  const scale = 1 - position * 0.04;
  const opacity = position === 0 ? 1 : position === 1 ? 0.7 : 0.4;

  // Configuration du PanResponder pour le slide à gauche sur le toast supérieur
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
        if (gestureState.dx < -width * 0.35) {
          Animated.timing(pan, {
            toValue: -width,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onDismiss(toast.id));
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0, // Retrait du rebond pour rester sur un mouvement mat rigide
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
          zIndex: total - index,
          opacity,
          transform: [
            { translateX: pan },
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {/* BOÎTIER MAITRE : Style Rectiligne Mat Solide */}
      <Pressable
        onPress={isTop && toast.onPress ? () => { onDismiss(toast.id); toast.onPress?.(); } : undefined}
        className="flex-row items-center p-3 rounded-xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
      >
        
        {/* Icône monochrome rigide d'intonation */}
        <View className="w-5 h-5 items-center justify-center mr-2.5">
          <IconComponent size={14} color={meta.color} strokeWidth={2.5} />
        </View>

        {/* Message du Toast */}
        <View className="flex-1 pr-1">
          <Text className="text-xs font-semibold leading-5 text-zinc-900 dark:text-zinc-50">
            {toast.message}
          </Text>
        </View>

        {/* Bouton fermeture discret rectiligne */}
        {isTop && (
          <Pressable
            onPress={() => onDismiss(toast.id)}
            className="w-6 h-6 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-700"
          >
            <X size={12} color="#71717A" />
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
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 3));
    
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
        return { color: '#F97316', icon: CheckCircle2 }; // Orange identitaire standardisé
      case 'error':
        return { color: '#EF4444', icon: AlertCircle }; // Rouge système
      case 'warning':
        return { color: '#F59E0B', icon: AlertCircle }; // Ambre standard
      case 'info':
      default:
        return { color: '#71717A', icon: Info }; // Zinc intermédiaire
    }
  };

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Conteneur fixe de la pile de toasts aligné géométriquement (px-4) */}
      {toasts.length > 0 && (
        <View 
          pointerEvents="box-none" 
          className="absolute left-4 right-4 top-14 z-50"
          style={{ height: 72 }}
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