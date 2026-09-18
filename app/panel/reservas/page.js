"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

function subLine(r) {
  const parts = [r.date, r.time];
  if (r.people != null) parts.push(`${r.people} persona${r.people > 1 ? "s" : ""}`);
  if (r.detail) parts.push(r.detail);
  return parts.join(" · ");
}

function StatusTag({ status }) {
  const map = {
    confirmada: "bg-green-100 text-green-700",
    pendiente: "bg-amber-100 text-amber-700",
    cancelada: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${map[status] || ""}`}>{status}</span>
  );
}

export default function ReservasPage() {
  const { business, cfg } = useBusiness();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState(2);
  const [extra, setExtra] = useState({});

  async function loadReservations() {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("business_id", business.id)
      .order("date", { ascending: false });
    setReservations(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  function resetForm() {
    setClientName("");
    setPhone("");
    setDate("");
    setTime("");
    setPeople(2);
    setExtra({});
  }

  async function saveReservation() {
    if (!clientName.trim()) return;
    setSaving(true);

    const record = {
      business_id: business.id,
      client_name: clientName.trim(),
      client_phone: phone.trim() || null,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || "12:00",
      status: "confirmada",
    };

    if (cfg.showPeople) {
      record.people = Number(people) || 1;
    } else {
      record.detail = (cfg.extraFields || [])
        .map((f) => {
          const v = extra[f.key];
          return v ? `${f.label.replace("¿", "").replace("?", "")}: ${v}` : null;
        })
        .filter(Boolean)
        .join(" · ");
    }

    await supabase.from("reservations").insert(record);
    setSaving(false);
    setShowModal(false);
    resetForm();
    loadReservations();
  }

  async function cancelReservation(id) {
    await supabase.from("reservations").update({ status: "cancelada" }).eq("id", id);
    loadReservations();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl">Reservas</h1>
          <p className="text-sm text-[#5b6b60] mt-1">
            Todo lo que llega desde tu página pública, o que añades tú a mano.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm"
        >
          + {cfg.resLabel}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#5b6b60]">Cargando…</p>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          {reservations.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#8a958d]">Sin reservas todavía.</div>
          ) : (
            reservations.map((r) => (
              <div
                key={r.id}
                className="px-5 py-3.5 border-b border-black/10 last:border-0 flex items-center justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {r.client_name}{" "}
                    <span className="text-[#8a958d] font-normal">{r.client_phone ? `· ${r.client_phone}` : ""}</span>
                  </div>
                  <div className="text-xs text-[#5b6b60] mt-0.5">{subLine(r)}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusTag status={r.status} />
                  {r.status !== "cancelada" && (
                    <button
                      onClick={() => cancelReservation(r.id)}
                      className="text-xs font-semibold text-[#5b6b60]"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <h3 className="font-display text-lg mb-4">{cfg.resLabel}</h3>

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Cliente</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="600 000 000"
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Hora</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {cfg.showPeople ? (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Personas</label>
                <input
                  type="number"
                  min={1}
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ) : (
              (cfg.extraFields || []).map((f) => (
                <div key={f.key} className="mb-3">
                  <label className="block text-xs font-semibold text-[#5b6b60] mb-1">{f.label}</label>
                  <input
                    value={extra[f.key] || ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))
            )}

            <div className="flex justify-between items-center mt-4">
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
                onClick={saveReservation}
                disabled={saving}
                className="bg-mustard text-ink font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}