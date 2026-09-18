"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/categoryConfig";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-[#1E332B] rounded-2xl animate-pulse" />,
});

export default function DirectorioPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      setBusinesses(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-ink text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <img src="/logo.png" alt="Flypax" className="h-6 w-auto" />
        </div>
        <h1 className="font-display text-3xl mb-2">Negocios cerca de ti</h1>
        <p className="text-white/55 mb-8">
          Descubre negocios que ya usan Flypax — reserva o pide cita directamente desde aquí.
        </p>

        {loading ? (
          <div className="h-[420px] bg-[#1E332B] rounded-2xl animate-pulse mb-8" />
        ) : (
          <div className="mb-8">
            <MapView businesses={businesses} />
          </div>
        )}

        {!loading && businesses.length === 0 && (
          <p className="text-white/40 text-sm">
            Todavía no hay negocios publicados en el directorio. Sé el primero — suscríbete y aparecerás aquí.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {businesses.map((b) => {
            const categoryLabel = CATEGORIES.find((c) => c.id === b.category_id)?.label || b.category_id;
            return (
              <Link
                key={b.id}
                href={`/${b.slug}`}
                className="bg-[#1E332B] border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-mustard/50 transition"
              >
                <span className="w-11 h-11 rounded-lg bg-mustard flex items-center justify-center text-lg flex-shrink-0">
                  {b.icon}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{b.name}</div>
                  <div className="text-xs text-white/50">
                    {categoryLabel} {b.city ? `· ${b.city}` : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}