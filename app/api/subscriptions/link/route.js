import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Se llama justo después de crear el negocio en /onboarding. En ese momento
// puede que ya exista una fila en "subscriptions" con business_id null (la
// dejó el webhook de Stripe cuando el usuario pagó, antes de tener negocio)
// — aquí la enlazamos al negocio recién creado buscando por email.
//
// Si el webhook todavía no ha llegado (puede tardar unos segundos, o no
// llegar nunca en local sin `stripe listen`), esto no encuentra nada y no
// pasa nada grave: el panel mostrará el aviso de suscripción inactiva y el
// dueño podrá reactivar/reintentar desde ahí.
export async function POST(request) {
  const { token, businessId } = await request.json();
  if (!token || !businessId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business || business.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const email = userData.user.email?.toLowerCase();
  const { data: rows } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("customer_email", email)
    .is("business_id", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (rows && rows[0]) {
    await supabaseAdmin.from("subscriptions").update({ business_id: businessId }).eq("id", rows[0].id);
    return NextResponse.json({ linked: true });
  }

  return NextResponse.json({ linked: false });
}
