"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email o contraseña incorrectos");
      return;
    }
    router.push("/panel");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-ink text-[#F4EFE3]">
      <div className="w-full max-w-sm bg-[#1E332B] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
        </div>
        <h1 className="font-display text-2xl mb-1">Entrar en tu panel</h1>
        <p className="text-white/55 text-sm mb-6">Accede con tu email y contraseña</p>

        <label className="block text-xs font-semibold text-white/60 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4"
        />
        <label className="block text-xs font-semibold text-white/60 mb-1.5">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-4"
        />

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-mustard text-ink font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </main>
  );
}