import { createClient } from "@supabase/supabase-js";

// SOLO para usar en el servidor (rutas /app/api/**), nunca en el navegador.
// Usa la service_role key, que se salta las políticas RLS —
// necesaria para que el webhook de Stripe pueda escribir en
// "subscriptions" sin que haya una sesión de usuario detrás.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
