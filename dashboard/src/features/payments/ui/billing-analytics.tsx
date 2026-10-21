import { useQuery } from "@tanstack/react-query";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { useState } from "react";
import { api } from "@/share/lib/api";
import { Loader2, Activity } from "lucide-react";
import { Select } from "@/share/ui/Select";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const timeOptions = [
  { value: "6", label: "6 derniers mois" },
  { value: "12", label: "12 derniers mois", default: true },
  { value: "24", label: "24 derniers mois" },
];

export function BillingAnalytics() {
  const [months, setMonths] = useState("12");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["billing-stats", months],
    queryFn: () => api.getBillingStats(Number(months)),
  });

  if (error) return null;

  if (isLoading || !data) {
    return (
      <div className="h-[350px] bg-zinc-50 rounded-[2rem] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-sm font-medium">Analyse des revenus en cours...</span>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      
      {/* GRAPHIQUE LIGNE (MRR) */}
      <section className="rounded-[2rem] bg-zinc-50 p-6 md:p-8 flex flex-col">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Évolution du MRR</h2>
            <p className="text-sm font-medium text-zinc-500">Encaissements récurrents mensuels confirmés.</p>
          </div>
          <div className="w-48 shrink-0">
            <Select
              data={timeOptions}
              value={months}
              onChange={setMonths}
            />
          </div>
        </div>
        
        <div className="flex-1 min-h-[250px]">
          <Line
            data={{
              labels: data.timeline.map((item) => item.period),
              datasets: [{
                label: "MRR (XAF)",
                data: data.timeline.map((item) => item.mrr),
                borderColor: "#09090b", // zinc-950
                backgroundColor: "transparent",
                borderWidth: 3,
                tension: 0.4, // Courbes douces
                pointBackgroundColor: "#fff",
                pointBorderColor: "#09090b",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { 
                  beginAtZero: true, 
                  grid: { color: "#f4f4f5" }, // zinc-100
                  border: { display: false }
                },
              },
            }}
          />
        </div>
      </section>

      {/* GRAPHIQUE CIRCULAIRE (PLANS) */}
      <section className="rounded-[2rem] bg-zinc-50 p-6 md:p-8 flex flex-col">
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">Plans souscrits</h2>
        <p className="text-sm font-medium text-zinc-500 mb-8">Répartition des abonnements actifs.</p>
        
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          {data.plans.length === 0 ? (
            <div className="flex flex-col items-center text-zinc-400 gap-2">
              <Activity size={32} />
              <span className="text-sm">Aucune donnée</span>
            </div>
          ) : (
            <Doughnut
              data={{
                labels: data.plans.map((item) => item.plan),
                datasets: [{
                  data: data.plans.map((item) => item.count),
                  // Palette monochrome néo-banque : Noir, Gris foncé, Gris clair
                  backgroundColor: ["#09090b", "#71717a", "#e4e4e7"], 
                  borderWidth: 0,
                  hoverOffset: 4,
                }],
              }}
              options={{ 
                cutout: "75%", // Anneau fin
                plugins: { 
                  legend: { position: "bottom", labels: { usePointStyle: true, padding: 20 } } 
                } 
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}