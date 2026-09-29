"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink text-white/50 text-sm px-6">
        Cargando enlace de recuperacion... Si no cambia en unos segundos, el enlace puede haber caducado -
        solicita uno nuevo.
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink text-white text-sm">
        Contraseña actualizada. Redirigiendo al login...
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-ink">
      <div className="w-full max-w-sm bg-[#1E332B] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
        </div>
        <h1 className="font-display text-xl mb-5 text-white text-center">Nueva contraseña</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña (min. 6 caracteres)"
          className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3 text-white"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4 text-white"
        />
        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-mustard text-ink font-semibold py-3 rounded-full text-sm disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar contraseña"}
        </button>
      </div>
    </main>
  );
}