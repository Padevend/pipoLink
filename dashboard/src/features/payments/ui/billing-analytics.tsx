import { useQuery } from "@tanstack/react-query";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import { useState } from "react";
import { api } from "@/share/lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export function BillingAnalytics() {
  const [months, setMonths] = useState(12);
  const { data, isLoading } = useQuery({ queryKey: ["billing-stats", months], queryFn: () => api.getBillingStats(months) });
  if (isLoading || !data) return <div className="rounded-2xl bg-white/60 p-8 text-sm text-zinc-400">Chargement des analyses…</div>;
  return <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
    <section className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-zinc-800">Évolution du MRR</h2><p className="text-xs text-zinc-400">Encaissements récurrents confirmés</p></div><select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs"><option value={6}>6 mois</option><option value={12}>12 mois</option><option value={24}>24 mois</option></select></div>
      <Line data={{ labels: data.timeline.map((item) => item.period), datasets: [{ label: "MRR (XAF)", data: data.timeline.map((item) => item.mrr), borderColor: "#f97316", backgroundColor: "#f9731620", tension: .35, fill: true }] }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
    </section>
    <section className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl"><h2 className="mb-4 font-bold text-zinc-800">Répartition des plans</h2><Doughnut data={{ labels: data.plans.map((item) => item.plan), datasets: [{ data: data.plans.map((item) => item.count), backgroundColor: ["#f97316", "#a1a1aa", "#52525b"] }] }} options={{ plugins: { legend: { position: "bottom" } } }} /></section>
  </div>;
}
