import { useState } from "react";
import { useUpdates } from "../model/use_updates";
import { useToast } from "@/providers/toast/toastContext";
import {
  Plus,
  Calendar,
  Cpu,
  Link as LinkIcon,
  Loader2,
  X,
  PlusCircle,
  Trash2,
  Smartphone,
  RefreshCw,
} from "lucide-react";

export function UpdatesFeat() {
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [version, setVersion] = useState("");
  const [type, setType] = useState<"auto" | "manual">("auto");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("low");
  const [minSdkVersion, setMinSdkVersion] = useState("24");
  const [isRequired, setIsRequired] = useState(false);
  const [changelogs, setChangelogs] = useState<string[]>([""]);
  
  // Platform toggles and link inputs
  const [enableAndroid, setEnableAndroid] = useState(false);
  const [androidLink, setAndroidLink] = useState("");
  const [enableIos, setEnableIos] = useState(false);
  const [iosLink, setIosLink] = useState("");

  const { showToast } = useToast();
  const { updates, loading, error, createUpdate, actionLoading } = useUpdates();

  const handleOpenModal = () => {
    setVersion("");
    setType("auto");
    setSeverity("low");
    setMinSdkVersion("24");
    setIsRequired(false);
    setChangelogs([""]);
    setEnableAndroid(false);
    setAndroidLink("");
    setEnableIos(false);
    setIosLink("");
    setModalOpen(true);
  };

  const handleAddChangelog = () => {
    setChangelogs([...changelogs, ""]);
  };

  const handleUpdateChangelog = (index: number, val: string) => {
    const updated = [...changelogs];
    updated[index] = val;
    setChangelogs(updated);
  };

  const handleRemoveChangelog = (index: number) => {
    const updated = changelogs.filter((_, idx) => idx !== index);
    setChangelogs(updated.length > 0 ? updated : [""]);
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!version.match(/^\d+\.\d+(\.\d+)?$/)) {
      showToast({
        type: "error",
        message: "Format de version invalide. Exemple: 1.0.0",
        duration: 4000,
      });
      return;
    }

    const filteredChangelogs = changelogs
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (filteredChangelogs.length === 0) {
      showToast({
        type: "error",
        message: "Veuillez entrer au moins un point de changelog.",
        duration: 4000,
      });
      return;
    }

    const links = [];
    if (enableAndroid) {
      if (!androidLink.trim()) {
        showToast({
          type: "error",
          message: "Veuillez renseigner le lien Android ou désactiver la plateforme.",
          duration: 4000,
        });
        return;
      }
      if (!androidLink.trim().startsWith("http")) {
        showToast({
          type: "error",
          message: "Lien Android invalide. Doit commencer par http:// ou https://",
          duration: 4000,
        });
        return;
      }
      links.push({ platform: "android" as const, link: androidLink.trim() });
    }

    if (enableIos) {
      if (!iosLink.trim()) {
        showToast({
          type: "error",
          message: "Veuillez renseigner le lien iOS ou désactiver la plateforme.",
          duration: 4000,
        });
        return;
      }
      if (!iosLink.trim().startsWith("http")) {
        showToast({
          type: "error",
          message: "Lien iOS invalide. Doit commencer par http:// ou https://",
          duration: 4000,
        });
        return;
      }
      links.push({ platform: "ios" as const, link: iosLink.trim() });
    }

    try {
      await createUpdate({
        version,
        type,
        severity,
        minSdkVersion,
        isRequired,
        changelog: filteredChangelogs,
        links,
      });
      setModalOpen(false);
    } catch {
      // Toast notification is managed inside useUpdates mutate handler
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
            Gestion des Mises à Jour
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Supervisez et déployez les versions de l'application client (OTA / Store)
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-200 active:scale-[0.98] shadow-md shadow-orange-500/10 cursor-pointer w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Nouvelle Version</span>
        </button>
      </div>

      {/* UPDATES LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white/60 border border-white/80 rounded-2xl p-12 text-center text-zinc-400 shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
            <div className="flex justify-center items-center space-x-2">
              <Loader2 className="animate-spin text-orange-500" size={18} strokeWidth={2.5} />
              <span className="text-xs font-semibold">Chargement des versions...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl">
            Erreur lors de la récupération des mises à jour: {(error as any).message || "Problème réseau."}
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white/60 border border-white/80 rounded-2xl p-12 text-center text-zinc-400 text-xs font-medium shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
            Aucune mise à jour publiée pour le moment.
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-white/60 border border-white/80 rounded-2xl p-6 shadow-sm shadow-zinc-200/40 backdrop-blur-xl flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-zinc-200 transition-all duration-200"
            >
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-800">v{update.version}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    update.type === "auto"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}>
                    Type: {update.type === "auto" ? "Automatique (Silent)" : "Manuel (Store)"}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    update.severity === "critical"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : update.severity === "high"
                      ? "bg-orange-50 text-orange-700 border-orange-100"
                      : update.severity === "medium"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200"
                  }`}>
                    Gravité: {update.severity}
                  </span>
                  {update.isRequired && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-red-100/50 text-red-700 border-red-200">
                      Obligatoire
                    </span>
                  )}
                </div>

                <div className="bg-zinc-50/50 border border-zinc-200/40 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Nouveautés & Corrections
                  </h4>
                  <ul className="space-y-1">
                    {update.changelog.map((item, idx) => (
                      <li key={idx} className="text-xs text-zinc-600 font-medium flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={13} className="text-zinc-400" />
                    <span>Publié le: {formatDate(update.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Cpu size={13} className="text-zinc-400" />
                    <span>SDK Min: {update.minSdkVersion}</span>
                  </div>
                </div>
              </div>

              <div className="md:w-64 flex-shrink-0 flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Liens de téléchargement
                </h4>
                {update.links && update.links.length > 0 ? (
                  update.links.map((lnk, idx) => (
                    <a
                      key={idx}
                      href={lnk.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-semibold text-zinc-600 transition-colors"
                    >
                      <LinkIcon size={12} className="text-zinc-400" />
                      <span className="capitalize">{lnk.platform}:</span>
                      <span className="truncate text-zinc-400 font-medium flex-1">{lnk.link}</span>
                    </a>
                  ))
                ) : (
                  <div className="text-[11px] text-zinc-400 italic">
                    Aucun lien de redirection configuré.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE UPDATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white/95 border border-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh] flex flex-col">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-4 border border-orange-500/20">
              <RefreshCw size={20} />
            </div>

            <h3 className="text-base font-bold text-zinc-800">Publier une mise à jour</h3>
            <p className="text-xs text-zinc-500 font-medium mt-1 mb-6">
              Déployez une nouvelle version avec un ciblage précis et des notes claires.
            </p>

            <form onSubmit={handleCreateUpdate} className="space-y-5 text-left flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Numéro de version
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 1.0.2"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    SDK Minimum requis
                  </label>
                  <input
                    type="text"
                    required
                    value={minSdkVersion}
                    onChange={(e) => setMinSdkVersion(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white/50 px-3 py-2.5 text-xs text-zinc-800 focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Type de mise à jour
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("auto")}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      type === "auto"
                        ? "border-orange-500/80 bg-orange-500/5 ring-1 ring-orange-500/20"
                        : "border-zinc-200 bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${type === "auto" ? "bg-orange-500" : "bg-zinc-300"}`} />
                      <span className="text-xs font-bold text-zinc-800">Automatique (OTA)</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-medium">
                      Installation silencieuse en arrière-plan. Appliquée au prochain démarrage.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("manual")}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      type === "manual"
                        ? "border-orange-500/80 bg-orange-500/5 ring-1 ring-orange-500/20"
                        : "border-zinc-200 bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${type === "manual" ? "bg-orange-500" : "bg-zinc-300"}`} />
                      <span className="text-xs font-bold text-zinc-800">Manuelle (Store)</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-medium">
                      Invite l'utilisateur à se rendre sur les stores d'applications officiels.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Niveau de gravité
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: "low", label: "Faible", activeClass: "border-zinc-400 bg-zinc-50 text-zinc-800 ring-zinc-500/10" },
                    { val: "medium", label: "Moyenne", activeClass: "border-yellow-400 bg-yellow-500/5 text-yellow-700 ring-yellow-500/10" },
                    { val: "high", label: "Élevée", activeClass: "border-orange-400 bg-orange-500/5 text-orange-700 ring-orange-500/10" },
                    { val: "critical", label: "Critique", activeClass: "border-red-400 bg-red-500/5 text-red-700 ring-red-500/10" }
                  ].map((item) => {
                    const isSelected = severity === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setSeverity(item.val as any)}
                        className={`py-2 rounded-xl border text-center transition-all duration-200 cursor-pointer text-xs font-bold ${
                          isSelected ? item.activeClass + " ring-1" : "bg-white/50 border-zinc-200 hover:bg-white text-zinc-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-50/50 border border-zinc-200/40 rounded-xl p-3.5">
                <div className="flex-1">
                  <label htmlFor="isRequired" className="text-xs font-bold text-zinc-700 cursor-pointer block">
                    Mise à jour obligatoire
                  </label>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Restreint l'utilisation de l'application tant que la version n'est pas installée.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequired(!isRequired)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isRequired ? "bg-orange-500" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isRequired ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Notes de mise à jour (Changelog)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChangelog}
                    className="flex items-center space-x-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 cursor-pointer transition-colors"
                  >
                    <PlusCircle size={14} />
                    <span>Ajouter un point</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {changelogs.map((cl, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-white border border-zinc-200/80 rounded-xl p-2.5 shadow-sm transition-all duration-200 hover:border-zinc-300">
                      <span className="text-[10px] font-bold text-zinc-400 select-none px-1">{idx + 1}</span>
                      <input
                        type="text"
                        required
                        placeholder="ex: Amélioration des performances du module de chat..."
                        value={cl}
                        onChange={(e) => handleUpdateChangelog(idx, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChangelog(idx)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-zinc-50/50 border border-zinc-200/40 rounded-2xl p-4">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Liaison Plateformes (Facultatif)
                </h4>
                
                <div className="space-y-2 border-b border-zinc-200/50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone size={14} className="text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-700">Lien Android (APK / Google Play)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableAndroid(!enableAndroid)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableAndroid ? "bg-orange-500" : "bg-zinc-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableAndroid ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  {enableAndroid && (
                    <input
                      type="url"
                      required
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      value={androidLink}
                      onChange={(e) => setAndroidLink(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:outline-none transition-all duration-200"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone size={14} className="text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-700">Lien iOS (TestFlight / App Store)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableIos(!enableIos)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableIos ? "bg-orange-500" : "bg-zinc-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableIos ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  {enableIos && (
                    <input
                      type="url"
                      required
                      placeholder="https://apps.apple.com/app/..."
                      value={iosLink}
                      onChange={(e) => setIosLink(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:outline-none transition-all duration-200"
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-zinc-200/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/10 transition-all cursor-pointer"
                >
                  {actionLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Créer la version</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
