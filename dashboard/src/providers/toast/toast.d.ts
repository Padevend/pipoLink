type toastTypes = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: toastTypes;
    duration?: number;
}

interface ToastProps {
    message: string;
    type: toastTypes;
    duration?: number;
}

interface ToastContextType {
    showToast: ({
        message,
        type,
        duration
    }: ToastProps) => void;
    hideToast: (id: string) => void;
    toasts: Toast[];
}