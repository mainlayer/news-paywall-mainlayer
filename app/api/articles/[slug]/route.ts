import { NextRequest, NextResponse } from "next/server";
import { getArticle } from "@/lib/articles";
import { checkAccess, buildPaymentRequired } from "@/lib/paywall";

/**
 * GET /api/articles/[slug]?wallet=<payer_wallet>
 *
 * Returns full article content if the wallet has paid.
 * Returns 402 Payment Required with payment instructions if not.
 * Returns 404 if the article does not exist.
 *
 * AI agents: check the 402 response body for resource_id and pay_endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet");

  const article = getArticle(slug);

  if (!article) {
    return NextResponse.json(
      { error: "not_found", message: `Article '${slug}' does not exist` },
      { status: 404 }
    );
  }

  const access = await checkAccess({
    resource_id: article.resource_id,
    payer_wallet: wallet,
  });

  if (!access.has_access) {
    if (access.reason === "error") {
      // Mainlayer unreachable — fail closed (deny access)
      return NextResponse.json(
        {
          error: "service_unavailable",
          message: "Payment verification temporarily unavailable. Please retry.",
          detail: access.error,
        },
        { status: 503 }
      );
    }

    const paymentInfo = buildPaymentRequired({
      resource_id: article.resource_id,
      price_usdc: article.price_usdc,
      slug: article.slug,
    });

    return NextResponse.json(paymentInfo, { status: 402 });
  }

  // Access granted — return full article content
  return NextResponse.json({
    slug: article.slug,
    title: article.title,
    author: article.author,
    date: article.date,
    category: article.category,
    readTime: article.readTime,
    content: article.content,
    price_usdc: article.price_usdc,
  });
}
