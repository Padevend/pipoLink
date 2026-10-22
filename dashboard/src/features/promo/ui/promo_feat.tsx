import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";

import { 
  Tag, Users, Calendar, Percent, Gift, 
  Plus, X, Ticket, Loader2, Search, ArrowRight 
} from "lucide-react";
import { Button } from "@/share/ui/Button";
import { Input } from "@/share/ui/Input";

export function PromoFeat() {
  const client = useQueryClient();
  const { showToast } = useToast();
  
  // --- ÉTATS ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // --- ÉTATS DU FORMULAIRE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountPercent: "",
    freePremiumDays: "",
    maxUses: "",
    expiresAt: "",
  });
  
  // Gestion dynamique de la liste d'emails
  const [currentEmail, setCurrentEmail] = useState("");
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);

  // --- REQUÊTES API ---
  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: api.getPromoCodes,
  });

  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ["promo-redemptions", selectedCodeId],
    queryFn: () => api.getPromoRedemptions(selectedCodeId!),
    enabled: Boolean(selectedCodeId),
  });

  // --- ACTIONS EMAILS ---
  const handleAddEmail = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const email = currentEmail.trim().toLowerCase();
    
    // Regex basique pour vérifier si c'est un email
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (!isValidEmail) {
      showToast({ type: "error", message: "Adresse email invalide." });
      return;
    }
    if (allowedEmails.includes(email)) {
      showToast({ type: "error", message: "Cet email est déjà dans la liste." });
      return;
    }

    setAllowedEmails([...allowedEmails, email]);
    setCurrentEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== emailToRemove));
  };

  // --- SOUMISSION DU FORMULAIRE ---
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const discountPercent = Number(form.discountPercent || 0);
    const freePremiumDays = Number(form.freePremiumDays || 0);
    if ((discountPercent <= 0 && freePremiumDays <= 0) || (discountPercent > 0 && freePremiumDays > 0)) {
      showToast({ type: "error", message: "Choisissez soit une remise, soit des jours Premium offerts." });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createPromoCode({
        code: form.code,
        discountPercent,
        freePremiumDays,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        allowedEmails: allowedEmails.length > 0 ? allowedEmails : undefined,
      });
      client.invalidateQueries({ queryKey: ["promo-codes"] });
      showToast({ type: "success", message: "Code promotionnel créé avec succès." });
      
      // Reset & Fermeture
      setForm({ code: "", discountPercent: "", freePremiumDays: "", maxUses: "", expiresAt: "" });
      setAllowedEmails([]);
      setIsCreateModalOpen(false);
    } catch (e: any) {
      showToast({ type: "error", message: e.message || "Erreur lors de la création du code." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filtrage
  const filteredCodes = codes.filter((c: any) => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 text-zinc-900 pb-10 h-full">
      
      {/* HEADER & ACTIONS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Codes Promos</h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">
            Gérez vos campagnes et l'acquisition de vos utilisateurs.
          </p>
        </div>
        <Button
          variant="primary" 
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Nouveau Code
        </Button>
      </header>

      {/* SEARCH BAR */}
      <div className="bg-zinc-50 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Rechercher un code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={20} />}
          />
        </div>
        <div className="text-sm font-semibold text-zinc-500 bg-white px-6 h-14 rounded-full flex items-center">
          {filteredCodes.length} code(s)
        </div>
      </div>

      {/* GRID DES CODES (MAIN VIEW) */}
      {codesLoading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Loader2 className="animate-spin text-zinc-900 mb-4" size={32} />
          <p className="text-sm font-medium text-zinc-500">Chargement des campagnes...</p>
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="bg-zinc-50 rounded-[2rem] py-24 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-6 rounded-full mb-4 border border-zinc-100">
            <Ticket size={40} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">Aucun code promo</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            Vous n'avez pas encore créé de code promotionnel ou aucun ne correspond à votre recherche.
          </p>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
            Créer le premier code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCodes.map((code: any) => (
            <div 
              key={code.id}
              onClick={() => setSelectedCodeId(code.id)}
              className="bg-zinc-50 hover:bg-zinc-100 rounded-[2rem] p-6 border border-zinc-100 hover:border-zinc-300 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-white px-4 py-1.5 rounded-full border border-zinc-200 font-bold text-zinc-900 tracking-wide">
                  {code.code}
                </span>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full">
                  {code.usedCount} {code.maxUses ? `/ ${code.maxUses}` : "utilisés"}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
                  <div className="p-2 bg-white rounded-full">
                    {code.discountPercent ? <Percent size={16} /> : <Gift size={16} />}
                  </div>
                  {code.discountPercent ? `${code.discountPercent}% de réduction` : `${code.freePremiumDays} jours VIP offerts`}
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200/60">
                  <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                    <Calendar size={14} />
                    {code.expiresAt ? new Intl.DateTimeFormat("fr-FR").format(new Date(code.expiresAt)) : "Sans expiration"}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL : CRÉATION DE CODE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-zinc-50 rounded-full"><Plus size={20} /></div>
                Créer un code
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="create-promo-form" onSubmit={submit} className="flex flex-col gap-5">
                
                <Input
                  required
                  label="Code promotionnel (ex: RENTREE26)"
                  placeholder="CODE..."
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  leftIcon={<Tag size={18} />}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Remise (%)"
                    placeholder="0-100"
                    min="0" max="100"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    leftIcon={<Percent size={18} />}
                  />
                  <Input
                    type="number"
                    label="Jours Offerts"
                    placeholder="Ex: 30"
                    min="0"
                    value={form.freePremiumDays}
                    onChange={(e) => setForm({ ...form, freePremiumDays: e.target.value })}
                    leftIcon={<Gift size={18} />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Usages maximum"
                    placeholder="Illimité si vide"
                    min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    leftIcon={<Users size={18} />}
                  />
                  <Input
                    type="datetime-local"
                    label="Date d'expiration"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    leftIcon={<Calendar size={18} />}
                  />
                </div>

                {/* NOUVEAU SYSTÈME D'EMAILS */}
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <label className="text-sm font-medium text-zinc-900 px-2 flex items-center justify-between">
                    Restriction par Email
                    <span className="text-[10px] bg-zinc-100 px-2 py-1 rounded-full text-zinc-500 uppercase tracking-wider">Optionnel</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="utilisateur@domaine.com"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={handleAddEmail}>
                      Ajouter
                    </Button>
                  </div>

                  {allowedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      {allowedEmails.map((email) => (
                        <span key={email} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                          {email}
                          <X 
                            size={14} 
                            className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" 
                            onClick={() => removeEmail(email)}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-100 shrink-0 bg-zinc-50/50">
              <Button type="submit" form="create-promo-form" variant="primary" isLoading={isSubmitting} fullWidth>
                Générer le code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : DÉTAILS D'UTILISATION (REDEMPTIONS) */}
      {selectedCodeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            <div className="p-6 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Ticket size={20} className="text-zinc-400" />
                  Historique d'utilisation
                </h2>
                <p className="text-xs font-medium text-zinc-500 mt-1">
                  Membres ayant réclamé ce code
                </p>
              </div>
              <button 
                onClick={() => setSelectedCodeId(null)}
                className="p-2 bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {redemptionsLoading ? (
                <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-zinc-900" size={24} /></div>
              ) : redemptions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {redemptions.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-zinc-600 border border-zinc-200">
                           {item.email.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-zinc-800">{item.email}</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium bg-white px-2 py-1 rounded-full border border-zinc-100">
                        {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(item.redeemedAt))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center">
                   <div className="bg-zinc-50 p-4 rounded-full mb-3"><Users size={24} className="text-zinc-300" /></div>
                   <p className="text-sm font-medium text-zinc-500">Ce code n'a pas encore été utilisé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
