import { mainlayer } from "./mainlayer";

export interface AccessResult {
  has_access: boolean;
  reason?: "paid" | "no_wallet" | "not_paid" | "no_resource_id" | "error";
  error?: string;
}

/**
 * Check whether a given wallet address has paid for a resource.
 * Returns a structured result rather than throwing, for use in API routes.
 */
export async function checkAccess(params: {
  resource_id: string;
  payer_wallet: string | null | undefined;
}): Promise<AccessResult> {
  const { resource_id, payer_wallet } = params;

  if (!payer_wallet) {
    return { has_access: false, reason: "no_wallet" };
  }

  if (!resource_id) {
    // If resource_id is not configured, block access rather than granting it
    return { has_access: false, reason: "no_resource_id" };
  }

  try {
    const result = await mainlayer.entitlements.check({
      resource_id,
      payer_wallet,
    });

    if (result.has_access) {
      return { has_access: true, reason: "paid" };
    }

    return { has_access: false, reason: "not_paid" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      has_access: false,
      reason: "error",
      error: message,
    };
  }
}

/**
 * Build the 402 Payment Required response payload for an article.
 */
export function buildPaymentRequired(params: {
  resource_id: string;
  price_usdc: number;
  slug: string;
}) {
  return {
    error: "payment_required",
    resource_id: params.resource_id,
    price_usdc: params.price_usdc,
    pay_endpoint: "https://api.mainlayer.xyz/pay",
    info_endpoint: `/api/articles/${params.slug}/info`,
    message: `This article costs $${params.price_usdc.toFixed(2)} USDC to read. Pay via Mainlayer then retry with your wallet address.`,
  };
}
