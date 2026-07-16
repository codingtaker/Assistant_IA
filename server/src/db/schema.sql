-- StartupPitch AI — authentication & quota schema
-- Run with:  npm run db:migrate  (server/)
--
-- One row per API client (a user, an integration, a partner…). Each client
-- authenticates with a bearer key; only the SHA-256 hash of the key is stored,
-- never the key itself. Quota is a rolling counter reset every 30 days.

CREATE TABLE IF NOT EXISTS api_clients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  -- SHA-256 hex digest of the plaintext key. The key is shown once at creation.
  key_hash       text        NOT NULL UNIQUE,
  -- First 12 chars of the plaintext key (e.g. "sp_live_a1b2") for identification
  -- in dashboards/logs without exposing the secret.
  key_prefix     text        NOT NULL,
  -- Max generations allowed per rolling window.
  quota_limit    integer     NOT NULL DEFAULT 100,
  -- Generations consumed in the current window.
  quota_used     integer     NOT NULL DEFAULT 0,
  -- When the current window ends; on the next request past this, quota resets.
  quota_reset_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  active         boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_used_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_clients_key_hash ON api_clients (key_hash);
