"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AfiliadosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("/api/admin/affiliates", {
          method: "POST",
          headers: { Authorization: "Bearer " + session.access_token },
        });
        if (!res.ok) {
          setError("No se pudo cargar la lista de afiliados.");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setAffiliates(json.affiliates || []);
        setLoading(false);
      } catch (e) {
        setError("Error de conexion con el servidor.");
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm">
        Cargando...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink text-white text-sm">
        {error}
      </div>
    );

  const totalMensual = affiliates.reduce((sum, a) => sum + a.totalDue, 0);

  return (
    <main className="min-h-screen bg-paper text-[#1B2A22] p-8">
      <Link href="/admin" className="text-sm text-[#5b6b60] mb-4 inline-block">
        ← Volver al panel de administracion
      </Link>
      <h1 className="font-display text-2xl mb-1">Afiliados</h1>
      <p className="text-sm text-[#5b6b60] mb-6">
        Comision a pagar por transferencia este mes: 10 EUR los primeros 4 meses por negocio, 5 EUR los
        siguientes 4, 0 EUR despues.
      </p>

      <div className="bg-white border border-black/10 rounded-xl p-4 mb-6 inline-block">
        <div className="text-xs text-[#5b6b60] font-semibold mb-1">Total a pagar este mes</div>
        <div className="font-display text-2xl text-mustard">{totalMensual.toFixed(2)} EUR</div>
      </div>

      {affiliates.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl p-6 text-sm text-[#5b6b60]">
          Todavia no hay afiliados registrados.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {affiliates.map((a) => (
            <div key={a.id} className="bg-white border border-black/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-[#5b6b60]">
                    {a.email} - codigo {a.code} - {a.referredCount} negocio(s)
                  </div>
                </div>
                <div className="font-display text-lg text-mustard">{a.totalDue.toFixed(2)} EUR</div>
              </div>
              {a.details.length > 0 && (
                <div className="px-5 py-3 text-xs text-[#5b6b60]">
                  {a.details.map((d, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>
                        {d.name} ({"/" + d.slug}) - mes {d.monthsIn + 1}
                      </span>
                      <span className="font-semibold">{d.commission.toFixed(2)} EUR</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}