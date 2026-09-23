"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { detectCountry } from "@/lib/geo";

const FEATURES = [
  { icon: "📅", title: "Reservas y citas", text: "Tus clientes reservan mesa o piden cita desde tu propia página, sin llamadas." },
  { icon: "🍽️", title: "Pedidos en mesa", text: "En restaurantes y bares, tus clientes piden desde el móvil y te llega directo a cocina." },
  { icon: "📋", title: "Carta y productos", text: "Publica tu carta o catálogo de servicios, visible en tu página y tu QR." },
  { icon: "🔳", title: "Código QR", text: "El mismo código para todo el negocio — imprímelo en cada mesa." },
  { icon: "🧾", title: "Facturas", text: "Crea facturas simples a partir de tu carta y controla qué está cobrado." },
  { icon: "🗺️", title: "Directorio", text: "Apareces junto a otros negocios de tu zona — más clientes te descubren." },
];

export default function NegociosLandingPage() {
  const [geo, setGeo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    setGeo(detectCountry());
  }, []);

  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from("platform_reviews")
        .select("rating, comment, business_id, businesses(name)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      setTestimonials(data || []);
    }
    loadReviews();
  }, []);

  return (
    <main>
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Flypax" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          {geo && (
            <span className="text-xs text-white/50 hidden sm:inline">
              {geo.flag} {geo.country}
            </span>
          )}
          <Link href="/login" className="text-white/60 text-sm font-semibold hover:text-white">
            Iniciar sesión
          </Link>
          <Link
            href="/suscribirse"
            className="bg-mustard text-ink font-semibold text-sm px-5 py-2.5 rounded-full"
          >
            Suscribirme
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-mustard text-sm font-bold mb-4">SaaS para negocios locales</p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-5">
            La <em className="text-mustard not-italic">puerta</em> digital de tu negocio, en un link.
          </h1>
          <p className="text-white/65 max-w-md mb-8 leading-relaxed">
            Reservas, citas, carta digital, pedidos en mesa, código QR y facturas — todo
            adaptado a tu tipo de negocio desde el primer minuto.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/suscribirse" className="bg-mustard text-ink font-semibold px-6 py-3 rounded-full">
              Suscribirme por 19,99€/mes
            </Link>
            <a href="#features" className="border border-white/20 px-6 py-3 rounded-full font-semibold">
              Ver qué incluye
            </a>
          </div>
        </div>
        <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#284137] rounded-xl p-3">
              <div className="text-white/50 text-xs mb-1">Reservas hoy</div>
              <div className="font-display text-xl">12</div>
            </div>
            <div className="bg-[#284137] rounded-xl p-3">
              <div className="text-white/50 text-xs mb-1">Ingresos del mes</div>
              <div className="font-display text-xl">1.240€</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-display mb-2">Todo lo que necesita tu negocio</h2>
        <p className="text-white/55 mb-10 max-w-md">
          Adaptado a cómo funciona realmente tu tipo de negocio.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#1E332B] border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-mustard flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-white/55">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-display mb-2">Lo que dicen nuestros negocios</h2>
          <p className="text-white/55 mb-10 max-w-md">Opiniones reales de quienes ya usan Flypax cada dia.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#1E332B] border border-white/10 rounded-2xl p-6">
                <p className="text-mustard text-sm mb-3">{"★".repeat(t.rating)}</p>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">"{t.comment}"</p>
                <p className="text-xs font-semibold text-mustard">{t.businesses?.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center py-10 text-white/40 text-sm">
        <div className="flex justify-center gap-4 mb-3">
          <Link href="/ayuda" className="hover:text-white">
            Ayuda
          </Link>
          <Link href="/privacidad" className="hover:text-white">
            Privacidad
          </Link>
        </div>
        Flypax — la puerta digital de los negocios de tu barrio
      </footer>
    </main>
  );
}