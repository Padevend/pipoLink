import { useState } from "react";
import { useRouteError, Link } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { Home, AlertCircle, Menu } from "lucide-react";
import { AppLogo } from "@/share/ui/AppLogo";

export default function ErrorLayout() {
  const error = useRouteError() as any;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="flex h-screen bg-white text-zinc-900 font-sans overflow-hidden">
      
      {/* SIDEBAR (Responsive) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50 md:rounded-l-[2rem] md:border-l md:border-zinc-200">
        
        {/* HEADER MOBILE */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
          <AppLogo size={20} />
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </header>

        {/* CONTENU DE L'ERREUR */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-12 text-center flex flex-col items-center">
            
            {/* Icône d'alerte */}
            <div className="h-20 w-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={36} className="text-zinc-900" strokeWidth={2} />
            </div>

            {/* Titre et Status */}
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-4">
              {error?.status || "Erreur"}
            </h1>
            
            <p className="text-base font-medium text-zinc-500 mb-8 max-w-sm">
              {error?.statusText || error?.message || "Une erreur inattendue s'est produite lors de l'accès à cette page."}
            </p>

            {/* Log développeur (Optionnel) */}
            {error?.data && (
              <div className="w-full bg-zinc-50 rounded-2xl p-4 mb-8 text-left border border-zinc-100 max-h-40 overflow-y-auto custom-scrollbar">
                <p className="font-mono text-xs text-zinc-500 break-words whitespace-pre-wrap">
                  {typeof error.data === "string" ? error.data : JSON.stringify(error.data, null, 2)}
                </p>
              </div>
            )}

            {/* Bouton de retour */}
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-semibold text-base bg-zinc-900 text-white hover:bg-black transition-transform active:scale-[0.98] w-full sm:w-auto"
            >
              <Home size={20} />
              <span>Retourner à l'accueil</span>
            </Link>

          </div>
        </div>

      </div>
    </main>
  );
}