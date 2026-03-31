"use client";

import { useState } from "react";

interface ArticleInfo {
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  preview: string;
  price_usdc: number;
  resource_id: string;
  agent_instructions: {
    step_1: string;
    step_2: string;
    step_3: string;
    pay_endpoint: string;
    content_endpoint: string;
  };
}

interface ArticleContent {
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  content: string;
  price_usdc: number;
}

interface PaymentRequired {
  error: "payment_required";
  resource_id: string;
  price_usdc: number;
  pay_endpoint: string;
  message: string;
}

type PageStatus =
  | { type: "loading_info" }
  | { type: "ready"; info: ArticleInfo }
  | { type: "paying" }
  | { type: "loading_content"; wallet: string }
  | { type: "paid"; content: ArticleContent }
  | { type: "error"; message: string };

function renderContent(raw: string): React.ReactNode {
  // Very lightweight markdown-to-JSX: handle ## headings, **bold**, ```code blocks```
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      // Collect code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={i} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="text-xl font-bold mt-8 mb-3 text-gray-900">
          {line.slice(3)}
        </h2>
      );
    } else if (line.trim() === "") {
      nodes.push(<br key={i} />);
    } else {
      // Inline bold: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      nodes.push(
        <p key={i} className="mb-4 leading-relaxed text-gray-700">
          {rendered}
        </p>
      );
    }
    i++;
  }

  return nodes;
}

export default function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<PageStatus>({ type: "loading_info" });
  const [info, setInfo] = useState<ArticleInfo | null>(null);

  // Fetch article info on first render via effect
  if (status.type === "loading_info" && !info) {
    // Kick off fetch (effect-free pattern for RSC-compatible client component)
    fetch(`/api/articles/${slug}/info`)
      .then((r) => r.json())
      .then((data: ArticleInfo) => {
        setInfo(data);
        setStatus({ type: "ready", info: data });
      })
      .catch(() =>
        setStatus({ type: "error", message: "Failed to load article info." })
      );
  }

  async function handlePay() {
    if (!wallet.trim()) return;
    setStatus({ type: "paying" });

    try {
      const payRes = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, payer_wallet: wallet.trim() }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        setStatus({
          type: "error",
          message: err.message || "Payment failed.",
        });
        return;
      }

      // Payment succeeded — fetch full content
      setStatus({ type: "loading_content", wallet: wallet.trim() });
      const contentRes = await fetch(
        `/api/articles/${slug}?wallet=${encodeURIComponent(wallet.trim())}`
      );

      if (contentRes.status === 402) {
        const p = (await contentRes.json()) as PaymentRequired;
        setStatus({
          type: "error",
          message: `Payment recorded but access check failed: ${p.message}`,
        });
        return;
      }

      if (!contentRes.ok) {
        setStatus({ type: "error", message: "Failed to load article content." });
        return;
      }

      const content = (await contentRes.json()) as ArticleContent;
      setStatus({ type: "paid", content });
    } catch {
      setStatus({ type: "error", message: "An unexpected error occurred." });
    }
  }

  async function handleCheckAccess() {
    if (!wallet.trim()) return;
    setStatus({ type: "loading_content", wallet: wallet.trim() });

    const res = await fetch(
      `/api/articles/${slug}?wallet=${encodeURIComponent(wallet.trim())}`
    );

    if (res.status === 402) {
      setStatus({ type: "ready", info: info! });
      return;
    }

    if (!res.ok) {
      setStatus({ type: "error", message: "Failed to load article." });
      return;
    }

    const content = (await res.json()) as ArticleContent;
    setStatus({ type: "paid", content });
  }

  if (status.type === "loading_info") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading article...</div>
      </div>
    );
  }

  if (status.type === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-medium mb-4">{status.message}</p>
          <a href="/" className="text-indigo-600 text-sm hover:underline">
            Back to articles
          </a>
        </div>
      </div>
    );
  }

  if (status.type === "paid") {
    const { content } = status;
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <a href="/" className="text-sm text-indigo-600 hover:underline">
              &larr; Back to The Machine Times
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-6 flex items-center gap-2 text-sm text-green-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Access granted &mdash; $0.01 paid via Mainlayer
          </div>

          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {content.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2 leading-tight font-serif">
            {content.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-8">
            <span>{content.author}</span>
            <span>&middot;</span>
            <span>{content.date}</span>
            <span>&middot;</span>
            <span>{content.readTime}</span>
          </div>

          <div className="prose max-w-none">{renderContent(content.content)}</div>
        </main>
      </div>
    );
  }

  // Ready / paying / loading_content states — show paywall UI
  const articleInfo = info!;
  const isPaying =
    status.type === "paying" || status.type === "loading_content";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-sm text-indigo-600 hover:underline">
            &larr; Back to The Machine Times
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
          {articleInfo.category}
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2 leading-tight font-serif">
          {articleInfo.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
          <span>{articleInfo.author}</span>
          <span>&middot;</span>
          <span>{articleInfo.date}</span>
          <span>&middot;</span>
          <span>{articleInfo.readTime}</span>
        </div>

        {/* Preview */}
        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          {articleInfo.preview}
        </p>

        {/* Paywall card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Read this article</h2>
              <span className="text-indigo-100 text-2xl font-bold">$0.01</span>
            </div>
            <p className="text-indigo-200 text-sm mt-1">
              One-time micropayment via Mainlayer. No subscription required.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label
                htmlFor="wallet"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Mainlayer wallet ID
              </label>
              <input
                id="wallet"
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="wallet_abc123..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isPaying}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePay}
                disabled={!wallet.trim() || isPaying}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status.type === "paying"
                  ? "Processing payment..."
                  : status.type === "loading_content"
                  ? "Loading article..."
                  : "Pay $0.01 and Read"}
              </button>
              <button
                onClick={handleCheckAccess}
                disabled={!wallet.trim() || isPaying}
                className="border border-gray-300 text-gray-600 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Already paid? Check access without paying again."
              >
                Check access
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Already paid from this wallet? Click &ldquo;Check access&rdquo;
              to retrieve the article without paying again.
            </p>
          </div>
        </div>

        {/* Agent instructions */}
        <div className="mt-6 bg-gray-900 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            AI Agent Instructions
          </p>
          <pre className="text-green-400 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`# 1. Pay for access
curl -X POST https://api.mainlayer.xyz/pay \\
  -H "Authorization: Bearer YOUR_WALLET_CREDENTIAL" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resource_id": "${articleInfo.resource_id}",
    "payer_wallet": "YOUR_WALLET_ID"
  }'

# 2. Read the article
curl "${typeof window !== "undefined" ? window.location.origin : ""}/api/articles/${slug}?wallet=YOUR_WALLET_ID"`}
          </pre>
        </div>
      </main>
    </div>
  );
}
