"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

export default function ClientesPage() {
  const { business } = useBusiness();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("client_name, client_phone, date, created_at")
        .eq("business_id", business.id);

      const { data: orders } = await supabase
        .from("orders")
        .select("client_name, total, paid, created_at")
        .eq("business_id", business.id);

      const map = {};

      (reservations || []).forEach((r) => {
        const key = (r.client_name || "Sin nombre").trim().toLowerCase();
        if (!map[key]) {
          map[key] = {
            name: r.client_name || "Sin nombre",
            phone: r.client_phone || null,
            reservations: 0,
            orders: 0,
            spent: 0,
            lastActivity: r.created_at,
          };
        }
        map[key].reservations += 1;
        if (r.client_phone && !map[key].phone) map[key].phone = r.client_phone;
        if (new Date(r.created_at) > new Date(map[key].lastActivity)) {
          map[key].lastActivity = r.created_at;
        }
      });

      (orders || []).forEach((o) => {
        const key = (o.client_name || "Sin nombre").trim().toLowerCase();
        if (!map[key]) {
          map[key] = {
            name: o.client_name || "Sin nombre",
            phone: null,
            reservations: 0,
            orders: 0,
            spent: 0,
            lastActivity: o.created_at,
          };
        }
        map[key].orders += 1;
        if (o.paid) map[key].spent += Number(o.total) || 0;
        if (new Date(o.created_at) > new Date(map[key].lastActivity)) {
          map[key].lastActivity = o.created_at;
        }
      });

      const list = Object.values(map).sort(
        (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
      );
      setClients(list);
      setLoading(false);
    }
    load();
  }, [business.id]);

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl">Clientes</h1>
        <p className="text-sm text-[#5b6b60] mt-1">
          Se genera automaticamente a partir de tus reservas y pedidos - no necesitas dar de alta a nadie.
        </p>
      </div>

      {loading ? (
        <div className="h-40 bg-white border border-black/10 rounded-xl animate-pulse" />
      ) : clients.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl p-6 text-sm text-[#5b6b60]">
          Todavia no tienes reservas ni pedidos de clientes.
        </div>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-[#8a958d] uppercase">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Telefono</th>
                <th className="px-4 py-3 font-semibold">Reservas</th>
                <th className="px-4 py-3 font-semibold">Pedidos</th>
                <th className="px-4 py-3 font-semibold">Gastado</th>
                <th className="px-4 py-3 font-semibold">Ultima visita</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-[#5b6b60]">{c.phone || "-"}</td>
                  <td className="px-4 py-3">{c.reservations}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 text-mustard font-semibold">
                    {c.spent > 0 ? c.spent.toFixed(2) + " EUR" : "-"}
                  </td>
                  <td className="px-4 py-3 text-[#8a958d]">
                    {new Date(c.lastActivity).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}