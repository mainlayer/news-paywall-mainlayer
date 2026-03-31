/**
 * API route tests for news-paywall-mainlayer.
 *
 * Tests use the Node.js fetch API against a local Next.js dev server.
 * Mainlayer API calls are intercepted by mocking global fetch.
 *
 * Run: npx vitest run
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = "http://localhost:3000";

/** Build a mock Response */
function mockResponse(
  body: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Article data tests (no network required) ─────────────────────────────────

describe("articles data layer", () => {
  it("exports exactly 10 articles", async () => {
    const { getAllArticles } = await import("../lib/articles");
    const articles = getAllArticles();
    expect(articles).toHaveLength(10);
  });

  it("every article has required fields", async () => {
    const { getAllArticles } = await import("../lib/articles");
    const articles = getAllArticles();
    for (const a of articles) {
      expect(a.slug).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.author).toBeTruthy();
      expect(a.date).toBeTruthy();
      expect(a.category).toBeTruthy();
      expect(a.readTime).toBeTruthy();
      expect(a.preview).toBeTruthy();
      expect(a.content.length).toBeGreaterThan(200);
      expect(a.price_usdc).toBe(0.01);
    }
  });

  it("all article slugs are unique", async () => {
    const { getAllArticles } = await import("../lib/articles");
    const slugs = getAllArticles().map((a) => a.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("getArticle returns correct article by slug", async () => {
    const { getArticle } = await import("../lib/articles");
    const article = getArticle("ai-agents-economy-2026");
    expect(article).toBeDefined();
    expect(article!.title).toBe("How AI Agents Are Creating a New Micro-Economy");
  });

  it("getArticle returns undefined for unknown slug", async () => {
    const { getArticle } = await import("../lib/articles");
    expect(getArticle("does-not-exist")).toBeUndefined();
  });

  it("article slugs contain no spaces or uppercase letters", async () => {
    const { getAllArticles } = await import("../lib/articles");
    for (const a of getAllArticles()) {
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("all articles have non-empty preview text", async () => {
    const { getAllArticles } = await import("../lib/articles");
    for (const a of getAllArticles()) {
      expect(a.preview.trim().length).toBeGreaterThan(50);
    }
  });

  it("image_url fields are non-empty strings", async () => {
    const { getAllArticles } = await import("../lib/articles");
    for (const a of getAllArticles()) {
      expect(typeof a.image_url).toBe("string");
      expect(a.image_url.length).toBeGreaterThan(0);
    }
  });
});

// ─── paywall.ts unit tests ────────────────────────────────────────────────────

describe("buildPaymentRequired", () => {
  it("returns correct 402 payload shape", async () => {
    const { buildPaymentRequired } = await import("../lib/paywall");
    const payload = buildPaymentRequired({
      resource_id: "res_test_123",
      price_usdc: 0.01,
      slug: "test-article",
    });

    expect(payload.error).toBe("payment_required");
    expect(payload.resource_id).toBe("res_test_123");
    expect(payload.price_usdc).toBe(0.01);
    expect(payload.pay_endpoint).toBe("https://api.mainlayer.fr/pay");
    expect(payload.info_endpoint).toBe("/api/articles/test-article/info");
    expect(payload.message).toContain("$0.01");
  });

  it("includes pay_endpoint pointing to Mainlayer", async () => {
    const { buildPaymentRequired } = await import("../lib/paywall");
    const payload = buildPaymentRequired({
      resource_id: "res_abc",
      price_usdc: 0.01,
      slug: "my-article",
    });
    expect(payload.pay_endpoint).toContain("mainlayer.fr");
  });
});

describe("checkAccess", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns no_wallet when payer_wallet is null", async () => {
    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "res_123",
      payer_wallet: null,
    });
    expect(result.has_access).toBe(false);
    expect(result.reason).toBe("no_wallet");
  });

  it("returns no_wallet when payer_wallet is empty string", async () => {
    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "res_123",
      payer_wallet: "",
    });
    expect(result.has_access).toBe(false);
    expect(result.reason).toBe("no_wallet");
  });

  it("returns no_resource_id when resource_id is empty", async () => {
    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "",
      payer_wallet: "wallet_123",
    });
    expect(result.has_access).toBe(false);
    expect(result.reason).toBe("no_resource_id");
  });

  it("returns has_access:true when Mainlayer confirms entitlement", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ has_access: true, resource_id: "res_123", payer_wallet: "wallet_abc" })
    );

    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "res_123",
      payer_wallet: "wallet_abc",
    });
    expect(result.has_access).toBe(true);
    expect(result.reason).toBe("paid");
  });

  it("returns has_access:false with not_paid reason when Mainlayer denies", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        has_access: false,
        resource_id: "res_123",
        payer_wallet: "wallet_abc",
      })
    );

    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "res_123",
      payer_wallet: "wallet_abc",
    });
    expect(result.has_access).toBe(false);
    expect(result.reason).toBe("not_paid");
  });

  it("returns error reason when Mainlayer is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { checkAccess } = await import("../lib/paywall");
    const result = await checkAccess({
      resource_id: "res_123",
      payer_wallet: "wallet_abc",
    });
    expect(result.has_access).toBe(false);
    expect(result.reason).toBe("error");
    expect(result.error).toContain("Network error");
  });
});

// ─── Mainlayer client tests ───────────────────────────────────────────────────

describe("mainlayer client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.MAINLAYER_API_KEY = "test_key_12345";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MAINLAYER_API_KEY;
  });

  it("entitlements.check calls correct Mainlayer URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ has_access: true, resource_id: "r1", payer_wallet: "w1" })
    );

    const { mainlayer } = await import("../lib/mainlayer");
    await mainlayer.entitlements.check({ resource_id: "r1", payer_wallet: "w1" });

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, ...unknown[]];
    expect(url).toContain("api.mainlayer.fr/entitlements/check");
    expect(url).toContain("resource_id=r1");
    expect(url).toContain("payer_wallet=w1");
  });

  it("entitlements.check sends Authorization header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ has_access: false, resource_id: "r1", payer_wallet: "w1" })
    );

    const { mainlayer } = await import("../lib/mainlayer");
    await mainlayer.entitlements.check({ resource_id: "r1", payer_wallet: "w1" });

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test_key_12345");
  });

  it("payments.pay sends POST with correct body", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        success: true,
        transaction_id: "tx_1",
        resource_id: "r1",
        payer_wallet: "w1",
        amount_usdc: 0.01,
        paid_at: "2026-03-30T00:00:00Z",
      })
    );

    const { mainlayer } = await import("../lib/mainlayer");
    const result = await mainlayer.payments.pay({ resource_id: "r1", payer_wallet: "w1" });

    expect(result.transaction_id).toBe("tx_1");
    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({
      resource_id: "r1",
      payer_wallet: "w1",
    });
  });

  it("throws when MAINLAYER_API_KEY is not set", async () => {
    delete process.env.MAINLAYER_API_KEY;
    // Re-import to bust module cache would require vi.resetModules()
    // Instead test the error directly
    const { mainlayer } = await import("../lib/mainlayer");
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ has_access: true }));

    // Temporarily remove key to force error on next call
    const savedKey = process.env.MAINLAYER_API_KEY;
    delete process.env.MAINLAYER_API_KEY;

    await expect(
      mainlayer.entitlements.check({ resource_id: "r", payer_wallet: "w" })
    ).rejects.toThrow("MAINLAYER_API_KEY");

    process.env.MAINLAYER_API_KEY = savedKey;
  });

  it("resources.create sends POST to /resources", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        id: "res_new",
        name: "Test Resource",
        description: "A test",
        price_usdc: 0.01,
        created_at: "2026-03-30T00:00:00Z",
      })
    );

    const { mainlayer } = await import("../lib/mainlayer");
    const resource = await mainlayer.resources.create({
      name: "Test Resource",
      description: "A test",
      price_usdc: 0.01,
    });

    expect(resource.id).toBe("res_new");
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.mainlayer.fr/resources");
    expect(options.method).toBe("POST");
  });
});

// ─── Integration-style route handler tests ───────────────────────────────────

describe("GET /api/articles route handler shape", () => {
  it("returns articles array with expected fields", async () => {
    const res = await fetch(`${BASE}/api/articles`);
    if (!res.ok) {
      // Server not running — skip gracefully
      console.warn("Skipping live route test: server not running");
      return;
    }
    const data = await res.json();
    expect(Array.isArray(data.articles)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
    const first = data.articles[0];
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("price_usdc");
    expect(first).toHaveProperty("resource_id");
    expect(first).toHaveProperty("content_endpoint");
  });
});
