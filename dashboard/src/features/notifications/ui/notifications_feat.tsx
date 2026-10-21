import { useState } from "react";
import { useNotifications } from "../model/use_notifications";
import { useToast } from "@/providers/toast/toastContext";

// UI Components
import { Input } from "@/share/ui/Input";
import { Button } from "@/share/ui/Button";
import { BellRing, Send, MessageSquare } from "lucide-react";

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
      showToast({ type: "error", message: "Veuillez saisir un titre." });
      return;
    }
    if (!body.trim()) {
      showToast({ type: "error", message: "Veuillez saisir le contenu." });
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      await sendNotification({ title: title.trim(), body: body.trim() });
      showToast({ type: "success", message: "Notification envoyée avec succès !" });
      setConfirmOpen(false);
      setTitle("");
      setBody("");
    } catch {
      showToast({ type: "error", message: "Erreur lors de l'envoi de la notification." });
    }
  };

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Notifications Push</h1>
        <p className="text-sm font-medium text-zinc-500 mt-2">
          Envoyez des messages importants (In-App et Push) à toute votre base d'utilisateurs.
        </p>
      </header>

      {/* FORMULAIRE (Flat Design) */}
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-50 rounded-[2rem] p-8 max-w-3xl flex flex-col gap-8"
      >
        <div className="flex items-center gap-4 border-b border-zinc-200/60 pb-6">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-zinc-100">
            <BellRing size={20} className="text-zinc-900" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Nouveau message global</h2>
            <p className="text-sm text-zinc-500 font-medium">
              Sera diffusé instantanément à tous les comptes actifs.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* CHAMP : TITRE */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-medium text-zinc-900">Titre de la notification</label>
              <span className={`text-xs font-semibold ${title.length >= TITLE_MAX ? "text-red-500" : "text-zinc-400"}`}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="Ex: Maintenance système programmée ce soir..."
              leftIcon={<BellRing size={20} />}
            />
          </div>

          {/* CHAMP : CONTENU (Textarea stylisée comme l'Input) */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-medium text-zinc-900">Message complet</label>
              <span className={`text-xs font-semibold ${body.length >= BODY_MAX ? "text-red-500" : "text-zinc-400"}`}>
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <div className="relative">
              <div className="absolute top-4 left-4 text-zinc-400 pointer-events-none">
                <MessageSquare size={20} />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BODY_MAX}
                rows={5}
                placeholder="Rédigez le détail du message ici..."
                className="w-full bg-zinc-100 text-zinc-900 rounded-[2rem] py-4 pl-12 pr-6 text-base font-medium outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all resize-none placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* BOUTON SUBMIT */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={actionLoading || !title.trim() || !body.trim()}
            leftIcon={<Send size={18} />}
          >
            Prévisualiser l'envoi
          </Button>
        </div>
      </form>

      {/* MODAL DE CONFIRMATION */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col">
            
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <Send size={24} className="text-zinc-900" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Confirmer la diffusion</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              Vous êtes sur le point d'alerter <span className="font-semibold text-zinc-900">l'ensemble des utilisateurs</span>. Veuillez vérifier l'aperçu ci-dessous.
            </p>

            {/* APERÇU DE LA NOTIFICATION */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5 mb-8 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-6 rounded-md bg-zinc-900 flex items-center justify-center">
                  <BellRing size={12} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aperçu In-App</span>
              </div>
              <p className="font-bold text-sm text-zinc-900 mb-1 leading-snug">{title}</p>
              <p className="text-xs font-medium text-zinc-500 whitespace-pre-wrap leading-relaxed">{body}</p>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-auto">
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => setConfirmOpen(false)} 
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleConfirmSend} 
                isLoading={actionLoading}
              >
                Diffuser
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}