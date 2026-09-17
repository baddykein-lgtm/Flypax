import Stripe from "stripe";

// Cliente de Stripe — solo se usa en rutas API (servidor), nunca en el navegador.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});
