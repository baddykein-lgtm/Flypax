"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmacionContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function verify() {
      if (!orderId || !sessionId) {
        setStatus("error");
        return;
      }
      try {
        const res = await fetch("/api/stripe/order-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, sessionId }),
        });
        const data = await res.json();
        setStatus(data.paid ? "paid" : "error");
      } catch (e) {
        setStatus("error");
      }
    }
    verify();
  }, [orderId, sessionId]);

  return (
    <div className="bg-[#1E332B] border border-white/10 rounded-2xl p-8 text-center max-w-sm w-full">
      {status === "checking" && <p className="text-white/60 text-sm">Confirmando tu pago...</p>}
      {status === "paid" && (
        <>
          <p className="font-display text-2xl mb-2">Pago confirmado</p>
          <p className="text-sm text-white/60">Tu pedido ha llegado a cocina. Gracias.</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="font-display text-xl mb-2">No pudimos confirmar el pago</p>
          <p className="text-sm text-white/60">
            Si el cargo se hizo en tu tarjeta, contacta con el negocio para confirmar tu pedido.
          </p>
        </>
      )}
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <main className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
      <Suspense fallback={<p className="text-white/60 text-sm">Cargando...</p>}>
        <ConfirmacionContent />
      </Suspense>
    </main>
  );
}