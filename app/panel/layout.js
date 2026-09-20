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

const ACTIVE_STATUSES = ["active", "trialing"];

export default function PanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [business, setBusiness] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState("");

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

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("business_id", data.id)
      .maybeSingle();

    setBusiness(data);
    setSubStatus(sub?.status || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleReactivate() {
    setReactivating(true);
    setReactivateError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          businessId: business.id,
          token: session.access_token,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setReactivateError(data.error || "No se pudo iniciar el pago. Inténtalo de nuevo.");
        setReactivating(false);
      }
    } catch (e) {
      setReactivateError("Error de conexión con el servidor");
      setReactivating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando tu panel…
      </div>
    );
  }

  if (!ACTIVE_STATUSES.includes(subStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white px-6">
        <div className="w-full max-w-sm bg-[#1E332B] border border-white/10 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
          </div>
          <h1 className="font-display text-xl mb-2">Tu suscripción no está activa</h1>
          <p className="text-white/55 text-sm mb-6">
            {subStatus
              ? "Tu plan de 19,99€/mes está marcado como " + subStatus + ". Reactívalo para volver a acceder a tu panel."
              : "Aún no vemos un pago confirmado para este negocio. Si acabas de pagar, puede tardar unos segundos — o reactívalo aquí."}
          </p>
          {reactivateError && <p className="text-red-400 text-xs mb-4">{reactivateError}</p>}
          <button
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60 mb-3"
          >
            {reactivating ? "Conectando con Stripe…" : "Reactivar suscripción"}
          </button>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="text-white/40 text-xs"
          >
            Ya pagué, volver a comprobar
          </button>
          <div>
            <button onClick={handleLogout} className="text-white/40 text-xs mt-4">
              Cerrar sesión
            </button>
          </div>
        </div>
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