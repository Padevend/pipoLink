import { useState } from "react";
import { useUpdates } from "../model/use_updates";
import { useToast } from "@/providers/toast/toastContext";

// UI Components
import { Input } from "@/share/ui/Input";
import { Button } from "@/share/ui/Button";
import { Select } from "@/share/ui/Select";
import {
  Plus, Calendar, Cpu, Link as LinkIcon, Loader2, X, PlusCircle, Trash2, Smartphone, RefreshCw, Activity
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "auto", label: "Automatique (OTA)", desc: "Installation silencieuse" },
  { value: "manual", label: "Manuelle (Store)", desc: "Redirection vers les stores" }
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" }
];

export function UpdatesFeat() {
  const { showToast } = useToast();
  const { updates, loading, error, createUpdate, actionLoading } = useUpdates();
  const [modalOpen, setModalOpen] = useState(false);

  // État du formulaire unifié
  const [form, setForm] = useState({
    version: "", type: "auto" as "auto" | "manual", severity: "low" as any,
    minSdkVersion: "24", isRequired: false, changelogs: [""],
    enableAndroid: false, androidLink: "", enableIos: false, iosLink: "",
  });

  const updateForm = (key: keyof typeof form, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleOpenModal = () => {
    setForm({
      version: "", type: "auto", severity: "low", minSdkVersion: "24",
      isRequired: false, changelogs: [""], enableAndroid: false,
      androidLink: "", enableIos: false, iosLink: "",
    });
    setModalOpen(true);
  };

  const handleChangelogChange = (idx: number, val: string) => {
    const newLogs = [...form.changelogs];
    newLogs[idx] = val;
    updateForm("changelogs", newLogs);
  };

  const handleRemoveChangelog = (idx: number) => {
    const newLogs = form.changelogs.filter((_, i) => i !== idx);
    updateForm("changelogs", newLogs.length ? newLogs : [""]);
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.version.match(/^\d+\.\d+(\.\d+)?$/)) {
      return showToast({ type: "error", message: "Format invalide (ex: 1.0.0)" });
    }

    const filteredLogs = form.changelogs.map(l => l.trim()).filter(l => l.length > 0);
    if (filteredLogs.length === 0) {
      return showToast({ type: "error", message: "Un point de changelog requis." });
    }

    const links = [];
    for (const platform of ["Android", "Ios"] as const) {
      const isEnabled = form[`enable${platform}`];
      const linkVal = form[`${platform.toLowerCase()}Link` as keyof typeof form] as string;
      
      if (isEnabled) {
        if (!linkVal.trim() || !linkVal.startsWith("http")) {
          return showToast({ type: "error", message: `Lien ${platform} invalide.` });
        }
        links.push({ platform: platform.toLowerCase() as "android" | "ios", link: linkVal.trim() });
      }
    }

    try {
      await createUpdate({
        version: form.version, type: form.type, severity: form.severity,
        minSdkVersion: form.minSdkVersion, isRequired: form.isRequired,
        changelog: filteredLogs, links,
      });
      setModalOpen(false);
      showToast({ type: "success", message: "Mise à jour publiée." });
    } catch { /* Handled by hook */ }
  };

  const formatDate = (dateStr: string) => 
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));

  return (
    <div className="space-y-10 text-zinc-900 pb-10 h-full">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mises à Jour</h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">
            Déployez et gérez les versions de l'application client (OTA / Store).
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
          Nouvelle Version
        </Button>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-[2rem] font-medium flex items-center gap-3">
          <Activity size={20} />
          <span>Erreur réseau : {(error as any).message}</span>
        </div>
      )}

      {/* LISTE DES UPDATES */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-zinc-900 mb-4" size={32} />
            <p className="text-sm font-medium text-zinc-500">Chargement des versions...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-zinc-50 rounded-[2rem] py-24 flex flex-col items-center text-center">
            <div className="bg-white p-6 rounded-full mb-4 border border-zinc-100"><RefreshCw size={40} className="text-zinc-300" /></div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Aucune version publiée</h3>
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="bg-zinc-50 rounded-[2rem] p-6 md:p-8 flex flex-col xl:flex-row gap-8 border border-transparent hover:border-zinc-200 transition-colors">
              
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">v{update.version}</h3>
                  <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {update.type === "auto" ? "OTA" : "Store"}
                  </span>
                  <span className="bg-white border border-zinc-200 text-zinc-600 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                    Gravité: {update.severity}
                  </span>
                  {update.isRequired && (
                    <span className="border border-zinc-900 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold">
                      Obligatoire
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-zinc-100">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Nouveautés</h4>
                  <ul className="space-y-2">
                    {update.changelog.map((item, idx) => (
                      <li key={idx} className="text-sm text-zinc-700 font-medium flex items-start gap-2">
                        <span className="text-zinc-300 mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-6 text-sm text-zinc-500 font-medium">
                  <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(update.createdAt)}</span>
                  <span className="flex items-center gap-2"><Cpu size={16} /> SDK Min: {update.minSdkVersion}</span>
                </div>
              </div>

              {/* LINKS SECTION */}
              <div className="xl:w-72 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Téléchargement</h4>
                {update.links && update.links.length > 0 ? (
                  update.links.map((lnk, idx) => (
                    <a key={idx} href={lnk.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white hover:bg-zinc-100 border border-zinc-100 transition-colors">
                      <div className="bg-zinc-100 p-2 rounded-full"><LinkIcon size={14} className="text-zinc-600" /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize text-zinc-900">{lnk.platform}</p>
                        <p className="text-xs text-zinc-500 truncate">{lnk.link}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400 italic">Aucun lien externe.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL : CRÉER UNE MISE À JOUR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-zinc-50 rounded-full"><RefreshCw size={20} /></div>
                Publier une mise à jour
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <form id="update-form" onSubmit={handleCreateUpdate} className="space-y-6">
                
                {/* LIGNE 1 : VERSION & SDK */}
                <div className="grid grid-cols-2 gap-4">
                  <Input required label="Version (ex: 1.0.2)" placeholder="1.0.0" value={form.version} onChange={(e) => updateForm("version", e.target.value)} />
                  <Input required label="SDK Minimum" value={form.minSdkVersion} onChange={(e) => updateForm("minSdkVersion", e.target.value)} />
                </div>

                {/* LIGNE 2 : TYPE & GRAVITÉ */}
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Type de MAJ" data={TYPE_OPTIONS} value={form.type} onChange={(v) => updateForm("type", v)} />
                  <Select label="Gravité" data={SEVERITY_OPTIONS} value={form.severity} onChange={(v) => updateForm("severity", v)} />
                </div>

                {/* MAJ OBLIGATOIRE */}
                <div className="flex items-center justify-between bg-zinc-50 rounded-[2rem] p-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-900">Mise à jour obligatoire</label>
                    <p className="text-xs text-zinc-500">Bloque l'application tant qu'elle n'est pas installée.</p>
                  </div>
                  <button type="button" onClick={() => updateForm("isRequired", !form.isRequired)} className={`w-12 h-6 rounded-full transition-colors relative ${form.isRequired ? "bg-zinc-900" : "bg-zinc-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.isRequired ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* CHANGELOGS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-sm font-semibold text-zinc-900">Notes de version</label>
                    <button type="button" onClick={() => updateForm("changelogs", [...form.changelogs, ""])} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                      <PlusCircle size={14} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.changelogs.map((cl, idx) => (
                      <Input
                        key={idx} required placeholder="Ex: Correction de bugs..." value={cl}
                        onChange={(e) => handleChangelogChange(idx, e.target.value)}
                        rightIcon={
                          <button type="button" onClick={() => handleRemoveChangelog(idx)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* PLATEFORMES LINKS */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <label className="text-sm font-semibold text-zinc-900 px-2">Liens plateformes (Optionnel)</label>
                  
                  {/* ANDROID */}
                  <div className="bg-zinc-50 rounded-[2rem] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2"><Smartphone size={16}/> Android (APK / PlayStore)</span>
                      <button type="button" onClick={() => updateForm("enableAndroid", !form.enableAndroid)} className={`w-12 h-6 rounded-full transition-colors relative ${form.enableAndroid ? "bg-zinc-900" : "bg-zinc-200"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.enableAndroid ? "translate-x-7" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {form.enableAndroid && <Input type="url" required placeholder="https://..." value={form.androidLink} onChange={(e) => updateForm("androidLink", e.target.value)} />}
                  </div>

                  {/* IOS */}
                  <div className="bg-zinc-50 rounded-[2rem] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2"><Smartphone size={16}/> iOS (TestFlight / AppStore)</span>
                      <button type="button" onClick={() => updateForm("enableIos", !form.enableIos)} className={`w-12 h-6 rounded-full transition-colors relative ${form.enableIos ? "bg-zinc-900" : "bg-zinc-200"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.enableIos ? "translate-x-7" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {form.enableIos && <Input type="url" required placeholder="https://..." value={form.iosLink} onChange={(e) => updateForm("iosLink", e.target.value)} />}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-zinc-100 shrink-0 bg-white">
              <Button type="submit" form="update-form" variant="primary" isLoading={actionLoading} fullWidth>
                Déployer la version
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}