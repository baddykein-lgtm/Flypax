"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

const COLUMNS = [
  { status: "nuevo", label: "Nuevos", next: "preparando", action: "Empezar a preparar", color: "#D9704F" },
  { status: "preparando", label: "En preparacion", next: "listo", action: "Marcar listo", color: "#E3A542" },
  { status: "listo", label: "Listos para servir", next: "entregado", action: "Marcar entregado", color: "#7FA37A" },
];

export default function PedidosPage() {
  const { business } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("business_id", business.id)
      .neq("status", "entregado")
      .order("created_at", { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  async function advance(id, next) {
    await supabase.from("orders").update({ status: next }).eq("id", id);
    loadOrders();
  }

  if (loading) return <p className="text-sm text-[#5b6b60]">Cargando...</p>;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl">Pedidos en mesa</h1>
        <p className="text-sm text-[#5b6b60] mt-1">
          Lo que tus clientes piden desde la mesa, en tiempo real - como una comanda digital.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3.5">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="bg-white border border-black/10 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                <h3 className="text-xs font-bold text-[#5b6b60]">
                  {col.label} ({items.length})
                </h3>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-[#8a958d]">Nada por aqui</p>
              ) : (
                items.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-lg p-3 mb-2.5 border-l-4"
                    style={{ borderLeftColor: col.color, background: "#F0ECE1" }}
                  >
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>
                        Mesa {o.table_number}
                        {o.client_name ? " - " + o.client_name : ""}
                      </span>
                      <span>{Number(o.total).toFixed(2)}€</span>
                    </div>
                    <div className="text-xs text-[#5b6b60] mb-2">
                      {(o.items || []).map((l) => `${l.qty}x ${l.name}`).join(", ")}
                    </div>
                    <div className="text-xs mb-2">
                      {o.paid ? (
                        <span className="font-bold text-green-700">Pagado</span>
                      ) : (
                        <span className="font-bold text-amber-700">Cobrar en mesa</span>
                      )}
                    </div>
                    <button
                      onClick={() => advance(o.id, col.next)}
                      className="w-full bg-mustard text-ink font-semibold py-1.5 rounded-full text-xs"
                    >
                      {col.action}
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}