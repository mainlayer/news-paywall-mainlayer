export default function AgentGuide() {
  return (
    <div className="bg-gray-900 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <h3 className="text-white font-semibold text-sm">
          AI Agent Quick Start
        </h3>
      </div>

      <p className="text-gray-400 text-xs mb-4 leading-relaxed">
        Agents can pay autonomously and read articles without any human in the
        loop. No registration or subscription required.
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            1. List articles
          </p>
          <pre className="text-green-400 text-xs font-mono bg-gray-800 rounded p-2.5 overflow-x-auto">
            {`curl /api/articles`}
          </pre>
        </div>

        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            2. Pay for access
          </p>
          <pre className="text-green-400 text-xs font-mono bg-gray-800 rounded p-2.5 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST \\
  https://api.mainlayer.fr/pay \\
  -H "Authorization: Bearer KEY" \\
  -d '{"resource_id":"...","payer_wallet":"..."}'`}
          </pre>
        </div>

        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            3. Read the article
          </p>
          <pre className="text-green-400 text-xs font-mono bg-gray-800 rounded p-2.5 overflow-x-auto">
            {`curl /api/articles/:slug?wallet=W`}
          </pre>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-gray-500 text-xs">
          402 response includes{" "}
          <code className="text-green-400 font-mono">resource_id</code> and{" "}
          <code className="text-green-400 font-mono">pay_endpoint</code> for
          autonomous agent payment flows.
        </p>
      </div>
    </div>
  );
}
