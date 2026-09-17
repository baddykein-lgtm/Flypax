import { createClient } from "@supabase/supabase-js";

// Cliente para usar en componentes de cliente (navegador).
// Usa la clave "anon", así que respeta las políticas RLS que
// definimos en flypax-schema.sql — nunca expone datos que no debería.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
