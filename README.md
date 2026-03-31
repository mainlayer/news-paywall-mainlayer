# The Machine Times

A news site with per-article micropayments powered by [Mainlayer](https://mainlayer.xyz). Each article costs **$0.01** to read. AI agents can pay autonomously. Humans can too. No subscription, no account registration required.

## Concept

Traditional paywalls demand subscriptions. The Machine Times uses micropayments: pay exactly $0.01 per article, instantly, with no friction.

This works especially well for AI agents. An agent can:

1. Discover articles via `GET /api/articles`
2. See the price and `resource_id` in the response
3. Pay via the Mainlayer API
4. Immediately read the full article

No human in the loop. No account creation. The entire flow takes milliseconds.

## How AI Agents Pay Automatically

Any agent framework that can make HTTP requests can pay for articles:

```bash
# Step 1: List available articles
curl https://your-domain.com/api/articles

# Step 2: Pay for the article you want
curl -X POST https://api.mainlayer.xyz/pay \
  -H "Authorization: Bearer YOUR_WALLET_CREDENTIAL" \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "res_abc123...",
    "payer_wallet": "wallet_your_agent_id"
  }'

# Step 3: Read the full article
curl "https://your-domain.com/api/articles/ai-agents-economy-2026?wallet=wallet_your_agent_id"
```

When an agent requests an article without payment, the API returns HTTP 402 with structured payment instructions:

```json
{
  "error": "payment_required",
  "resource_id": "res_abc123",
  "price_usdc": 0.01,
  "pay_endpoint": "https://api.mainlayer.xyz/pay",
  "message": "Pay via Mainlayer then retry with your wallet address."
}
```

A well-implemented agent sees this 402, calls the `pay_endpoint` with its wallet credential, then retries the original request.

## Setup (5 minutes)

### Prerequisites

- Node.js 22+
- A [Mainlayer](https://mainlayer.xyz) account and API key

### 1. Clone and install

```bash
git clone <repo-url>
cd news-paywall-mainlayer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set MAINLAYER_API_KEY=your_key_here
```

### 3. Register articles with Mainlayer

This creates a payable resource for each article and prints the resource IDs:

```bash
npm run setup
```

Copy the output into your `.env` file (it will look like `ARTICLE_RESOURCE_ID_1=res_abc123`).

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy with Docker

```bash
docker compose up -d
```

Or deploy to [Vercel](https://vercel.com) by importing the repo — it works out of the box. Set all environment variables in the Vercel dashboard.

## API Reference

All endpoints return JSON. No authentication required to list or preview articles.

### `GET /api/articles`

List all articles with metadata and pricing.

```json
{
  "articles": [
    {
      "slug": "ai-agents-economy-2026",
      "title": "How AI Agents Are Creating a New Micro-Economy",
      "author": "Elena Vasquez",
      "date": "March 28, 2026",
      "category": "AI & Economy",
      "readTime": "8 min read",
      "preview": "...",
      "price_usdc": 0.01,
      "resource_id": "res_abc123",
      "content_endpoint": "/api/articles/ai-agents-economy-2026",
      "info_endpoint": "/api/articles/ai-agents-economy-2026/info"
    }
  ],
  "total": 10,
  "agent_instructions": {
    "how_to_read": "Pick an article, pay via Mainlayer, then GET /api/articles/{slug}?wallet={your_wallet}",
    "pay_endpoint": "https://api.mainlayer.xyz/pay",
    "price_per_article_usdc": 0.01
  }
}
```

### `GET /api/articles/:slug/info`

Article metadata and pricing. Includes `agent_instructions` with step-by-step payment flow. No authentication required.

### `GET /api/articles/:slug?wallet=<payer_wallet>`

Returns full article content if the wallet has paid. Returns 402 if not.

**Query parameters:**
- `wallet` — your Mainlayer wallet ID (required for access)

**Success (200):**
```json
{
  "slug": "ai-agents-economy-2026",
  "title": "...",
  "content": "Full article text...",
  "price_usdc": 0.01
}
```

**Payment required (402):**
```json
{
  "error": "payment_required",
  "resource_id": "res_abc123",
  "price_usdc": 0.01,
  "pay_endpoint": "https://api.mainlayer.xyz/pay"
}
```

### `POST /api/pay`

UI proxy that executes a Mainlayer payment. Keeps the API key server-side.

**Body:**
```json
{
  "resource_id": "res_abc123",
  "payer_wallet": "wallet_your_id"
}
```

Or use `slug` instead of `resource_id`:
```json
{
  "slug": "ai-agents-economy-2026",
  "payer_wallet": "wallet_your_id"
}
```

**Note:** AI agents with their own wallet credentials should call `https://api.mainlayer.xyz/pay` directly rather than going through this proxy.

## Project Structure

```
app/
  api/
    articles/
      route.ts              # GET /api/articles — list all
      [slug]/
        route.ts            # GET /api/articles/:slug — full content (requires payment)
        info/
          route.ts          # GET /api/articles/:slug/info — metadata & pricing
    pay/
      route.ts              # POST /api/pay — payment proxy
  articles/[slug]/
    page.tsx                # Article reader page with paywall UI
  page.tsx                  # Homepage — article listing
  layout.tsx
  globals.css
components/
  ArticleCard.tsx           # Article preview card
  AgentGuide.tsx            # AI agent quick-start sidebar
lib/
  articles.ts               # Article data (10 articles)
  mainlayer.ts              # Mainlayer API client
  paywall.ts                # Access checking and 402 response helpers
scripts/
  setup-resources.ts        # Register articles with Mainlayer
tests/
  api.test.ts               # 20+ unit and integration tests (Vitest)
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MAINLAYER_API_KEY` | Yes | Your Mainlayer API key |
| `ARTICLE_RESOURCE_ID_1` through `_10` | Yes (after setup) | Mainlayer resource IDs for each article |

## Running Tests

```bash
npm test                  # Run all tests
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode
```

## Built With

- [Next.js 15](https://nextjs.org) — framework
- [Mainlayer](https://mainlayer.xyz) — payment infrastructure
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [Vitest](https://vitest.dev) — testing
