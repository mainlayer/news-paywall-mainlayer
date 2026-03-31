const MAINLAYER_BASE_URL = "https://api.mainlayer.fr";

function getApiKey(): string {
  const key = process.env.MAINLAYER_API_KEY;
  if (!key) {
    throw new Error("MAINLAYER_API_KEY environment variable is not set");
  }
  return key;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  price_usdc: number;
  created_at: string;
}

export interface EntitlementCheckResult {
  has_access: boolean;
  resource_id: string;
  payer_wallet: string;
  paid_at?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction_id: string;
  resource_id: string;
  payer_wallet: string;
  amount_usdc: number;
  paid_at: string;
}

export interface PublicResource {
  id: string;
  name: string;
  description: string;
  price_usdc: number;
}

export const mainlayer = {
  resources: {
    /**
     * Register a new resource (article) with Mainlayer.
     * Returns the created resource with its assigned ID.
     */
    async create(params: {
      name: string;
      description: string;
      price_usdc: number;
    }): Promise<Resource> {
      const response = await fetch(`${MAINLAYER_BASE_URL}/resources`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create resource: ${error}`);
      }

      return response.json() as Promise<Resource>;
    },

    /**
     * Get public information about a resource by ID.
     */
    async getPublic(resourceId: string): Promise<PublicResource> {
      const response = await fetch(
        `${MAINLAYER_BASE_URL}/resources/public/${resourceId}`,
        {
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get resource: ${error}`);
      }

      return response.json() as Promise<PublicResource>;
    },
  },

  entitlements: {
    /**
     * Check whether a wallet has paid for a resource.
     * Includes timeout to prevent hanging on network issues.
     */
    async check(params: {
      resource_id: string;
      payer_wallet: string;
    }): Promise<EntitlementCheckResult> {
      const url = new URL(`${MAINLAYER_BASE_URL}/entitlements/check`);
      url.searchParams.set("resource_id", params.resource_id);
      url.searchParams.set("payer_wallet", params.payer_wallet);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: authHeaders(),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Mainlayer API unreachable: ${message}`);
      }

      if (!response.ok) {
        const error = await response.text().catch(() => `(HTTP ${response.status})`);
        throw new Error(`Entitlement check failed: ${error}`);
      }

      const data = await response.json();
      // Validate the response structure
      if (typeof data.has_access !== 'boolean') {
        throw new Error('Invalid entitlement response: missing has_access field');
      }

      return data as EntitlementCheckResult;
    },
  },

  payments: {
    /**
     * Execute a payment for a resource.
     */
    async pay(params: {
      resource_id: string;
      payer_wallet: string;
    }): Promise<PaymentResult> {
      const response = await fetch(`${MAINLAYER_BASE_URL}/pay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment failed: ${error}`);
      }

      return response.json() as Promise<PaymentResult>;
    },
  },

  analytics: {
    /**
     * Get revenue analytics.
     */
    async get(): Promise<Record<string, unknown>> {
      const response = await fetch(`${MAINLAYER_BASE_URL}/analytics`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get analytics: ${error}`);
      }

      return response.json() as Promise<Record<string, unknown>>;
    },
  },
};
