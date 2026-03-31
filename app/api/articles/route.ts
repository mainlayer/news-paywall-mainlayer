import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/articles";

/**
 * GET /api/articles
 *
 * Returns the list of all articles with metadata and preview text.
 * No authentication required — this is the discovery endpoint.
 *
 * AI agents: use this to find article slugs and resource_ids before paying.
 */
export async function GET() {
  const articles = getAllArticles();

  return NextResponse.json({
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      author: a.author,
      date: a.date,
      category: a.category,
      readTime: a.readTime,
      preview: a.preview,
      image_url: a.image_url,
      price_usdc: a.price_usdc,
      resource_id: a.resource_id,
      // Endpoint to fetch full content (requires payment)
      content_endpoint: `/api/articles/${a.slug}`,
      // Endpoint to get payment metadata for this article
      info_endpoint: `/api/articles/${a.slug}/info`,
    })),
    total: articles.length,
    // Agent-friendly instructions embedded at the list level
    agent_instructions: {
      how_to_read:
        "Pick an article, pay for access via Mainlayer, then GET /api/articles/{slug}?wallet={your_wallet}",
      pay_endpoint: "https://api.mainlayer.xyz/pay",
      price_per_article_usdc: 0.01,
    },
  });
}
