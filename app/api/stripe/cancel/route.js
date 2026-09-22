import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: "No se encontro tu suscripcion" }, { status: 404 });
  }

  try {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceling" })
      .eq("business_id", businessId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}