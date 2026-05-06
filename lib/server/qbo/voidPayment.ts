import "server-only";
import { getConnectionForOrg } from "../db/connections";
import { qboGet, qboPost } from "./client";

type FetchedPayment = {
  Payment?: {
    Id: string;
    SyncToken: string;
  };
};

// Voids a Payment in QBO. Returns true if the void posted, false if there was
// no QBO connection / payment to void. Throws on QBO API errors so the caller
// can decide whether to swallow them.
export async function voidQboPayment(
  organizationId: number,
  qboPaymentId: string,
): Promise<boolean> {
  const conn = getConnectionForOrg(organizationId);
  if (!conn) {
    console.warn(
      "[qbo] void: no QBO connection for org",
      organizationId,
    );
    return false;
  }

  // Fetch the existing Payment to read its current SyncToken.
  let fetched: FetchedPayment;
  try {
    fetched = await qboGet<FetchedPayment>(conn, `/payment/${qboPaymentId}`);
  } catch (err) {
    console.error("[qbo] void: failed to read payment", qboPaymentId, err);
    throw err;
  }
  const payment = fetched.Payment;
  if (!payment) {
    console.warn("[qbo] void: payment not found in QBO", qboPaymentId);
    return false;
  }

  await qboPost(conn, `/payment?operation=void`, {
    Id: payment.Id,
    SyncToken: payment.SyncToken,
  });
  return true;
}
