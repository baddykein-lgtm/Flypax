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
  { href: "/panel/qr", label: "Codigo QR", icon: "🔳" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        setReactivateError(data.error || "No se pudo iniciar el pago. Intentalo de nuevo.");
        setReactivating(false);
      }
    } catch (e) {
      setReactivateError("Error de conexion con el servidor");
      setReactivating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando tu panel...
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
          <h1 className="font-display text-xl mb-2">Tu suscripcion no esta activa</h1>
          <p className="text-white/55 text-sm mb-6">
            {subStatus
              ? "Tu plan de 19,99€/mes esta marcado como " + subStatus + ". Reactivalo para volver a acceder a tu panel."
              : "Aun no vemos un pago confirmado para este negocio. Si acabas de pagar, puede tardar unos segundos - o reactivalo aqui."}
          </p>
          {reactivateError && <p className="text-red-400 text-xs mb-4">{reactivateError}</p>}
          <button
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60 mb-3"
          >
            {reactivating ? "Conectando con Stripe..." : "Reactivar suscripcion"}
          </button>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="text-white/40 text-xs"
          >
            Ya pague, volver a comprobar
          </button>
          <div>
            <button onClick={handleLogout} className="text-white/40 text-xs mt-4">
              Cerrar sesion
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
      <div className="min-h-screen bg-paper text-[#1B2A22] md:grid md:grid-cols-[250px_1fr]">

        {/* Barra superior - solo movil */}
        <div className="md:hidden flex items-center justify-between bg-ink text-[#F4EFE3] px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-mustard flex items-center justify-center text-sm flex-shrink-0">
              {business.icon}
            </span>
            <span className="text-sm font-bold truncate">{business.name}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Menu deslizante - solo movil */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-72 max-w-[80vw] bg-ink text-[#F4EFE3] p-5 flex flex-col h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <img src="/logo.png" alt="Flypax" className="h-6 w-auto" />
                <button onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menu" className="text-white/60 text-2xl leading-none">
                  &times;
                </button>
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
                    className={
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium " +
                      (pathname === n.href ? "bg-white/10 text-white" : "text-white/65")
                    }
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
                Cerrar sesion
              </button>
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Sidebar fija - solo escritorio, sin cambios */}
        <aside className="hidden md:flex bg-ink text-[#F4EFE3] p-5 flex-col">
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
                className={
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium " +
                  (pathname === n.href ? "bg-white/10 text-white" : "text-white/65")
                }
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
            Cerrar sesion
          </button>
        </aside>

        <main className="p-4 md:p-8 max-w-5xl">{children}</main>
      </div>
    </BusinessContext.Provider>
  );
}