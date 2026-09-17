import "./globals.css";

export const metadata = {
  title: "Flypax — la puerta digital de tu negocio",
  description: "Reservas, citas, carta digital, pedidos en mesa, QR y facturas para negocios locales.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-[#F4EFE3] font-body">{children}</body>
    </html>
  );
}
