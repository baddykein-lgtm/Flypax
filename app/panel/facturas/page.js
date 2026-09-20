"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/BusinessContext";
import { supabase } from "@/lib/supabaseClient";

export default function FacturasPage() {
  const { business } = useBusiness();
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNif, setClientNif] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [ivaRate, setIvaRate] = useState(21);
  const [lines, setLines] = useState([{ productId: "", qty: 1 }]);

  async function loadAll() {
    const [{ data: inv }, { data: prods }] = await Promise.all([
      supabase.from("invoices").select("*").eq("business_id", business.id).order("date", { ascending: false }),
      supabase.from("products").select("*").eq("business_id", business.id),
    ]);
    setInvoices(inv || []);
    setProducts(prods || []);
    if (prods && prods.length) setLines((ls) => (ls[0].productId ? ls : [{ productId: prods[0].id, qty: 1 }]));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id]);

  function productById(id) {
    return products.find((p) => p.id === id);
  }
  function updateLine(i, field, value) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { productId: products[0]?.id || "", qty: 1 }]);
  }

  const subtotal = lines.reduce((sum, l) => {
    const p = productById(l.productId);
    return sum + (p ? Number(p.price) * Number(l.qty || 1) : 0);
  }, 0);
  const ivaAmount = Math.round(subtotal * (Number(ivaRate) / 100) * 100) / 100;
  const total = Math.round((subtotal + ivaAmount) * 100) / 100;

  function resetForm() {
    setClientName("");
    setClientEmail("");
    setClientNif("");
    setClientAddress("");
    setIvaRate(21);
    setLines([{ productId: products[0]?.id || "", qty: 1 }]);
  }

  async function createInvoice() {
    if (!clientName.trim() || products.length === 0) return;
    setSaving(true);

    const items = lines
      .map((l) => {
        const p = productById(l.productId);
        return p ? { name: p.name, qty: Number(l.qty) || 1, price: Number(p.price) } : null;
      })
      .filter(Boolean);

    const { error } = await supabase.from("invoices").insert({
      business_id: business.id,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_nif: clientNif.trim() || null,
      client_address: clientAddress.trim() || null,
      items,
      subtotal,
      iva_rate: Number(ivaRate),
      iva_amount: ivaAmount,
      total,
      paid: false,
      date: new Date().toISOString().slice(0, 10),
    });

    setSaving(false);
    if (error) {
      alert("No se pudo crear la factura: " + error.message);
      return;
    }
    resetForm();
    loadAll();
  }

  async function markPaid(id) {
    setPayingId(id);
    const { error } = await supabase.from("invoices").update({ paid: true }).eq("id", id);
    setPayingId(null);
    if (error) {
      alert("No se pudo marcar como cobrada: " + error.message);
      return;
    }
    loadAll();
  }

  async function sendInvoice(invoice) {
    if (!invoice.client_email) {
      alert("Esta factura no tiene email del cliente. Añádelo creando la factura con ese dato.");
      return;
    }
    setSendingId(invoice.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, token: session?.access_token }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo enviar la factura");
        return;
      }
      loadAll();
    } catch (e) {
      alert("Error de conexión al enviar la factura");
    } finally {
      setSendingId(null);
    }
  }

  if (loading) return <p className="text-sm text-[#5b6b60]">Cargando…</p>;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl">Facturas</h1>
        <p className="text-sm text-[#5b6b60] mt-1">Crea una factura con IVA a partir de tu carta y envíasela a tu cliente.</p>
      </div>

      <div className="bg-white border border-black/10 rounded-xl mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">Nueva factura</div>
        <div className="p-5 grid md:grid-cols-[1fr_260px] gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Cliente</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre o razón social"
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">NIF / CIF</label>
                <input
                  value={clientNif}
                  onChange={(e) => setClientNif(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Email (para enviarla)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5b6b60] mb-1">Dirección</label>
                <input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-[#8a958d] mt-2">
                Añade productos en "Carta y productos" antes de poder crear una factura.
              </p>
            ) : (
              <>
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select
                      value={l.productId}
                      onChange={(e) => updateLine(i, "productId", e.target.value)}
                      className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-sm"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {Number(p.price)}€
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => updateLine(i, "qty", e.target.value)}
                      className="w-20 border border-black/15 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <button onClick={addLine} className="text-xs font-semibold text-[#5b6b60] mt-1">
                  + Otra línea
                </button>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5b6b60] mb-1">IVA</label>
            <select
              value={ivaRate}
              onChange={(e) => setIvaRate(e.target.value)}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm mb-4"
            >
              <option value={21}>21% (general)</option>
              <option value={10}>10% (reducido)</option>
              <option value={4}>4% (superreducido)</option>
              <option value={0}>0% (exento)</option>
            </select>

            <div className="flex justify-between text-sm py-1">
              <span>Base imponible</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>IVA ({ivaRate}%)</span>
              <span>{ivaAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-display text-lg border-t border-black/10 pt-3 mt-1">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
            <button
              onClick={createInvoice}
              disabled={saving || products.length === 0}
              className="w-full bg-mustard text-ink font-semibold py-2.5 rounded-full text-sm mt-4 disabled:opacity-60"
            >
              {saving ? "Creando…" : "Crear factura"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 font-semibold text-sm">Historial</div>
        {invoices.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#8a958d]">Aún no has creado facturas.</div>
        ) : (
          invoices.map((i) => (
            <div key={i.id} className="px-5 py-3.5 border-b border-black/10 last:border-0 flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0">
                <div className="font-semibold">
                  {i.client_name} {i.client_nif ? <span className="text-[#8a958d] font-normal">· {i.client_nif}</span> : null}
                </div>
                <div className="text-xs text-[#5b6b60] mt-0.5">
                  {i.date} · {(i.items || []).map((l) => l.name).join(", ")}
                  {i.sent_at ? " · enviada" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-display font-semibold">{Number(i.total).toFixed(2)}€</span>
                {i.paid ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Cobrada</span>
                ) : (
                  <button
                    onClick={() => markPaid(i.id)}
                    disabled={payingId === i.id}
                    className="text-xs font-semibold border border-black/15 rounded-full px-3 py-1.5 disabled:opacity-50"
                  >
                    {payingId === i.id ? "Guardando…" : "Marcar cobrada"}
                  </button>
                )}
                <button
                  onClick={() => sendInvoice(i)}
                  disabled={sendingId === i.id}
                  className="text-xs font-semibold border border-black/15 rounded-full px-3 py-1.5 disabled:opacity-50"
                >
                  {sendingId === i.id ? "Enviando…" : i.sent_at ? "Reenviar" : "Enviar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}