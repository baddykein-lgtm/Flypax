import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";

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
    .select("id, owner_id, name, slug")
    .eq("id", businessId)
    .maybeSingle();
  if (!business || business.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
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

    try {
      await resend.emails.send({
        from: "Flypax <facturas@flypax.online>",
        to: process.env.ADMIN_EMAILS,
        subject: "Cancelacion: " + business.name + " ha cancelado su suscripcion",
        html:
          "<p><b>" + business.name + "</b> (/" + business.slug + ") ha cancelado su suscripcion.</p>" +
          "<p>Estado previo: " + (sub.status || "desconocido") + "</p>" +
          "<p>Email del propietario: " + userData.user.email + "</p>",
      });
    } catch (e) {
      // no bloqueamos la cancelacion si falla el email de aviso
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}