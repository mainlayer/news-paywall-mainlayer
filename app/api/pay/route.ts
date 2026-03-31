import { NextRequest, NextResponse } from "next/server";
import { mainlayer } from "@/lib/mainlayer";
import { getArticle, getAllArticles } from "@/lib/articles";

/**
 * POST /api/pay
 *
 * Proxy endpoint that executes a Mainlayer payment on behalf of a payer.
 * Accepts: { resource_id, payer_wallet, slug? }
 *
 * This endpoint allows the frontend UI to initiate payments without
 * exposing the Mainlayer API key to the browser.
 *
 * AI agents can also call Mainlayer's /pay endpoint directly.
 */
export async function POST(request: NextRequest) {
  let body: { resource_id?: string; payer_wallet?: string; slug?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const { resource_id, payer_wallet, slug } = body;

  // If a slug was provided, look up the resource_id from our articles
  let resolvedResourceId = resource_id;
  if (!resolvedResourceId && slug) {
    const article = getArticle(slug);
    if (!article) {
      return NextResponse.json(
        { error: "not_found", message: `Article '${slug}' not found` },
        { status: 404 }
      );
    }
    resolvedResourceId = article.resource_id;
  }

  if (!resolvedResourceId) {
    return NextResponse.json(
      {
        error: "missing_resource_id",
        message: "Provide either resource_id or slug",
        available_articles: getAllArticles().map((a) => ({
          slug: a.slug,
          resource_id: a.resource_id,
          price_usdc: a.price_usdc,
        })),
      },
      { status: 400 }
    );
  }

  if (!payer_wallet) {
    return NextResponse.json(
      {
        error: "missing_payer_wallet",
        message: "payer_wallet is required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await mainlayer.payments.pay({
      resource_id: resolvedResourceId,
      payer_wallet,
    });

    return NextResponse.json({
      success: true,
      transaction_id: result.transaction_id,
      resource_id: result.resource_id,
      payer_wallet: result.payer_wallet,
      amount_usdc: result.amount_usdc,
      paid_at: result.paid_at,
      message: "Payment successful. You can now access the article.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json(
      { error: "payment_failed", message },
      { status: 402 }
    );
  }
}
