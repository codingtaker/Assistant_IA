/**
 * Augment Express' Request with the authenticated API client attached by the
 * `apiKeyAuth` middleware. Available on any route mounted after that middleware.
 */
export interface AuthenticatedClient {
  id: string;
  name: string;
  quotaLimit: number;
  quotaUsed: number;
  quotaResetAt: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      client?: AuthenticatedClient;
    }
  }
}
