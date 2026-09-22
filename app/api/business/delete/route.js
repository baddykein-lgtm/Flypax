import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

  await supabaseAdmin.from("reservations").delete().eq("business_id", businessId);
  await supabaseAdmin.from("orders").delete().eq("business_id", businessId);
  await supabaseAdmin.from("invoices").delete().eq("business_id", businessId);
  await supabaseAdmin.from("products").delete().eq("business_id", businessId);
  await supabaseAdmin.from("subscriptions").delete().eq("business_id", businessId);
  await supabaseAdmin.from("businesses").delete().eq("id", businessId);

  return NextResponse.json({ ok: true });
}