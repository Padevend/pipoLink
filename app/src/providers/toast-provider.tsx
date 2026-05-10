import { createContext, type ReactNode, useMemo, useState, useContext } from 'react';
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
  const { colors } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: ToastInput): void => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 3));
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  };

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" className="absolute left-4 right-4 top-12 gap-2">
        {toasts.map((toast) => (
          <Pressable
            key={toast.id}
            onPress={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            style={{
              backgroundColor:
                toast.type === 'success'
                  ? colors.success
                  : toast.type === 'error'
                    ? colors.error
                    : toast.type === 'warning'
                      ? colors.warning
                      : ACCENT,
            }}
            className="rounded-2xl px-4 py-3 shadow-sm">
            <Text className="text-sm font-medium text-white">{toast.message}</Text>
          </Pressable>
        ))}
      </View>
    </ToastContext.Provider>
  );
}
