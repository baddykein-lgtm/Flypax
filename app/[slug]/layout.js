import { supabase } from "@/lib/supabaseClient";

export async function generateMetadata({ params }) {
  const { data: biz } = await supabase
    .from("businesses")
    .select("name, city, icon")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!biz) {
    return { title: "Flypax" };
  }

  const title = `${biz.icon || ""} ${biz.name} · Flypax`.trim();
  const description = `Reserva o pide en ${biz.name}${biz.city ? " (" + biz.city + ")" : ""} directamente desde el móvil, sin llamadas.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function SlugLayout({ children }) {
  return children;
}
