"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

export default function CartaPage() {
  const { business } = useBusiness();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true });
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  function resetForm() {
    setName("");
    setCategory("");
    setPrice("");
    setEmoji("⭐");
  }

  async function addProduct() {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("products").insert({
      business_id: business.id,
      name: name.trim(),
      category: category.trim() || "General",
      price: Number(price) || 0,
      emoji: emoji.trim() || "⭐",
    });
    setSaving(false);
    setShowModal(false);
    resetForm();
    loadProducts();
  }

  async function removeProduct(id) {
    await supabase.from("products").delete().eq("id", id);
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl">Carta y productos</h1>
          <p className="text-sm text-[#5b6b60] mt-1">
            Esto es lo que verán tus clientes en tu página pública y al escanear tu QR.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm"
        >
          + Añadir producto
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#5b6b60]">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl py-16 text-center text-sm text-[#8a958d]">
          Todavía no has añadido nada a tu carta.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3.5">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="text-2xl mb-2.5">{p.emoji}</div>
              <div className="font-bold text-sm mb-0.5">{p.name}</div>
              <div className="text-xs text-[#5b6b60] mb-2.5">{p.category}</div>
              <div className="font-display text-lg text-amber-700">{Number(p.price)}€</div>
              <button
                onClick={() => removeProduct(p.id)}
                className="text-xs font-semibold text-[#5b6b60] mt-3 border border-black/10 rounded-full px-3 py-1.5"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-display text-lg mb-4">Añadir a la carta</h3>

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Corte + barba"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Categoría</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Servicios"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Precio (€)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="18"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Icono</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="✂️"
              maxLength={4}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-5"
            />

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-sm font-semibold text-[#5b6b60]"
              >
                Cancelar
              </button>
              <button
                onClick={addProduct}
                disabled={saving}
                className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}