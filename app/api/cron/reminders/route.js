import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Se ejecuta una vez al dia por Vercel Cron (ver vercel.json). Busca
// reservas confirmadas cuya fecha sea la de mañana, y les envia un
// recordatorio por email si aun no se les envio. Aplica a cualquier
// tipo de negocio (restaurante, peluqueria, clinica, taller...).
export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("*, businesses(name, icon)")
    .eq("status", "confirmada")
    .eq("reminder_sent", false)
    .eq("date", tomorrowStr)
    .not("client_email", "is", null);

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const r of reservations) {
    const biz = r.businesses;
    const html =
      "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1B2A22;\">" +
      "<h2 style=\"margin-bottom:16px;\">" + (biz?.icon || "") + " " + (biz?.name || "") + "</h2>" +
      "<p>Hola " + r.client_name + ", te recordamos tu reserva para mañana, " + r.date + " a las " + r.time + ".</p>" +
      "<p style=\"color:#666;font-size:13px;\">Si ya no puedes acudir, contacta directamente con el negocio para avisar.</p>" +
      "</div>";

    try {
      await resend.emails.send({
        from: "Flypax <facturas@flypax.online>",
        to: r.client_email,
        subject: "Recordatorio: tu reserva en " + (biz?.name || "tu negocio") + " es mañana",
        html,
      });
      await supabaseAdmin.from("reservations").update({ reminder_sent: true }).eq("id", r.id);
      sent++;
    } catch (e) {
      // seguimos con las demas aunque una falle
    }
  }

  return NextResponse.json({ sent });
}