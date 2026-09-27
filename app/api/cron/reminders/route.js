import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("*, businesses(name, icon)")
    .eq("status", "confirmada")
    .eq("reminder_sent", false)
    .not("client_email", "is", null);

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const r of reservations) {
    const when = new Date(r.date + "T" + r.time + ":00");
    if (when < windowStart || when > windowEnd) continue;

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
    } catch (e) {}
  }

  return NextResponse.json({ sent });
}