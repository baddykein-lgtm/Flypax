"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

export default function ResumenPage() {
  const { business, cfg } = useBusiness();
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: res }, { data: ord }, { data: inv }, { count: prodCount }] = await Promise.all([
        supabase.from("reservations").select("*").eq("business_id", business.id).order("date", { ascending: true }),
        supabase.from("orders").select("*").eq("business_id", business.id).neq("status", "entregado"),
        supabase.from("invoices").select("*").eq("business_id", business.id),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      ]);
      setReservations(res || []);
      setOrders(ord || []);
      setInvoices(inv || []);
      setProductCount(prodCount || 0);
      setLoading(false);
    }
    load();
  }, [business.id]);

  if (loading) return <p className="text-sm text-[#5b6b60]">Cargando…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const hoy = reservations.filter((r) => r.date === today && r.status !== "cancelada");
  const pendientesFactura = invoices.filter((i) => !i.paid).length;
  const ingresos = invoices.filter((i) => i.paid).reduce((a, i) => a + Number(i.total), 0);
  const proximas = reservations.filter((r) => r.status !== "cancelada").slice(0, 5);

  return (
    <div>
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl">Buenas, {business.name}</h1>
          <p className="text-sm text-[#5b6b60] mt-1">Esto es lo que está pasando hoy en tu negocio.</p>
        </div>
        <Link
          href={`/${business.slug}`}
          target="_blank"
          className="border border-[#1B2A22]/15 px-4 py-2 rounded-full text-sm font-semibold"
        >
          Ver mi página pública
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-8">
        <Kpi label="Reservas hoy" value={hoy.length} />
        {cfg.hasTableOrders ? (
          <Kpi label="Pedidos en mesa activos" value={orders.length} />
        ) : (
          <Kpi label="Productos en tu carta" value={productCount} />
        )}
        <Kpi label="Ingresos cobrados" value={`${ingresos}€`} note="Total" />
        <Kpi label="Facturas pendientes" value={pendientesFactura} />
      </div>

      <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">Próximas reservas</div>
        {proximas.length ? (
          proximas.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 border-b border-black/10 last:border-0 flex justify-between items-center text-sm"
            >
              <div>
                <div className="font-semibold">{r.client_name}</div>
                <div className="text-xs text-[#5b6b60] mt-0.5">
                  {r.date} · {r.time}
                  {r.people != null
                    ? ` · ${r.people} persona${r.people > 1 ? "s" : ""}`
                    : r.detail
                    ? ` · ${r.detail}`
                    : ""}
                </div>
              </div>
              <StatusTag status={r.status} />
            </div>
          ))
        ) : (
          <div className="px-5 py-10 text-center text-sm text-[#8a958d]">
            Todavía no tienes reservas. Comparte tu link para recibir la primera.
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, note }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-4">
      <div className="text-xs text-[#5b6b60] font-semibold mb-2">{label}</div>
      <div className="font-display text-2xl">{value}</div>
      {note && <div className="text-xs text-green-700 mt-1">{note}</div>}
    </div>
  );
}

function StatusTag({ status }) {
  const map = {
    confirmada: "bg-green-100 text-green-700",
    pendiente: "bg-amber-100 text-amber-700",
    cancelada: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${map[status] || ""}`}>{status}</span>
  );
}