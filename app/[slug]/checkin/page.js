"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CheckinPage({ params }) {
  const { slug } = params;
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [matches, setMatches] = useState([]);
  const [searched, setSearched] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: biz } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
      if (!biz) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBusiness(biz);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleSearch() {
    if (!name.trim() || !business) return;
    setSearched(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("business_id", business.id)
      .eq("date", today)
      .ilike("client_name", "%" + name.trim() + "%")
      .neq("status", "cancelada")
      .order("time", { ascending: true });
    setMatches(data || []);
  }

  async function handleCheckin(id) {
    setCheckingId(id);
    await supabase.from("reservations").update({ checked_in_at: new Date().toISOString() }).eq("id", id);
    setCheckingId(null);
    setDone(true);
  }

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-white/50 bg-ink">
        Cargando...
      </main>
    );
  if (notFound)
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-ink">
        <p>Este negocio no existe.</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-[#1E332B] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Flypax" className="h-6 w-auto" />
        </div>
        <h1 className="font-display text-xl mb-2 text-center">
          {business.icon} {business.name}
        </h1>
        <p className="text-white/55 text-sm mb-6 text-center">
          Marca tu llegada para tu cita de hoy.
        </p>

        {done ? (
          <div className="text-center">
            <p className="font-display text-lg mb-1">¡Listo!</p>
            <p className="text-sm text-white/60">Hemos avisado en recepcion. Te atenderan en breve.</p>
          </div>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3"
            />
            <button
              onClick={handleSearch}
              className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm mb-4"
            >
              Buscar mi cita
            </button>

            {searched && matches.length === 0 && (
              <p className="text-sm text-white/40 text-center">
                No encontramos ninguna cita hoy con ese nombre.
              </p>
            )}

            {matches.map((r) => (
              <div
                key={r.id}
                className="bg-[#16231D] border border-white/10 rounded-xl p-4 mb-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-sm">{r.client_name}</div>
                  <div className="text-xs text-white/50">{r.time}</div>
                </div>
                {r.checked_in_at ? (
                  <span className="text-xs font-bold text-green-400">Ya registrada</span>
                ) : (
                  <button
                    onClick={() => handleCheckin(r.id)}
                    disabled={checkingId === r.id}
                    className="bg-mustard text-ink font-semibold px-4 py-2 rounded-full text-xs disabled:opacity-60"
                  >
                    {checkingId === r.id ? "..." : "He llegado"}
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}