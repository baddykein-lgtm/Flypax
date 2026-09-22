import Link from "next/link";

const FAQS = [
  {
    q: "¿Que es Flypax?",
    a: "Flypax es una plataforma para negocios locales (restaurantes, peluquerias, talleres, clinicas, tiendas...) que permite gestionar reservas, citas, pedidos en mesa, carta digital, facturas y codigo QR, todo desde un unico panel.",
  },
  {
    q: "¿Como reservo o pido cita en un negocio?",
    a: "Entra en la pagina publica del negocio (el enlace que te han dado, o buscalo en flypax.online) y rellena el formulario de reserva o cita. No necesitas crear ninguna cuenta.",
  },
  {
    q: "¿Como funciona el pedido en mesa?",
    a: "Si el negocio es un restaurante o bar, escanea el codigo QR de tu mesa. Eso confirma automaticamente en que mesa estas, y puedes elegir pagar en el mostrador o pagar online desde el movil. Si accedes sin escanear un QR de mesa, el pago online es obligatorio, como medida de seguridad.",
  },
  {
    q: "Tengo un negocio, ¿como me doy de alta?",
    a: "Ve a flypax.online/negocios y pulsa Suscribirme. Tras crear tu cuenta y completar los datos de tu negocio, tienes acceso inmediato a tu panel, con 5 dias de prueba antes del primer cobro.",
  },
  {
    q: "¿Puedo cobrar los pedidos en mesa directamente en mi cuenta?",
    a: "Si. Desde Ajustes puedes conectar tu propia cuenta de Stripe. A partir de ahi, los pagos de tus clientes van directos a tu banco - Flypax no retiene ni cobra comision sobre esos pagos.",
  },
  {
    q: "¿Como cancelo mi suscripcion?",
    a: "Desde tu panel, en Ajustes, en la seccion Zona peligrosa, puedes cancelar tu suscripcion en cualquier momento. Mantienes acceso hasta el final del periodo ya pagado.",
  },
  {
    q: "¿Puedo borrar mi negocio y todos sus datos?",
    a: "Si, desde Ajustes tienes la opcion de borrar tu negocio de forma permanente. Esta accion no se puede deshacer.",
  },
  {
    q: "No me ha llegado la factura por email",
    a: "Revisa tu carpeta de spam o promociones. Si sigue sin aparecer, contacta con el negocio directamente, o escribenos si el problema persiste.",
  },
];

export default function AyudaPage() {
  return (
    <main className="min-h-screen bg-ink text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-block mb-8">
          <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
        </Link>

        <h1 className="font-display text-3xl mb-2">Ayuda</h1>
        <p className="text-white/55 mb-10">Preguntas frecuentes sobre Flypax.</p>

        <div className="flex flex-col gap-4">
          {FAQS.map((item) => (
            <div key={item.q} className="bg-[#1E332B] border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-sm mt-10">
          ¿No has encontrado lo que buscabas? Escribenos a{" "}
          <a href="mailto:info@flypax.online" className="text-mustard underline">
            info@flypax.online
          </a>
        </p>
      </div>
    </main>
  );
}