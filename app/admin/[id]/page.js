"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminBusinessDetail({ params }) {
  const router = useRouter();
  const { id } = params;
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
      const res = await fetch("/api/admin/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.access_token, businessId: id }),
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
  }, [id, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando…
      </div>
    );
  if (denied || !data?.business)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white text-sm">
        No tienes acceso o el negocio no existe.
      </div>
    );

  const { business, products, reservations, orders, invoices } = data;

  return (
    <main className="min-h-screen bg-paper text-[#1B2A22] p-8">
      <Link href="/admin" className="text-sm font-semibold text-[#5b6b60] mb-4 inline-block">
        ← Volver al listado
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-mustard flex items-center justify-center text-2xl">
            {business.icon}
          </span>
          <div>
            <h1 className="font-display text-2xl">{business.name}</h1>
            <p className="text-sm text-[#5b6b60]">
              {business.category_id} · {business.city || "sin ciudad"}
            </p>
          </div>
        </div>
        
          href={`/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm"
        >
          Ver página pública →
        </a>
      </div>

      <div className="grid grid-cols-4 gap-3.5 mb-8">
        <Kpi label="Productos" value={products.length} />
        <Kpi label="Reservas" value={reservations.length} />
        <Kpi label="Pedidos en mesa" value={orders.length} />
        <Kpi label="Facturas" value={invoices.length} />
      </div>

      <Section title="Carta y productos">
        {products.length === 0 ? (
          <Empty text="Sin productos todavía." />
        ) : (
          products.map((p) => (
            <Row key={p.id} left={`${p.emoji} ${p.name}`} sub={p.category} right={`${p.price}€`} />
          ))
        )}
      </Section>

      <Section title="Reservas">
        {reservations.length === 0 ? (
          <Empty text="Sin reservas todavía." />
        ) : (
          reservations.map((r) => (
            <Row
              key={r.id}
              left={r.client_name}
              sub={`${r.date} · ${r.time}${r.people ? ` · ${r.people} personas` : r.detail ? ` · ${r.detail}` : ""}`}
              right={r.status}
            />
          ))
        )}
      </Section>

      {orders.length > 0 && (
        <Section title="Pedidos en mesa">
          {orders.map((o) => (
            <Row
              key={o.id}
              left={`Mesa ${o.table_number}`}
              sub={(o.items || []).map((l) => `${l.qty}× ${l.name}`).join(", ")}
              right={`${o.total}€ · ${o.status}`}
            />
          ))}
        </Section>
      )}

      <Section title="Facturas">
        {invoices.length === 0 ? (
          <Empty text="Sin facturas todavía." />
        ) : (
          invoices.map((i) => (
            <Row
              key={i.id}
              left={i.client_name}
              sub={i.date}
              right={`${Number(i.total).toFixed(2)}€ · ${i.paid ? "Cobrada" : "Pendiente"}`}
            />
          ))
        )}
      </Section>
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

function Section({ title, children }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">{title}</div>
      {children}
    </div>
  );
}

function Row({ left, sub, right }) {
  return (
    <div className="px-5 py-3 border-b border-black/10 last:border-0 flex items-center justify-between text-sm gap-4">
      <div className="min-w-0">
        <div className="font-semibold truncate">{left}</div>
        {sub && <div className="text-xs text-[#5b6b60] mt-0.5">{sub}</div>}
      </div>
      <div className="text-xs font-semibold flex-shrink-0">{right}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="py-10 text-center text-sm text-[#8a958d]">{text}</div>;
}