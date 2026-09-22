"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/categoryConfig";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-[#1E332B] rounded-2xl animate-pulse" />,
});

const CAT_COLOR = {
  restaurante: "linear-gradient(160deg,#C05A3C,#8C3A26)",
  peluqueria: "linear-gradient(160deg,#7A5FB0,#4E3878)",
  clinica: "linear-gradient(160deg,#3E8E7E,#255449)",
  taller: "linear-gradient(160deg,#4A6FA5,#2B4568)",
  tienda: "linear-gradient(160deg,#B0824A,#7A5828)",
  otro: "linear-gradient(160deg,#6B7B6E,#3F4B41)",
};

export default function HomePage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("todos");
  const [view, setView] = useState("lista");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      setBusinesses(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesCat = filterCat === "todos" || b.category_id === filterCat;
      const matchesSearch = !search.trim() || b.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [businesses, filterCat, search]);

  const withCoords = filtered.filter((b) => b.latitude != null && b.longitude != null);
  const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

  return (
    <main className="min-h-screen bg-ink text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <img src="/logo.png" alt="Flypax" className="h-6 w-auto" />
          <Link href="/negocios" className="text-xs font-semibold text-white/50 hover:text-white">
            ¿Tienes un negocio?
          </Link>
        </div>

        <h1 className="font-display text-3xl mb-2">Negocios cerca de ti</h1>
        <p className="text-white/55 mb-6">
          Descubre negocios que ya usan Flypax — reserva o pide cita directamente desde aquí.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Busca un negocio..."
          className="w-full bg-[#1E332B] border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-mustard"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          <Chip active={filterCat === "todos"} onClick={() => setFilterCat("todos")}>
            Todos
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={filterCat === c.id} onClick={() => setFilterCat(c.id)}>
              {c.em} {c.label}
            </Chip>
          ))}
        </div>

        <div className="inline-flex bg-[#1E332B] rounded-lg p-1 mb-6">
          <ViewBtn active={view === "lista"} onClick={() => setView("lista")}>
            Lista
          </ViewBtn>
          <ViewBtn active={view === "mapa"} onClick={() => setView("mapa")}>
            Mapa
          </ViewBtn>
        </div>

        {loading ? (
          <div className="h-[300px] bg-[#1E332B] rounded-2xl animate-pulse" />
        ) : view === "mapa" ? (
          <div className="mb-8">
            <MapView businesses={withCoords} />
            {withCoords.length === 0 && (
              <p className="text-white/40 text-sm mt-4">
                Ningún negocio de este filtro tiene ubicación todavía.
              </p>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-white/40 text-sm">
            {businesses.length === 0
              ? "Todavía no hay negocios en Flypax. ¡Sé el primero!"
              : "No hay negocios que coincidan con tu búsqueda."}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <Link
                key={b.id}
                href={"/" + b.slug}
                className="bg-[#1E332B] border border-white/10 rounded-xl overflow-hidden hover:border-mustard/50 transition"
              >
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name} className="h-16 w-full object-cover" />
                ) : (
                  <div
                    className="h-16 flex items-center justify-center text-2xl"
                    style={{ background: CAT_COLOR[b.category_id] || CAT_COLOR.otro }}
                  >
                    {b.icon}
                  </div>
                )}
                <div className="p-3">
                  <div className="font-semibold text-sm truncate">{b.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {categoryLabel(b.category_id)} {b.city ? "· " + b.city : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition " +
        (active ? "bg-mustard text-ink" : "bg-[#1E332B] text-white/70 border border-white/10")
      }
    >
      {children}
    </button>
  );
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-1.5 rounded-md text-xs font-semibold transition " +
        (active ? "bg-mustard text-ink" : "text-white/60")
      }
    >
      {children}
    </button>
  );
}