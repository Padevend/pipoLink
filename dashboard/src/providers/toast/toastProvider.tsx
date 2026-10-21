import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import ToastContext from "./toastContext";

const TOAST_DURATION = 3000;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const value = useMemo<ToastContextType>(() => {
        return {
            showToast: ({ message, type, duration }: ToastProps) => {
                const id = Math.random().toString(36).substring(2, 8);
                
                // Insertion en tête de pile (max 3)
                setToasts((prev) => [{ id, message, type, duration }, ...prev].slice(0, 3));

                setTimeout(() => {
                    setToasts((current) => current.filter((t) => t.id !== id));
                }, duration ?? TOAST_DURATION);
            },
            hideToast: (id: string) => {
                setToasts((current) => current.filter((t) => t.id !== id));
            },
            toasts: toasts,
        };
    }, [toasts]);

    // Charte monochrome claire : l'icône est noire par défaut, sauf pour les erreurs (rouge)
    const getMeta = (type: Toast["type"]) => {
        switch (type) {
            case "error":
                return { color: "text-red-500", icon: AlertCircle };
            case "warning":
                return { color: "text-amber-500", icon: AlertCircle };
            case "success":
                return { color: "text-zinc-900", icon: CheckCircle2 };
            case "info":
            default:
                return { color: "text-zinc-900", icon: Info };
        }
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* CONTENEUR FIXE */}
            {toasts.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full max-w-[320px] h-12 select-none">
                    {toasts.map((toast, index) => {
                        const meta = getMeta(toast.type);
                        const Icon = meta.icon;

                        // Effet de pile 3D
                        const scale = 1 - index * 0.05;
                        const translateY = -index * 14;
                        // Opacité ajustée pour le mode clair
                        const opacity = index === 0 ? 1 : index === 1 ? 0.7 : 0.3;

                        return (
                            <div
                                key={toast.id}
                                className="absolute bottom-0 left-0 right-0 pointer-events-auto bg-white border border-zinc-200 shadow-sm px-4 py-3 rounded-full flex items-center justify-between gap-x-3"
                                style={{
                                    transform: `translateY(${translateY}px) scale(${scale})`,
                                    opacity: opacity,
                                    zIndex: toasts.length - index,
                                    transition: "transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease-out",
                                    animation: index === 0 ? "toastSlideUp 0.3s cubic-bezier(0.2, 0, 0, 1) forwards" : undefined
                                }}
                            >
                                {/* Icône d'intonation */}
                                <div className={`flex items-center justify-center shrink-0 ${meta.color}`}>
                                    <Icon size={18} strokeWidth={2.5} />
                                </div>

                                {/* Message textuel */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium tracking-wide text-zinc-900 truncate">
                                        {toast.message}
                                    </p>
                                </div>

                                {/* Bouton de fermeture */}
                                {index === 0 && (
                                    <button
                                        onClick={() => value.hideToast(toast.id)}
                                        className="h-7 w-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
                                    >
                                        <X size={16} strokeWidth={2} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Animation d'apparition fluide */}
            <style>{`
                @keyframes toastSlideUp {
                    from {
                        transform: translateY(20px) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}