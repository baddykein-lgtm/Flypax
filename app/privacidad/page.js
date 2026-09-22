import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-ink text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-block mb-8">
          <img src="/logo.png" alt="Flypax" className="h-7 w-auto" />
        </Link>

        <h1 className="font-display text-3xl mb-2">Politica de privacidad</h1>
        <p className="text-white/40 text-sm mb-10">Ultima actualizacion: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="flex flex-col gap-6 text-sm text-white/70 leading-relaxed">
          <section>
            <h2 className="font-semibold text-white mb-2">1. Quienes somos</h2>
            <p>
              Flypax es una plataforma que permite a negocios locales gestionar reservas, citas, pedidos en
              mesa, facturas y su presencia digital. Esta pagina explica que datos recogemos, para que los
              usamos, y que derechos tienes sobre ellos.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-2">2. Datos que recogemos</h2>
            <p className="mb-2">Segun como uses Flypax, podemos recoger:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Datos de contacto de negocios: nombre, email, direccion, ciudad, telefono.</li>
              <li>Datos de clientes al hacer una reserva o pedido: nombre, telefono, email (opcional).</li>
              <li>Datos de pago: gestionados directamente por Stripe, nunca almacenamos numeros de tarjeta.</li>
              <li>Datos de uso: paginas visitadas, dispositivo, para mejorar el servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-2">3. Para que usamos tus datos</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Gestionar reservas, citas y pedidos entre clientes y negocios.</li>
              <li>Procesar pagos y suscripciones a traves de Stripe.</li>
              <li>Enviar facturas y confirmaciones por email.</li>
              <li>Mostrar tu negocio en el directorio publico, si te has dado de alta como negocio.</li>
              <li>Mejorar la plataforma y prevenir usos fraudulentos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-2">4. Con quien compartimos datos</h2>
            <p>
              Usamos proveedores externos para operar el servicio: Supabase (base de datos y almacenamiento),
              Stripe (pagos), Resend (email), y Vercel (alojamiento). Estos proveedores solo acceden a los
              datos necesarios para prestar su servicio, y no los usan con otros fines.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-2">5. Tus derechos</h2>
            <p>
              Puedes solicitar acceso, rectificacion o eliminacion de tus datos en cualquier momento. Los
              negocios pueden borrar su cuenta y todos sus datos desde Ajustes en su panel. Los clientes
              pueden solicitarlo escribiendo a{" "}
              <a href="mailto:info@flypax.online" className="text-mustard underline">
                info@flypax.online
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-2">6. Contacto</h2>
            <p>
              Para cualquier duda sobre esta politica de privacidad, escribenos a{" "}
              <a href="mailto:info@flypax.online" className="text-mustard underline">
                info@flypax.online
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}