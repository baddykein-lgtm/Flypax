import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Verificamos el token contra Supabase Auth (no nos fiamos de un email que
  // mande el navegador, comprobamos quién es de verdad el dueño de la sesión).
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const email = userData.user.email?.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // A partir de aquí usamos la service_role key (supabaseAdmin), que se salta
    // las políticas de seguridad normales — es lo que permite ver TODOS los
    // negocios y no solo el propio, algo que un dueño de negocio normal no puede hacer.
    const [{ data: businesses }, { count: reservationsCount }, { count: ordersCount }, { data: invoices }] =
      await Promise.all([
        supabaseAdmin.from("businesses").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("reservations").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("invoices").select("total, paid"),
      ]);

    const totalRevenue = (invoices || []).filter((i) => i.paid).reduce((a, i) => a + Number(i.total), 0);

    return NextResponse.json({
      businesses: businesses || [],
      totalBusinesses: (businesses || []).length,
      totalReservations: reservationsCount || 0,
      totalOrders: ordersCount || 0,
      totalRevenue,
    });
  } catch (err) {
    console.error("Error cargando resumen de admin:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}