import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { invoiceId } = await request.json();

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select("*, businesses(name, tax_id, address, icon)")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }
  if (!invoice.client_email) {
    return NextResponse.json({ error: "Esta factura no tiene email del cliente" }, { status: 400 });
  }

  const biz = invoice.businesses;
  const rowsHtml = (invoice.items || [])
    .map(
      (l) =>
        `<tr><td style="padding:8px 0;">${l.qty}× ${l.name}</td><td style="text-align:right;">${(l.qty * l.price).toFixed(2)}€</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1B2A22;">
      <h2 style="margin-bottom:2px;">${biz?.icon || ""} ${biz?.name || ""}</h2>
      ${biz?.tax_id ? `<p style="color:#666;font-size:13px;margin:0;">NIF/CIF: ${biz.tax_id}</p>` : ""}
      ${biz?.address ? `<p style="color:#666;font-size:13px;margin:0 0 16px;">${biz.address}</p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
      <p style="font-size:13px;color:#666;">Factura para <b>${invoice.client_name}</b>${invoice.client_nif ? ` · NIF: ${invoice.client_nif}` : ""}</p>
      <p style="font-size:13px;color:#666;">Fecha: ${invoice.date}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        ${rowsHtml}
      </table>
      <div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;"><span>Base imponible</span><span>${Number(invoice.subtotal).toFixed(2)}€</span></div>
        <div style="display:flex;justify-content:space-between;"><span>IVA (${invoice.iva_rate}%)</span><span>${Number(invoice.iva_amount).toFixed(2)}€</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:17px;margin-top:6px;"><span>Total</span><span>${Number(invoice.total).toFixed(2)}€</span></div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Flypax <onboarding@resend.dev>",
      to: invoice.client_email,
      subject: `Factura de ${biz?.name || "tu negocio"}`,
      html,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  await supabaseAdmin.from("invoices").update({ sent_at: new Date().toISOString() }).eq("id", invoiceId);

  return NextResponse.json({ ok: true });
}