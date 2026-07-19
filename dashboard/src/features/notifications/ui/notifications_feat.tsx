import { useState } from "react";
import { useNotifications } from "../model/use_notifications";
import { useToast } from "@/providers/toast/toastContext";
import { BellRing, Loader2, Send, X } from "lucide-react";

const TITLE_MAX = 120;
const BODY_MAX = 500;

export function NotificationsFeat() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { showToast } = useToast();
  const { sendNotification, actionLoading } = useNotifications();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast({ type: "error", message: "Veuillez saisir un titre.", duration: 4000 });
      return;
    }
    if (!body.trim()) {
      showToast({ type: "error", message: "Veuillez saisir le contenu de la notification.", duration: 4000 });
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      await sendNotification({ title: title.trim(), body: body.trim() });
      setConfirmOpen(false);
      setTitle("");
      setBody("");
    } catch {
      // Toast notification is managed inside useNotifications mutate handler
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
          Notifications
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Envoyez une notification (in-app + push) à tous les utilisateurs actifs de l'application
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/60 border border-white/80 rounded-2xl p-6 shadow-sm shadow-zinc-200/40 backdrop-blur-xl max-w-2xl space-y-5"
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <BellRing size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-800">Nouvelle notification</h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Diffusée à tous les utilisateurs actifs
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700">Titre</label>
            <span className="text-[10px] font-semibold text-zinc-400">
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Ex. Maintenance prévue ce soir"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700">Contenu</label>
            <span className="text-[10px] font-semibold text-zinc-400">
              {body.length}/{BODY_MAX}
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={BODY_MAX}
            rows={5}
            placeholder="Rédigez le message qui sera affiché aux utilisateurs…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={actionLoading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-200 active:scale-[0.98] shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            <span>Envoyer la notification</span>
          </button>
        </div>
      </form>

      {/* CONFIRM MODAL */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-zinc-800">Confirmer l'envoi</h3>
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Cette notification sera envoyée à <span className="font-bold text-zinc-800">TOUS les utilisateurs actifs</span> (in-app et push). Cette action est irréversible.
            </p>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-zinc-800">{title}</p>
              <p className="text-[11px] text-zinc-500 font-medium whitespace-pre-wrap">{body}</p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>{actionLoading ? "Envoi…" : "Envoyer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
