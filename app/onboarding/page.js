"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categoryConfig";

const DIAS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ICONS = ["💈", "🍽️", "🩺", "🔧", "🛍️", "☕", "💅", "🐾", "🧁", "🏋️"];

function slugify(s) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "tu-negocio"
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("peluqueria");
  const [icon, setIcon] = useState("💈");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [days, setDays] = useState([true, true, true, true, true, true, false]);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const cfg = CATEGORY_CONFIG[categoryId] || CATEGORY_CONFIG.otro;
  const effectiveSlug = slugTouched ? slug : slugify(name);

  function pickCategory(cat) {
    setCategoryId(cat.id);
    setIcon(cat.em);
  }

  function toggleDay(i) {
    setDays((d) => d.map((v, idx) => (idx === i ? !v : v)));
  }

  function setAnswer(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function next() {
    if (step === 1 && !name.trim()) {
      setError("Ponle un nombre a tu negocio");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }
  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  async function finish() {
    if (!email.trim() || password.length < 6) {
      setError("Necesitamos un email y una contraseña de al menos 6 caracteres");
      return;
    }
    setError("");
    setLoading(true);

    // 1. Crear la cuenta del negocio en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Si tienes activada la confirmación por email en Supabase, authData.session
    // vendrá vacío hasta que el usuario confirme el correo. Para probar rápido
    // en desarrollo, puedes desactivar "Confirm email" en Authentication > Sign In / Providers.
    const userId = authData.user?.id;
    if (!userId) {
      setError("Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión.");
      setLoading(false);
      return;
    }

    // 2. Construir horario y perfil a partir de las respuestas
    const hours = {};
    DIAS_FULL.forEach((_, i) => {
      hours[i] = days[i] ? (categoryId === "restaurante" ? "13:00–16:30" : "9:30–20:00") : null;
    });

    // 3. Crear el negocio
    const { error: insertError } = await supabase.from("businesses").insert({
      owner_id: userId,
      name,
      category_id: categoryId,
      icon,
      slug: effectiveSlug,
      hours,
      profile: answers,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // El panel (/panel) todavía no está construido — es el siguiente paso.
    router.push("/panel");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-[#1E332B] border border-white/10 rounded-2xl p-8">
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${n <= step ? "bg-mustard" : "bg-white/15"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="font-display text-xl mb-5">¿Cómo se llama tu negocio?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Peluquería Aurora"
              className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-5 outline-none focus:border-mustard"
            />
            <label className="block text-xs font-semibold text-white/60 mb-2">Categoría</label>
            <div className="flex flex-col gap-2 mb-5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickCategory(c)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm font-medium text-left ${
                    categoryId === c.id
                      ? "border-mustard bg-mustard/10"
                      : "border-white/15 bg-[#16231D]"
                  }`}
                >
                  <span>{c.em}</span> {c.label}
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold text-white/60 mb-2">Icono para tu panel</label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`aspect-square rounded-lg border text-lg flex items-center justify-center ${
                    icon === em ? "border-mustard bg-mustard/10" : "border-white/15 bg-[#16231D]"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl mb-5">Así verán tu negocio tus clientes</h2>
            <div className="bg-[#284137] rounded-lg px-3.5 py-2.5 text-sm mb-4">
              flypax.app/<b className="text-mustard">{effectiveSlug}</b>
            </div>
            <label className="block text-xs font-semibold text-white/60 mb-2">Editar link</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder={slugify(name)}
              className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-mustard"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-xl mb-5">¿Cuándo estáis abiertos?</h2>
            <div className="flex flex-col gap-2">
              {DIAS_FULL.map((d, i) => (
                <div key={d} className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold flex-shrink-0 ${
                      days[i] ? "bg-mustard border-mustard text-ink" : "border-white/15 text-white/40"
                    }`}
                  >
                    {d.slice(0, 1)}
                  </button>
                  <span className="flex-1">{d}</span>
                  <span className="text-white/50">
                    {days[i] ? (categoryId === "restaurante" ? "13:00–16:30" : "9:30–20:00") : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-xl mb-5">Últimos detalles</h2>
            <div className="flex flex-col gap-4 mb-6">
              {cfg.onboardQ.map((q) => (
                <div key={q.key}>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">{q.label}</label>
                  {q.type === "bool" ? (
                    <div className="flex gap-2">
                      {["Sí", "No"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(q.key, opt === "Sí")}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                            answers[q.key] === (opt === "Sí")
                              ? "border-mustard bg-mustard/10"
                              : "border-white/15"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === "select" ? (
                    <select
                      value={answers[q.key] || ""}
                      onChange={(e) => setAnswer(q.key, e.target.value)}
                      className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm"
                    >
                      <option value="" disabled>
                        Elige una opción
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
                      value={answers[q.key] || ""}
                      onChange={(e) => setAnswer(q.key, e.target.value)}
                      placeholder={q.placeholder}
                      className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-5">
              <p className="text-xs text-white/50 mb-3">Crea tu cuenta para acceder a tu panel</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@negocio.com"
                className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm mb-3"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="w-full bg-[#16231D] border border-white/15 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-xs mt-5">{error}</p>}

        <div className="flex justify-between items-center mt-7">
          {step > 1 ? (
            <button onClick={back} className="text-white/60 text-sm font-semibold">
              Atrás
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button onClick={next} className="bg-mustard text-ink font-semibold px-6 py-2.5 rounded-full text-sm">
              Continuar
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={loading}
              className="bg-mustard text-ink font-semibold px-6 py-2.5 rounded-full text-sm disabled:opacity-60"
            >
              {loading ? "Creando…" : "Crear mi panel →"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}