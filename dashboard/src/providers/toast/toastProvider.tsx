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
                
                // Insertion en tête de pile (index 0) pour la cascade
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

    // Métadonnées d'intonation adaptées au thème Android Sombre/Bleuté doux
    const getMeta = (type: Toast["type"]) => {
        switch (type) {
            case "success":
                return { color: "text-emerald-400", icon: CheckCircle2 };
            case "error":
                return { color: "text-red-400", icon: AlertCircle };
            case "warning":
                return { color: "text-amber-400", icon: AlertCircle };
            case "info":
            default:
                return { color: "text-sky-400", icon: Info };
        }
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* CONTENEUR FIXE (BAS CENTRE) */}
            {toasts.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-[340px] h-12 select-none">
                    {toasts.map((toast, index) => {
                        const meta = getMeta(toast.type);
                        const Icon = meta.icon;

                        // Vos paramètres de cascade serrés et denses
                        const scale = 1 - index * 0.02;
                        const translateY = -index * 12;
                        const opacity = index === 0 ? 1 : index === 1 ? 0.9 : 0.8;

                        return (
                            <div
                                key={toast.id}
                                className="absolute bottom-0 left-0 right-0 pointer-events-auto bg-[#2C3036] border border-[#383C44] px-4 py-2.5 rounded-full flex items-center justify-between gap-x-2.5 shadow-md"
                                style={{
                                    transform: `translateY(${translateY}px) scale(${scale})`,
                                    opacity: opacity,
                                    zIndex: toasts.length - index,
                                    transition: "transform 0.22s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s linear",
                                    animation: index === 0 ? "androidToastIn 0.25s cubic-bezier(0.2, 0, 0, 1) forwards" : undefined
                                }}
                            >
                                {/* Icône d'intonation lumineuse douce */}
                                <div className={`flex items-center justify-center shrink-0 ${meta.color}`}>
                                    <Icon size={14} strokeWidth={2.5} />
                                </div>

                                {/* Message textuel style Android (Gris très clair bleuté) */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-medium tracking-normal text-[#E2E8F0] truncate">
                                        {toast.message}
                                    </p>
                                </div>

                                {/* Bouton de fermeture minimaliste intégré dans le pilule */}
                                {index === 0 && (
                                    <button
                                        onClick={() => value.hideToast(toast.id)}
                                        className="h-5 w-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X size={13} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Animation de transition Mat Android (Slide Up lent + Fade In franc) */}
            <style>{`
                @keyframes androidToastIn {
                    from {
                        transform: translateY(16px) scale(0.95);
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