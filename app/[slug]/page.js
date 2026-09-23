"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categoryConfig";

const BusinessMap = dynamic(() => import("@/app/BusinessMap"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-[#1E332B] rounded-2xl animate-pulse" />,
});

const DIAS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export default function PublicBusinessPage({ params }) {
  const { slug } = params;
  const searchParams = useSearchParams();
  const mesaFromQr = searchParams.get("mesa");
  const verifiedTable = mesaFromQr ? Number(mesaFromQr) : null;

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

  const [tableNumber, setTableNumber] = useState(verifiedTable);
  const [cart, setCart] = useState({});
  const [orderSent, setOrderSent] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [payMethod, setPayMethod] = useState(null);
  const [orderError, setOrderError] = useState("");

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
  const canAcceptOnlinePayment = business.stripe_connect_status === "connected";

  const grouped = {};
  products.forEach((p) => {
    (grouped[p.category] = grouped[p.category] || []).push(p);
  });

  const hoursLine = DIAS_FULL.map((d, i) => (business.hours?.[i] ? d.slice(0, 1) + " " + business.hours[i] : null))
    .filter(Boolean)
    .join(" - ");

  const cartLines = Object.entries(cart)
    .map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      return p ? { product: p, qty } : null;
    })
    .filter(Boolean);
  const cartTotal = cartLines.reduce((sum, l) => sum + l.qty * Number(l.product.price), 0);
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

  function setCartQty(productId, qty) {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  function openProduct(p) {
    setViewProduct(p);
    setModalQty(cart[p.id] || 1);
  }
  function closeProduct() {
    setViewProduct(null);
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

  async function handleSendOrderCounter() {
    if (!tableNumber) return;
    if (cartLines.length === 0) return;
    setSending(true);
    setOrderError("");

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
    setShowCartDrawer(false);
  }

  async function handlePayOnline() {
    if (!tableNumber) return;
    if (cartLines.length === 0) return;
    setSending(true);
    setOrderError("");

    try {
      const res = await fetch("/api/stripe/order-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          slug: business.slug,
          tableNumber,
          clientName: clientName.trim() || null,
          items: cartLines.map((l) => ({ name: l.product.name, qty: l.qty, price: Number(l.product.price) })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setOrderError(data.error || "No se pudo iniciar el pago");
        setSending(false);
      }
    } catch (e) {
      setOrderError("Error de conexion");
      setSending(false);
    }
  }  return (
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
                <button
                  key={p.id}
                  onClick={() => openProduct(p)}
                  className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl text-left hover:bg-white/5 active:bg-white/10 transition border-b border-white/10 last:border-0"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#1E332B] flex items-center justify-center text-2xl flex-shrink-0">
                      {p.emoji}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-white/45 mt-0.5 line-clamp-2">{p.description}</div>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.tags.slice(0, 3).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="font-display text-mustard whitespace-nowrap">{Number(p.price)}€</div>
                    {cart[p.id] > 0 && (
                      <span className="text-[10px] font-bold bg-mustard text-ink rounded-full px-1.5 py-0.5">
                        {cart[p.id]}x
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-white/40 mb-6">Este negocio todavia no ha publicado su carta.</p>}
        </div>

        <div className="px-6">
          {cfg.hasTableOrders && (
            <div className="flex bg-[#1E332B] rounded-xl p-1 mb-4">
              <button
                onClick={() => setMode("reservar")}
                className={"flex-1 py-2 rounded-lg text-sm font-semibold " + (mode === "reservar" ? "bg-white text-ink" : "text-white/60")}
              >
                {cfg.resLabel}
              </button>
              <button
                onClick={() => setMode("pedido")}
                className={"flex-1 py-2 rounded-lg text-sm font-semibold " + (mode === "pedido" ? "bg-white text-ink" : "text-white/60")}
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
              {verifiedTable ? (
                <p className="text-sm text-white/60 mb-4">
                  Mesa <b className="text-mustard">{verifiedTable}</b> - confirmada al escanear el codigo QR de tu mesa.
                </p>
              ) : (
                <>
                  <h3 className="font-display text-lg mb-3">Elige tu mesa</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
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
                  <p className="text-xs text-white/40 mb-4">
                    No hemos podido confirmar que estas en el local escaneando un QR, asi que este pedido debe pagarse
                    online por adelantado.
                  </p>
                </>
              )}

              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4"
              />

              {cartCount === 0 ? (
                <p className="text-sm text-white/40">Añade productos de la carta para pedir.</p>
              ) : !tableNumber ? (
                <p className="text-sm text-white/40">Elige tu mesa para continuar.</p>
              ) : (
                <>
                  <div className="text-sm text-white/60 mb-3">
                    {cartLines.map((l) => l.qty + "x " + l.product.name).join(", ")}
                  </div>

                  {verifiedTable ? (
                    <div className="flex bg-[#16231D] rounded-lg p-1 mb-3">
                      <button
                        onClick={() => setPayMethod("barra")}
                        className={
                          "flex-1 py-2 rounded-md text-xs font-semibold " +
                          (payMethod === "barra" ? "bg-white text-ink" : "text-white/60")
                        }
                      >
                        Pagar en barra
                      </button>
                      <button
                        onClick={() => setPayMethod("online")}
                        disabled={!canAcceptOnlinePayment}
                        className={
                          "flex-1 py-2 rounded-md text-xs font-semibold disabled:opacity-40 " +
                          (payMethod === "online" ? "bg-white text-ink" : "text-white/60")
                        }
                      >
                        Pagar ahora
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-mustard mb-3 font-semibold">Pago online obligatorio para este pedido</p>
                  )}

                  {orderError && <p className="text-xs text-red-400 mb-3">{orderError}</p>}

                  {!canAcceptOnlinePayment && !verifiedTable ? (
                    <p className="text-sm text-white/40">
                      Este negocio todavia no acepta pago online - pide en persona en el mostrador.
                    </p>
                  ) : verifiedTable && payMethod === "barra" ? (
                    <button
                      onClick={handleSendOrderCounter}
                      disabled={sending}
                      className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60"
                    >
                      {sending ? "Enviando..." : "Enviar pedido (" + cartTotal.toFixed(2) + "€)"}
                    </button>
                  ) : (
                    <button
                      onClick={handlePayOnline}
                      disabled={sending || (verifiedTable && !payMethod)}
                      className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60"
                    >
                      {sending ? "Redirigiendo a pago..." : "Pagar ahora (" + cartTotal.toFixed(2) + "€)"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <Footer business={business} />

        <p className="text-center text-white/30 text-xs mt-8">
          Reservado con <b className="text-mustard/70">Flypax</b>
        </p>
      </div>

      {viewProduct && (
        <ProductModal
          product={viewProduct}
          qty={modalQty}
          setQty={setModalQty}
          canOrder={cfg.hasTableOrders && mode === "pedido"}
          onClose={closeProduct}
          onConfirm={() => {
            setCartQty(viewProduct.id, modalQty);
            closeProduct();
          }}
        />
      )}

      {cfg.hasTableOrders && mode === "pedido" && cartCount > 0 && !showCartDrawer && (
        <button
          onClick={() => setShowCartDrawer(true)}
          className="fixed bottom-5 right-5 z-40 bg-mustard text-ink rounded-full shadow-xl px-5 py-3.5 flex items-center gap-2 font-semibold text-sm"
        >
          Carrito ({cartCount})
          <span className="hidden sm:inline">- {cartTotal.toFixed(2)} EUR</span>
        </button>
      )}

      {showCartDrawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setShowCartDrawer(false)}>
          <div
            className="bg-[#1E332B] w-full sm:max-w-md rounded-t-2xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Tu pedido</h3>
              <button onClick={() => setShowCartDrawer(false)} className="text-white/40 text-sm">
                Cerrar
              </button>
            </div>
            {cartLines.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/10 text-sm">
                <div className="min-w-0 flex-1 truncate">{l.product.name}</div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setCartQty(l.product.id, l.qty - 1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    -
                  </button>
                  <span className="w-5 text-center">{l.qty}</span>
                  <button onClick={() => setCartQty(l.product.id, l.qty + 1)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    +
                  </button>
                  <span className="w-14 text-right text-mustard font-display">{(l.qty * Number(l.product.price)).toFixed(2)}€</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-display text-lg mt-4 mb-5">
              <span>Total</span>
              <span className="text-mustard">{cartTotal.toFixed(2)}€</span>
            </div>
            <p className="text-xs text-white/40">Cierra este panel y sigue mas abajo para elegir mesa y forma de pago.</p>
          </div>
        </div>
      )}
    </main>
  );
}

function Tag({ children }) {
  return <span className="text-[10px] font-semibold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{children}</span>;
}

function ProductModal({ product, qty, setQty, canOrder, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1E332B] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover sm:rounded-t-2xl" />
        ) : (
          <div className="w-full h-40 bg-[#16231D] flex items-center justify-center text-6xl">{product.emoji}</div>
        )}
        <div className="p-6">
          <h3 className="font-display text-xl mb-1">{product.name}</h3>
          <div className="font-display text-mustard text-lg mb-3">{Number(product.price)}€</div>
          {product.description && <p className="text-sm text-white/60 mb-3">{product.description}</p>}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {product.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
          {canOrder ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center bg-[#16231D] rounded-full flex-shrink-0">
                <button onClick={() => setQty((q) => Math.max(0, q - 1))} className="w-10 h-10 text-lg font-bold">
                  -
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 text-lg font-bold">
                  +
                </button>
              </div>
              <button onClick={onConfirm} className="flex-1 bg-mustard text-ink font-semibold py-3 rounded-full text-sm">
                {qty === 0 ? "Quitar del pedido" : "Anadir - " + (qty * Number(product.price)).toFixed(2) + " EUR"}
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full border border-white/20 py-3 rounded-full text-sm font-semibold">
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer({ business }) {
  const socials = [
    business.whatsapp && {
      key: "whatsapp",
      href: "https://wa.me/" + business.whatsapp.replace(/\D/g, ""),
      label: "WhatsApp",
      icon: (
        <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" />
      ),
    },
    business.instagram && {
      key: "instagram",
      href: business.instagram,
      label: "Instagram",
      icon: (
        <path d="M12 2.2c2.7 0 3 0 4.1.1 1 0 1.6.2 2 .4.5.2.8.4 1.2.8.4.4.6.7.8 1.2.2.4.3 1 .4 2 .1 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.6-.4 2-.2.5-.4.8-.8 1.2-.4.4-.7.6-1.2.8-.4.2-1 .3-2 .4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.6-.2-2-.4-.5-.2-.8-.4-1.2-.8-.4-.4-.6-.7-.8-1.2-.2-.4-.3-1-.4-2C2.2 15 2.2 14.7 2.2 12s0-3 .1-4.1c0-1 .2-1.6.4-2 .2-.5.4-.8.8-1.2.4-.4.7-.6 1.2-.8.4-.2 1-.3 2-.4C7.8 3.5 8.1 2.5 8.1 2.5M12 0C9.3 0 8.9 0 7.8.1c-1.1 0-1.9.2-2.6.5-.7.3-1.3.6-1.9 1.2C2.7 2.4 2.4 3 2.1 3.7c-.3.7-.4 1.5-.5 2.6C1.5 7.4 1.5 7.8 1.5 12s0 4.6.1 5.7c0 1.1.2 1.9.5 2.6.3.7.6 1.3 1.2 1.9.6.6 1.2.9 1.9 1.2.7.3 1.5.4 2.6.5 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c1.1 0 1.9-.2 2.6-.5.7-.3 1.3-.6 1.9-1.2.6-.6.9-1.2 1.2-1.9.3-.7.4-1.5.5-2.6.1-1.1.1-1.5.1-5.7s0-4.6-.1-5.7c0-1.1-.2-1.9-.5-2.6-.3-.7-.6-1.3-1.2-1.9-.6-.6-1.2-.9-1.9-1.2-.7-.3-1.5-.4-2.6-.5C15.1 0 14.7 0 12 0z" />
      ),
    },
    business.facebook && {
      key: "facebook",
      href: business.facebook,
      label: "Facebook",
      icon: <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.9.2-1.5 1.5-1.5h1.6V4.3C16.3 4.2 15.3 4 14.2 4c-2.4 0-4 1.5-4 4.1V10.5H7.7v3h2.5V21h3.3z" />,
    },
    business.website && {
      key: "website",
      href: business.website,
      label: "Web",
      icon: (
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 8h-3a15 15 0 0 0-1.3-5.1A8 8 0 0 1 18.9 10zM12 4.1c.8 1.1 1.7 3 2 5.9h-4c.3-2.9 1.2-4.8 2-5.9zM4 12c0-.7.1-1.4.2-2h3.4c-.1.7-.1 1.3-.1 2s0 1.3.1 2H4.2A8 8 0 0 1 4 12zm1.1 4h3a15 15 0 0 0 1.3 5.1A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-5.1A15 15 0 0 0 8.1 8zM12 19.9c-.8-1.1-1.7-3-2-5.9h4c-.3 2.9-1.2 4.8-2 5.9zm2.6-7.9H9.4c-.1-.7-.1-1.3-.1-2s0-1.3.1-2h5.2c.1.7.1 1.3.1 2s0 1.3-.1 2zm.3 7.1a15 15 0 0 0 1.3-5.1h3a8 8 0 0 1-4.3 5.1zM16.4 14c.1-.7.1-1.3.1-2s0-1.3-.1-2h3.4c.1.6.2 1.3.2 2s-.1 1.4-.2 2h-3.4z" />
      ),
    },
    business.google_reviews_url && {
      key: "google",
      href: business.google_reviews_url,
      label: "Danos tu opinion en Google",
      icon: (
        <path d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3-4.5 3-7.6z" />
      ),
    },
  ].filter(Boolean);

  const hasMap = business.latitude != null && business.longitude != null;
  if (!hasMap && socials.length === 0) return null;

  return (
    <div className="px-6 mt-8">
      {hasMap && (
        <a
        
          href={"https://www.google.com/maps/dir/?api=1&destination=" + business.latitude + "," + business.longitude}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative mb-4"
        >
          <BusinessMap latitude={business.latitude} longitude={business.longitude} />
          <span className="absolute bottom-3 right-3 bg-ink/90 text-xs font-semibold px-3 py-1.5 rounded-full">Como llegar</span>
        </a>
      )}
      {business.google_reviews_url && (
        <a
        
          href={business.google_reviews_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center bg-mustard text-ink font-semibold py-2.5 rounded-full text-sm mb-4"
        >
          Danos tu opinion en Google
        </a>
      )}
      {socials.length > 0 && (
        <div className="flex justify-center gap-3">
          {socials.map((s) => (
            <a
            
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-10 h-10 rounded-full bg-[#1E332B] border border-white/10 flex items-center justify-center text-white/60 hover:text-mustard hover:border-mustard/40 transition"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                {s.icon}
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
