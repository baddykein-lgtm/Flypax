import Stripe from "stripe";

export const stripeConnect = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY, {
  apiVersion: "2024-06-20",
});