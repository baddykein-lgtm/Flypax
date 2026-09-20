"use client";

import { useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

const DIAS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export default function AjustesPage() {
  const { business, setBusiness, cfg } = useBusiness();
  const [name, setName] = useState(business.name);
  const [city, setCity] = useState(business.city || "");
  const [locationAddress, setLocationAddress] = useState(business.location_address || "");
  const [taxId, setTaxId] = useState(business.tax_id || "");
  const [address, setAddress] = useState(business.address || "");
  const [hours, setHours] = useState(() => {
    const h = {};
    DIAS_FULL.forEach((_, i) => {
      h[i] = business.hours?.[i] || "";
    });
    return h;
  });
  const [profile, setProfile] = useState(business.profile || {});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(business.image_url || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  function toggleDayOpen(i) {
    setHours((h) => ({ ...h, [i]: h[i] ? "" : "9:30-20:00" }));
  }
  function updateDayHours(i, value) {
    setHours((h) => ({ ...h, [i]: value }));
  }
  function updateProfile(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setStatusMsg("");

    let image_url = business.image_url || null;
    if (imageFile) {
      setStatusMsg("Subiendo foto...");
      const ext = imageFile.name.split(".").pop();
      const path = business.id + "/cover-" + Date.now() + "." + ext;
      const { error: uploadError } = await supabase.storage.from("businesses").upload(path, imageFile);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("businesses").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    }

    let latitude = business.latitude;
    let longitude = business.longitude;
    const cityChanged = city.trim() !== (business.city || "").trim();
    const addressChanged = locationAddress.trim() !== (business.location_address || "").trim();
    if ((cityChanged || addressChanged) && (city.trim() || locationAddress.trim())) {
      setStatusMsg("Actualizando ubicacion...");
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city, address: locationAddress }),
        });
        if (res.ok) {
          const geo = await res.json();
          latitude = geo.latitude;
          longitude = geo.longitude;
        }
      } catch (e) {}
    }

    const updates = {
      name: name.trim(),
      city: city.trim(),
      location_address: locationAddress.trim() || null,
      tax_id: taxId.trim() || null,
      address: address.trim() || null,
      hours,
      profile,
      latitude,
      longitude,
      image_url,
    };

    setStatusMsg("Guardando...");
    const { error } = await supabase.from("businesses").update(updates).eq("id", business.id);
    setSaving(false);
    setStatusMsg("");
    if (!error) {
      setBusiness({ ...business, ...updates });
      setImageFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-7">
        <h1 className="font-display text-2xl">Ajustes</h1>
        <p className="text-sm text-[#5b6b60] mt-1">Datos de tu negocio, horario y como te encuentran tus clientes.</p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-4">Foto de tu negocio</h3>
        {imagePreview && (
          <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-lg mb-3" />
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
        <p className="text-xs text-[#8a958d] mt-1">Se muestra en tu pagina publica y en el directorio.</p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-4">Datos generales</h3>

        <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Nombre del negocio</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
        />

        <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Ciudad</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ej. Alcala de Henares"
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
        />

        <label className="block text-xs font-semibold text-[#5b6b60] mb-1">
          Direccion exacta (opcional)
        </label>
        <input
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          placeholder="Ej. Calle Mayor 12, Alcala de Henares"
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-[#8a958d] mt-1">
          Si la rellenas, la chincheta del mapa se coloca en tu puerta exacta en vez de solo en la ciudad.
        </p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-4">Horario</h3>
        {DIAS_FULL.map((d, i) => (
          <div key={d} className="flex items-center gap-3 mb-2.5 text-sm">
            <button
              onClick={() => toggleDayOpen(i)}
              className={
                "w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0 border " +
                (hours[i] ? "bg-mustard border-mustard text-ink" : "border-black/15 text-[#8a958d]")
              }
            >
              {d.slice(0, 1)}
            </button>
            <span className="w-24 flex-shrink-0">{d}</span>
            {hours[i] ? (
              <input
                value={hours[i]}
                onChange={(e) => updateDayHours(i, e.target.value)}
                placeholder="9:30-20:00"
                className="flex-1 border border-black/15 rounded-lg px-3 py-1.5 text-sm"
              />
            ) : (
              <span className="text-[#8a958d]">Cerrado</span>
            )}
          </div>
        ))}
      </div>

      {cfg.onboardQ && cfg.onboardQ.length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-sm mb-4">A tu medida</h3>
          {cfg.onboardQ.map((q) => (
            <div key={q.key} className="mb-3">
              <label className="block text-xs font-semibold text-[#5b6b60] mb-1">{q.label}</label>
              {q.type === "bool" ? (
                <div className="flex gap-2">
                  {["Si", "No"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateProfile(q.key, opt === "Si")}
                      className={
                        "flex-1 py-2 rounded-lg border text-sm font-medium " +
                        (profile[q.key] === (opt === "Si") ? "border-mustard bg-mustard/10" : "border-black/15")
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : q.type === "select" ? (
                <select
                  value={profile[q.key] || ""}
                  onChange={(e) => updateProfile(q.key, e.target.value)}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Elige una opcion
                  </option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={q.type === "number" ? "number" : "text"}
                  value={profile[q.key] || ""}
                  onChange={(e) => updateProfile(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-4">Datos fiscales (para tus facturas)</h3>
        <label className="block text-xs font-semibold text-[#5b6b60] mb-1">NIF / CIF</label>
        <input
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          placeholder="Opcional"
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
        />
        <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Direccion fiscal</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Opcional"
          className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-mustard text-ink font-semibold px-6 py-2.5 rounded-full text-sm disabled:opacity-60"
        >
          {saving ? statusMsg || "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <span className="text-sm text-green-700 font-semibold">Guardado</span>}
      </div>
    </div>
  );
}