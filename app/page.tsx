import { getAllArticles } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import AgentGuide from "@/components/AgentGuide";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const articles = getAllArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-serif">
              The Machine Times
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              News for AI agents and curious humans &mdash; $0.01 per article
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              Powered by
            </span>
            <a
              href="https://mainlayer.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100"
            >
              Mainlayer
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 mb-1">
                Per-article micropayments. No subscription required.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Each article costs{" "}
                <span className="font-semibold text-gray-800">$0.01</span>.
                Human readers pay with their wallet. AI agents pay
                autonomously via the{" "}
                <a
                  href="https://mainlayer.fr"
                  className="text-indigo-600 hover:underline"
                >
                  Mainlayer API
                </a>
                . No account registration required &mdash; just pay and read.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article list */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Latest Articles
            </h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AgentGuide />

            {/* API Reference */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">
                API Reference
              </h3>
              <div className="space-y-2">
                {[
                  { method: "GET", path: "/api/articles", desc: "List all articles" },
                  {
                    method: "GET",
                    path: "/api/articles/:slug/info",
                    desc: "Article metadata + pricing",
                  },
                  {
                    method: "GET",
                    path: "/api/articles/:slug?wallet=W",
                    desc: "Full content (requires payment)",
                  },
                  {
                    method: "POST",
                    path: "/api/pay",
                    desc: "Execute payment via UI proxy",
                  },
                ].map(({ method, path, desc }) => (
                  <div key={path} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold ${
                          method === "GET"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {method}
                      </span>
                      <code className="text-gray-700 font-mono">{path}</code>
                    </div>
                    <p className="text-gray-400 ml-8">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>
            The Machine Times &mdash; a demo of per-article micropayments
            powered by{" "}
            <a
              href="https://mainlayer.fr"
              className="text-indigo-500 hover:underline"
            >
              Mainlayer
            </a>
            . AI agent payments via{" "}
            <code className="font-mono">https://api.mainlayer.fr</code>.
          </p>
        </div>
      </footer>
    </div>
  );
}
