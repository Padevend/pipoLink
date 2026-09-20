import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/share/lib/api";

export function PromoCodesPanel() {
  const client = useQueryClient();
  const { data: codes = [] } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: api.getPromoCodes,
  });
  const [form, setForm] = useState({
    code: "",
    discountPercent: "",
    freePremiumDays: "",
    maxUses: "",
    expiresAt: "",
    allowedEmails: "",
  });
  const [selected, setSelected] = useState<string | null>(null);
  const { data: redemptions = [] } = useQuery({
    queryKey: ["promo-redemptions", selected],
    queryFn: () => api.getPromoRedemptions(selected!),
    enabled: Boolean(selected),
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await api.createPromoCode({
      code: form.code,
      discountPercent: Number(form.discountPercent || 0),
      freePremiumDays: Number(form.freePremiumDays || 0),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      allowedEmails: form.allowedEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean),
    });
    client.invalidateQueries({ queryKey: ["promo-codes"] });
    setForm({
      code: "",
      discountPercent: "",
      freePremiumDays: "",
      maxUses: "",
      expiresAt: "",
      allowedEmails: "",
    });
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm"
      >
        <h2 className="font-bold text-zinc-800">Créer un code promotionnel</h2>
        <input
          required
          placeholder="CODE2026"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            max="100"
            placeholder="Remise %"
            value={form.discountPercent}
            onChange={(e) =>
              setForm({ ...form, discountPercent: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          <input
            type="number"
            min="0"
            placeholder="Jours Premium gratuits"
            value={form.freePremiumDays}
            onChange={(e) =>
              setForm({ ...form, freePremiumDays: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <input
          type="number"
          min="1"
          placeholder="Nombre maximal d'usages"
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <input
          type="datetime-local"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <textarea
          placeholder="Emails autorisés, séparés par des virgules (vide = tous)"
          value={form.allowedEmails}
          onChange={(e) => setForm({ ...form, allowedEmails: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 min-h-20"
        />
        <button className="w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
          Créer le code
        </button>
      </form>
      <section className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-zinc-800">
          Codes actifs et historique
        </h2>
        <div className="space-y-2">
          {codes.map((code) => (
            <button
              key={code.id}
              onClick={() => setSelected(code.id)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 text-left hover:border-orange-200"
            >
              <span>
                <strong className="text-sm">{code.code}</strong>
                <span className="ml-2 text-xs text-zinc-400">
                  {code.discountPercent
                    ? `${code.discountPercent}%`
                    : `${code.freePremiumDays} jours gratuits`}
                </span>
              </span>
              <span className="text-xs text-zinc-500">
                {code.usedCount}
                {code.maxUses ? ` / ${code.maxUses}` : " usages"}
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-5 border-t pt-4">
            <h3 className="mb-2 text-sm font-bold">
              Utilisateurs ayant utilisé le code
            </h3>
            {redemptions.length ? (
              redemptions.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-1 text-xs"
                >
                  <span>{item.email}</span>
                  <span>
                    {new Date(item.redeemedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400">Aucune utilisation.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
