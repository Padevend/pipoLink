import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/shared/utils/cn';

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: ToastInput): void => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 3));
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  };

  // Configuration sémantique unifiée (Couleurs & Icônes)
  const getMeta = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          color: '#10B981', // Vert émeraude
          bgBadge: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          border: 'border-emerald-500/20 dark:border-emerald-500/10',
          icon: CheckCircle2,
        };
      case 'error':
        return {
          color: '#EF4444', // Rouge dynamique
          bgBadge: 'bg-red-500/10 dark:bg-red-500/15',
          border: 'border-red-500/20 dark:border-red-500/10',
          icon: AlertCircle,
        };
      case 'warning':
        return {
          color: '#F59E0B', // Ambre / Orange chaud
          bgBadge: 'bg-amber-500/10 dark:bg-amber-500/15',
          border: 'border-amber-500/20 dark:border-amber-500/10',
          icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          color: '#3B82F6', // Bleu info
          bgBadge: 'bg-blue-500/10 dark:bg-blue-500/15',
          border: 'border-blue-500/20 dark:border-blue-500/10',
          icon: Info,
        };
    }
  };

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Conteneur flottant des toasts (Positionnement précis en haut de l'écran) */}
      <View pointerEvents="box-none" className="absolute left-5 right-5 top-14 gap-y-2.5 z-50">
        {toasts.map((toast) => {
          const meta = getMeta(toast.type);
          const IconComponent = meta.icon;

          return (
            <Pressable
              key={toast.id}
              onPress={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className={cn(
                'flex-row items-center p-3.5 rounded-xl border backdrop-blur-md transition-all active:scale-[0.99]',
                'bg-surface-light/90 border-border-light/40',
                'dark:bg-surface-dark/85 dark:border-border-dark/20',
                meta.border
              )}
            >
              {/* Conteneur de l'icône sémantique */}
              <View className={cn('w-8 h-8 items-center justify-center rounded-lg mr-3', meta.bgBadge)}>
                <IconComponent size={16} color={meta.color} strokeWidth={2.5} />
              </View>

              {/* Contenu textuel */}
              <View className="flex-1 pr-2">
                <Text className="text-[13px] font-semibold leading-[18px] text-text-primary-light dark:text-text-primary-dark">
                  {toast.message}
                </Text>
              </View>

              {/* Bouton de fermeture discret (X) */}
              <View className="w-6 h-6 rounded-full bg-text-secondary-light/5 dark:bg-text-secondary-dark/10 items-center justify-center active:opacity-60">
                <X size={12} className="text-text-secondary-light/60 dark:text-text-secondary-dark/60" />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}