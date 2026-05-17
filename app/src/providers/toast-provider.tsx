import { AlertCircle, CheckCheck, HelpCircle, Info, X } from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ACCENT } from '@/shared/constants/colors';
import { useTheme } from '@/shared/hooks/use-theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  type: ToastType;
  message: string;
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

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const { colors, mode } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: ToastInput): void => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 3));
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  };

  // Fonction de mapping pour récupérer l'icône et la couleur sémantique
  const getMeta = (type: ToastType) => {
    switch (type) {
      case "error":
        return {
          color: '#EF4444',
          icon: AlertCircle
        };
      case "info":
        return {
          color: '#FF7A00',
          icon: Info
        };
      case "success":
        return {
          color: '#22C55E',
          icon: CheckCheck
        };
      case "warning":
        return {
          color: '#EAB308',
          icon: AlertCircle
        };
      default:
        return {
          color: ACCENT || '#FF7A00',
          icon: HelpCircle
        };
    }
  };

  const isDark = mode === 'dark';

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" className="absolute left-6 right-6 top-14 gap-y-3 z-50">
        {toasts.map((toast) => {
          const meta = getMeta(toast.type);
          const IconComponent = meta.icon;

          return (
            <Pressable
              key={toast.id}
              onPress={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-[20px] p-4 flex-row items-center border border-white/10 shadow-xl shadow-black/10 overflow-hidden bg-white/95 backdrop-blur-lg dark:bg-black/80 border-2 border-border-light dark:border-border-dark shadow-lg"
            >
              <View className="w-9 h-9 items-center justify-center rounded-xl bg-white/15 mr-3">
                <IconComponent size={18} color={meta.color} strokeWidth={2.5} />
              </View>

              {/* Corps du message */}
              <View className="flex-1 pr-2">
                <Text className="text-[13px] font-bold tracking-wide leading-5 text-primary-light dark:text-primary-dark">
                  {toast.message}
                </Text>
              </View>

              {/* Indicateur visuel de fermeture (X discret) numérique */}
              <View className="w-5 h-5 rounded-full bg-black/5 items-center justify-center opacity-60">
                <X />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}
