import Sidebar from "@/components/sidebar";
import { useRouteError, Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function ErrorLayout() {
  const error = useRouteError() as any;

  return (
    <main className="flex h-screen bg-zinc-50/50 select-none">
      <Sidebar />
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md bg-white/60 border border-white/80 rounded-3xl p-8 text-center shadow-sm shadow-zinc-200/40 backdrop-blur-xl">

          {/* Error Code & Title */}
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-800">
            {error?.status || "Erreur"}
          </h1>
          
          <p className="text-sm font-semibold text-zinc-500 mt-2 capitalize">
            {error?.statusText || "Une erreur inattendue est survenue."}
          </p>

          {/* Optional internal/message log for developer context */}
          {error?.data && (
            <p className="mt-4 p-3 rounded-xl bg-zinc-100 font-mono text-[10px] text-zinc-400 border border-zinc-200/60 max-h-24 overflow-y-auto text-left select-text">
              {typeof error.data === "string" ? error.data : JSON.stringify(error.data)}
            </p>
          )}

          {/* Action Button */}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-900 rounded-xl shadow-md shadow-zinc-800/10 transition-all duration-200 active:scale-[0.98]"
            >
              <Home size={14} />
              <span>Retour à l'accueil</span>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}