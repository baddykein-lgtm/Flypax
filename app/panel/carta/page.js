"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  emoji: "⭐",
  tagsText: "",
  description: "",
};

export default function CartaPage() {
  const { business } = useBusiness();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      category: p.category || "",
      price: String(p.price ?? ""),
      emoji: p.emoji || "⭐",
      tagsText: (p.tags || []).join(", "),
      description: p.description || "",
    });
    setImageFile(null);
    setImagePreview(p.image_url || null);
    setShowModal(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    let image_url = editingId ? products.find((p) => p.id === editingId)?.image_url || null : null;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const path = business.id + "/" + Date.now() + "." + ext;
      const { error: uploadError } = await supabase.storage.from("products").upload(path, imageFile);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      setUploading(false);
    }

    const tags = form.tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || "General",
      price: Number(form.price) || 0,
      emoji: form.emoji.trim() || "⭐",
      description: form.description.trim() || null,
      image_url,
      tags,
    };

    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert({ ...payload, business_id: business.id });
    }

    setSaving(false);
    setShowModal(false);
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
            Esto es lo que veran tus clientes en tu pagina publica y al escanear tu QR. Toca cualquier producto para editarlo.
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm"
        >
          + Añadir producto
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#5b6b60]">Cargando...</p>
      ) : products.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl py-16 text-center text-sm text-[#8a958d]">
          Todavia no has añadido nada a tu carta.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3.5">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-black/10 rounded-xl overflow-hidden">
              <button onClick={() => openEdit(p)} className="w-full text-left">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-[#F0ECE1] flex items-center justify-center text-3xl">
                    {p.emoji}
                  </div>
                )}
                <div className="p-4">
                  <div className="font-bold text-sm mb-0.5">{p.name}</div>
                  <div className="text-xs text-[#5b6b60] mb-2">{p.category}</div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.tags.map((t) => (
                        <span key={t} className="text-[10px] font-semibold bg-[#F0ECE1] text-[#5b6b60] px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="font-display text-lg text-amber-700">{Number(p.price)}€</div>
                </div>
              </button>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 text-xs font-semibold border border-black/10 rounded-full px-3 py-1.5"
                >
                  Editar
                </button>
                <button
                  onClick={() => removeProduct(p.id)}
                  className="flex-1 text-xs font-semibold text-red-700 border border-red-200 rounded-full px-3 py-1.5"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-4">{editingId ? "Editar producto" : "Añadir a la carta"}</h3>

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Foto (opcional)</label>
            <div className="mb-3">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-lg mb-2" />
              ) : null}
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
            </div>

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="Ej. Corte + barba"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Categoria</label>
            <input
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
              placeholder="Ej. Servicios"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Descripcion (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Un par de lineas para tus clientes"
              rows={2}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Precio (€)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
              placeholder="18"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              value={form.tagsText}
              onChange={(e) => updateForm("tagsText", e.target.value)}
              placeholder="Ej. a domicilio, urgente, sin gluten"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Icono (si no subes foto)</label>
            <input
              value={form.emoji}
              onChange={(e) => updateForm("emoji", e.target.value)}
              placeholder="✂️"
              maxLength={4}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-5"
            />

            <div className="flex justify-between items-center">
              <button onClick={() => setShowModal(false)} className="text-sm font-semibold text-[#5b6b60]">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-60"
              >
                {uploading ? "Subiendo foto..." : saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}