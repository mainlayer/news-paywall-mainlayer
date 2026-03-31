#!/usr/bin/env npx tsx
/**
 * scripts/setup-resources.ts
 *
 * Registers all articles as paid resources with Mainlayer and prints
 * the environment variable assignments needed for your .env file.
 *
 * Usage:
 *   MAINLAYER_API_KEY=your_key npm run setup
 */

import { getAllArticles } from "../lib/articles";

const MAINLAYER_BASE_URL = "https://api.mainlayer.xyz";

async function createResource(params: {
  name: string;
  description: string;
  price_usdc: number;
}): Promise<{ id: string }> {
  const apiKey = process.env.MAINLAYER_API_KEY;
  if (!apiKey) {
    throw new Error("MAINLAYER_API_KEY environment variable is not set.");
  }

  const response = await fetch(`${MAINLAYER_BASE_URL}/resources`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create resource "${params.name}": HTTP ${response.status} — ${error}`
    );
  }

  return response.json() as Promise<{ id: string }>;
}

async function main() {
  const articles = getAllArticles();

  console.log(`\nRegistering ${articles.length} articles with Mainlayer...\n`);
  console.log("Add these to your .env file:\n");

  const results: string[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const envVar = `ARTICLE_RESOURCE_ID_${i + 1}`;

    try {
      const resource = await createResource({
        name: article.title,
        description: `Full text of: ${article.title} — by ${article.author}`,
        price_usdc: article.price_usdc,
      });

      const line = `${envVar}=${resource.id}`;
      results.push(line);
      console.log(`  ${line}  # ${article.slug}`);
    } catch (error) {
      console.error(
        `  ERROR registering "${article.slug}":`,
        error instanceof Error ? error.message : error
      );
      results.push(`# ${envVar}=REGISTRATION_FAILED`);
    }
  }

  console.log(
    "\nDone. Copy the lines above into your .env file, then restart the server.\n"
  );
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
