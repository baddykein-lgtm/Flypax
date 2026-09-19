"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categoryConfig";

const DIAS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export default function PublicBusinessPage({ params }) {
  const { slug } = params;
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [mode, setMode] = useState("reservar");

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState(2);
  const [extra, setExtra] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const [tableNumber, setTableNumber] = useState(null);
  const [cart, setCart] = useState({});
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: biz } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
      if (!biz) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: true });
      setBusiness(biz);
      setProducts(prods || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-white/50 bg-ink">
        Cargando...
      </main>
    );
  if (notFound)
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-ink">
        <p>Este negocio no existe o todavia no esta publicado.</p>
      </main>
    );

  const cfg = CATEGORY_CONFIG[business.category_id] || CATEGORY_CONFIG.otro;
  const categoryLabel = CATEGORIES.find((c) => c.id === business.category_id)?.label || business.category_id;
  const tableCount = Math.min(Number(business.profile?.tables) || 8, 20);

  const grouped = {};
  products.forEach((p) => {
    (grouped[p.category] = grouped[p.category] || []).push(p);
  });

  const hoursLine = DIAS_FULL.map((d, i) => (business.hours?.[i] ? d.slice(0, 1) + " " + business.hours[i] : null))
    .filter(Boolean)
    .join(" - ");

  const cartLines = Object.entries(cart).map(([productId, qty]) => {
    const p = products.find((x) => x.id === productId);
    return p ? { product: p, qty } : null;
  }).filter(Boolean);
  const cartTotal = cartLines.reduce((sum, l) => sum + l.qty * Number(l.product.price), 0);
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

  function addToCart(productId) {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  }

  async function handleReserve() {
    if (!clientName.trim()) return;
    setSending(true);

    const record = {
      business_id: business.id,
      client_name: clientName.trim(),
      client_phone: phone.trim() || null,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || "12:00",
      status: "pendiente",
    };
    if (cfg.showPeople) {
      record.people = Number(people) || 1;
    } else {
      record.detail = (cfg.extraFields || [])
        .map((f) => {
          const v = extra[f.key];
          return v ? f.label.replace("¿", "").replace("?", "") + ": " + v : null;
        })
        .filter(Boolean)
        .join(" - ");
    }

    await supabase.from("reservations").insert(record);
    setSending(false);
    setDone(true);
  }

  async function handleSendOrder() {
    if (!tableNumber) {
      alert("Elige antes tu numero de mesa");
      return;
    }
    if (cartLines.length === 0) return;
    setSending(true);

    await supabase.from("orders").insert({
      business_id: business.id,
      table_number: tableNumber,
      client_name: clientName.trim() || null,
      items: cartLines.map((l) => ({ name: l.product.name, qty: l.qty, price: Number(l.product.price) })),
      total: cartTotal,
      status: "nuevo",
      paid: false,
    });

    setSending(false);
    setOrderSent(true);
    setCart({});
  }

  return (
    <main className="min-h-screen bg-ink text-white pb-16">
      <div className="max-w-xl mx-auto">
        <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-[#1E332B] to-ink">
          <div className="text-mustard text-xs font-bold mb-2">{categoryLabel}</div>
          <h1 className="font-display text-3xl mb-2">
            {business.icon} {business.name}
          </h1>
          {hoursLine && <p className="text-white/50 text-sm">{hoursLine}</p>}
        </div>

        <div className="px-6 py-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <div className="font-display text-lg mb-2.5">{cat}</div>
              {items.map((p) => (
                <div key={p.id} className="flex justify-between items-center gap-3 py-2.5 border-b border-white/10">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">
                      {p.emoji} {p.name}
                    </div>
                    {p.description && <div className="text-xs text-white/45 mt-0.5">{p.description}</div>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="font-display text-mustard whitespace-nowrap">{Number(p.price)}€</div>
                    {mode === "pedido" && (
                      <button
                        onClick={() => addToCart(p.id)}
                        className="w-7 h-7 rounded-full bg-white text-ink font-bold text-sm flex items-center justify-center flex-shrink-0"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-white/40 mb-6">Este negocio todavia no ha publicado su carta.</p>
          )}
        </div>

        <div className="px-6">
          {cfg.hasTableOrders && (
            <div className="flex bg-[#1E332B] rounded-xl p-1 mb-4">
              <button
                onClick={() => setMode("reservar")}
                className={
                  "flex-1 py-2 rounded-lg text-sm font-semibold " +
                  (mode === "reservar" ? "bg-white text-ink" : "text-white/60")
                }
              >
                {cfg.resLabel}
              </button>
              <button
                onClick={() => setMode("pedido")}
                className={
                  "flex-1 py-2 rounded-lg text-sm font-semibold " +
                  (mode === "pedido" ? "bg-white text-ink" : "text-white/60")
                }
              >
                Pedir en mi mesa
              </button>
            </div>
          )}

          {mode === "reservar" ? (
            done ? (
              <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-6 text-center">
                <p className="font-display text-lg mb-1">¡Listo!</p>
                <p className="text-sm text-white/60">
                  Tu {cfg.resLabel.toLowerCase()} ha llegado a {business.name}.
                </p>
              </div>
            ) : (
              <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-lg mb-4">{cfg.resLabel}</h3>

                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefono (opcional)"
                  className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3"
                />
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="flex-1 bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                {cfg.showPeople ? (
                  <input
                    type="number"
                    min={1}
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    placeholder="Personas"
                    className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4"
                  />
                ) : (
                  (cfg.extraFields || []).map((f) => (
                    <input
                      key={f.key}
                      value={extra[f.key] || ""}
                      onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3"
                    />
                  ))
                )}

                <button
                  onClick={handleReserve}
                  disabled={sending}
                  className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60 mt-1"
                >
                  {sending ? "Enviando..." : cfg.resLabel}
                </button>
              </div>
            )
          ) : orderSent ? (
            <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-6 text-center">
              <p className="font-display text-lg mb-1">¡Pedido enviado!</p>
              <p className="text-sm text-white/60">Tu pedido ha llegado a cocina. Mesa {tableNumber}.</p>
            </div>
          ) : (
            <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-6">
              <h3 className="font-display text-lg mb-3">Elige tu mesa</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setTableNumber(n)}
                    className={
                      "w-10 h-10 rounded-lg text-sm font-bold " +
                      (tableNumber === n ? "bg-mustard text-ink" : "bg-[#16231D] text-white/60")
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>

              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4"
              />

              {cartCount > 0 ? (
                <>
                  <div className="text-sm text-white/60 mb-3">
                    {cartLines.map((l) => l.qty + "x " + l.product.name).join(", ")}
                  </div>
                  <button
                    onClick={handleSendOrder}
                    disabled={sending}
                    className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60"
                  >
                    {sending ? "Enviando..." : "Enviar pedido (" + cartCount + " - " + cartTotal.toFixed(2) + "€)"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-white/40">Añade productos de la carta con el boton +.</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Reservado con <b className="text-mustard/70">Flypax</b>
        </p>
      </div>
    </main>
  );
}