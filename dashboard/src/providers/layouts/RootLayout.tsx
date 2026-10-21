import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/providers/auth/authContext";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { AppLogo } from "@/share/ui/AppLogo";

export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen animate-pulse flex flex-col items-center justify-center bg-white space-y-3">
        <AppLogo size={40} withName={false} />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="flex h-screen bg-white text-zinc-900 font-sans overflow-hidden">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50 rounded-l-none md:rounded-l-[2rem] md:border-l md:border-zinc-200">
        
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
          <AppLogo size={20} />
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}