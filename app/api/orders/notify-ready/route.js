import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { token, orderId } = await request.json();
  if (!token || !orderId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, business_id, fulfillment, client_name, client_email, ready_notified, businesses(name, icon, owner_id)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.businesses?.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (order.fulfillment !== "recoger" || !order.client_email || order.ready_notified) {
    return NextResponse.json({ sent: false });
  }

  const biz = order.businesses;
  const html =
    "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1B2A22;\">" +
    "<h2 style=\"margin-bottom:16px;\">" + (biz?.icon || "") + " " + (biz?.name || "") + "</h2>" +
    "<p>Hola " + (order.client_name || "") + ", tu pedido ya esta listo para recoger.</p>" +
    "<p style=\"color:#666;font-size:13px;\">Puedes pasar a por el cuando quieras.</p>" +
    "</div>";

  try {
    await resend.emails.send({
      from: "Flypax <facturas@flypax.online>",
      to: order.client_email,
      subject: "Tu pedido en " + (biz?.name || "el negocio") + " esta listo para recoger",
      html,
    });
    await supabaseAdmin.from("orders").update({ ready_notified: true }).eq("id", orderId);
    return NextResponse.json({ sent: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}