import Sidebar from "@/share/components/sidebar";
import { Outlet, Navigate } from "react-router-dom";
import { api } from "@/share/lib/api";

export default function RootLayout() {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="flex h-screen bg-zinc-100 text-zinc-900 font-sans overflow-hidden">
            {/* Sidebar gauche avec effet de transparence floutée */}
            <Sidebar />
            
            {/* Zone principale à droite */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-zinc-50/40">
                
                {/* Formes lumineuses d'arrière-plan (Accent Orange + Base Zinc) */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-zinc-300/40 rounded-full blur-[120px] pointer-events-none" />
                
                {/* Contenu applicatif dynamique injecté ici */}
                <div className="flex-1 overflow-y-auto p-8 z-10">
                    <Outlet />
                </div>
            </div>
        </main>
    );
}