"use client";

import { useState } from "react";

export default function SuscribirsePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!email.trim()) {
      setError("Ponnos tu email para continuar");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessId: "" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No se pudo iniciar el pago. Revisa las claves de Stripe en .env.local");
      }
    } catch (e) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-[#1E332B] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
        </div>
        <h1 className="font-display text-2xl mb-1">Suscripción a Flypax</h1>
        <p className="text-white/55 text-sm mb-6">19,99€/mes · sin permanencia</p>

        <label className="block text-xs font-semibold text-white/60 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@negocio.com"
          className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-mustard"
        />

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-mustard text-ink font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {loading ? "Conectando con Stripe…" : "Confirmar suscripción"}
        </button>

        <p className="text-white/35 text-xs mt-4 text-center">
          Te llevamos a Stripe Checkout para pagar de forma segura. Al terminar, volverás
          aquí para configurar tu negocio.
        </p>
      </div>
    </main>
  );
}