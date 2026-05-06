import "server-only";
import Stripe from "stripe";
import { getStripeConfig } from "../env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const { secretKey } = getStripeConfig();
  _stripe = new Stripe(secretKey);
  return _stripe;
}
