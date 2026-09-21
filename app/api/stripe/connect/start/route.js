import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Genera la URL de Stripe donde el negocio autoriza a Flypax a crear
// pagos en su nombre. No usamos la clave secreta de aqui, solo el
// Client ID publico de la app de Connect (seguro de exponer en la URL).
export async function POST(request) {
  const { token, businessId } = await request.json();
  if (!token || !businessId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business || business.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const redirectUri = process.env.NEXT_PUBLIC_SITE_URL + "/api/stripe/connect/callback";
  const url =
    "https://connect.stripe.com/oauth/authorize" +
    "?response_type=code" +
    "&client_id=" + process.env.STRIPE_CONNECT_CLIENT_ID +
    "&scope=read_write" +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&state=" + businessId;

  return NextResponse.json({ url });
}