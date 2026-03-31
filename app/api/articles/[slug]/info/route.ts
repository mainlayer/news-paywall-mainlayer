import { NextRequest, NextResponse } from "next/server";
import { getArticle } from "@/lib/articles";

/**
 * GET /api/articles/[slug]/info
 *
 * Public endpoint — returns article metadata and pricing.
 * No authentication required. Suitable for AI agents to discover
 * what an article costs before deciding whether to pay.
 *
 * Response includes the resource_id needed to make a payment.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const article = getArticle(slug);

  if (!article) {
    return NextResponse.json(
      { error: "not_found", message: `Article '${slug}' does not exist` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    slug: article.slug,
    title: article.title,
    author: article.author,
    date: article.date,
    category: article.category,
    readTime: article.readTime,
    preview: article.preview,
    image_url: article.image_url,
    price_usdc: article.price_usdc,
    resource_id: article.resource_id,
    // Structured instructions for AI agents
    agent_instructions: {
      step_1: "Pay for access using the pay_endpoint below",
      step_2: `POST ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/pay with { resource_id, payer_wallet }`,
      step_3: `GET /api/articles/${slug}?wallet=<your_wallet> to read the full article`,
      pay_endpoint: "https://api.mainlayer.xyz/pay",
      content_endpoint: `/api/articles/${slug}`,
    },
  });
}
