"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { BusinessContext } from "@/lib/BusinessContext";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categoryConfig";

const NAV = [
  { href: "/panel", label: "Resumen", icon: "🏠" },
  { href: "/panel/reservas", label: "Reservas", icon: "📅" },
  { href: "/panel/pedidos", label: "Pedidos en mesa", icon: "🍽️", requires: "hasTableOrders" },
  { href: "/panel/carta", label: "Carta y productos", icon: "📋" },
  { href: "/panel/qr", label: "Código QR", icon: "🔳" },
  { href: "/panel/facturas", label: "Facturas", icon: "🧾" },
  { href: "/panel/clientes", label: "Clientes", icon: "👥" },
  { href: "/panel/ajustes", label: "Ajustes", icon: "⚙️" },
];

export default function PanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        router.push("/onboarding");
        return;
      }

      setBusiness(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando tu panel…
      </div>
    );
  }

  const cfg = CATEGORY_CONFIG[business.category_id] || CATEGORY_CONFIG.otro;
  const categoryLabel = CATEGORIES.find((c) => c.id === business.category_id)?.label || business.category_id;
  const nav = NAV.filter((n) => !n.requires || cfg[n.requires]);

  return (
    <BusinessContext.Provider value={{ business, setBusiness, cfg }}>
      <div className="min-h-screen bg-paper text-[#1B2A22] grid grid-cols-[250px_1fr]">
        <aside className="bg-ink text-[#F4EFE3] p-5 flex flex-col">
          <div className="mb-6 px-1">
            <img src="/logo.png" alt="Flypax" className="h-6 w-auto" />
          </div>

          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2.5 mb-5">
            <span className="w-9 h-9 rounded-lg bg-mustard flex items-center justify-center text-base flex-shrink-0">
              {business.icon}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight truncate">{business.name}</div>
              <div className="text-xs text-white/50">{categoryLabel}</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === n.href ? "bg-white/10 text-white" : "text-white/65"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="border border-white/15 rounded-xl p-3 text-xs text-white/55 mb-2">
            <b className="text-mustard block font-display text-sm mb-0.5">19,99€/mes</b>
            Plan Flypax
          </div>
          <button onClick={handleLogout} className="text-white/40 text-xs text-left px-1">
            Cerrar sesión
          </button>
        </aside>

        <main className="p-8 max-w-5xl">{children}</main>
      </div>
    </BusinessContext.Provider>
  );
}