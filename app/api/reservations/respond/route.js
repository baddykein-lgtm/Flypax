import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { token, reservationId, action, reason } = await request.json();
  if (!token || !reservationId || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("*, businesses(name, owner_id, icon)")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation || reservation.businesses?.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const newStatus = action === "accept" ? "confirmada" : "cancelada";
  const updates = { status: newStatus };
  if (action === "reject") updates.rejection_reason = reason || null;

  const { error: updateError } = await supabaseAdmin
    .from("reservations")
    .update(updates)
    .eq("id", reservationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (reservation.client_email) {
    const biz = reservation.businesses;
    const subject =
      action === "accept"
        ? "Tu reserva en " + biz.name + " esta confirmada"
        : "Tu reserva en " + biz.name + " no ha podido confirmarse";

    const html =
      "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1B2A22;\">" +
      "<h2 style=\"margin-bottom:16px;\">" + (biz.icon || "") + " " + biz.name + "</h2>" +
      (action === "accept"
        ? "<p>Hola " + reservation.client_name + ", tu reserva para el " + reservation.date + " a las " + reservation.time + " esta confirmada. Te esperamos.</p>"
        : "<p>Hola " + reservation.client_name + ", lamentamos informarte de que tu reserva para el " + reservation.date + " a las " + reservation.time + " no ha podido confirmarse." +
          (reason ? " Motivo: " + reason : "") +
          " Puedes intentar reservar en otro horario.</p>") +
      "</div>";

    try {
      await resend.emails.send({
        from: "Flypax <facturas@flypax.online>",
        to: reservation.client_email,
        subject,
        html,
      });
    } catch (e) {}
  }

  return NextResponse.json({ ok: true });
}