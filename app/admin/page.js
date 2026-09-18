"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/admin/summary", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando…
      </div>
    );
  if (denied)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white text-sm">
        No tienes acceso de administrador.
      </div>
    );

  return (
    <main className="min-h-screen bg-paper text-[#1B2A22] p-8">
      <h1 className="font-display text-2xl mb-1">Panel de administración</h1>
      <p className="text-sm text-[#5b6b60] mb-6">Vista global de todos los negocios en Flypax.</p>

      <div className="grid grid-cols-4 gap-3.5 mb-8">
        <Kpi label="Negocios" value={data.totalBusinesses} />
        <Kpi label="Reservas totales" value={data.totalReservations} />
        <Kpi label="Pedidos en mesa" value={data.totalOrders} />
        <Kpi label="Ingresos facturados" value={`${data.totalRevenue}€`} />
      </div>

      <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">Negocios registrados</div>
        {data.businesses.map((b) => (
          <Link
            key={b.id}
            href={`/admin/${b.id}`}
            className="px-5 py-3 border-b border-black/10 last:border-0 flex items-center justify-between text-sm hover:bg-[#F0ECE1] transition"
          >
            <div className="flex items-center gap-2">
              <span>{b.icon}</span>
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-[#5b6b60]">{b.city || "—"} · /{b.slug}</div>
              </div>
            </div>
            <span className="text-xs text-[#5b6b60]">
              {new Date(b.created_at).toLocaleDateString("es-ES")}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-4">
      <div className="text-xs text-[#5b6b60] font-semibold mb-2">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}