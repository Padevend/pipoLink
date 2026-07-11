import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const LoaderSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-50/60 backdrop-blur-md z-50">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="animate-spin text-orange-500" size={24} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
          Chargement...
        </span>
      </div>
    </div>
  );
};

export default function Loader() {
  return (
    <Suspense fallback={<LoaderSpinner />}>
      <Outlet />
    </Suspense>
  );
}
