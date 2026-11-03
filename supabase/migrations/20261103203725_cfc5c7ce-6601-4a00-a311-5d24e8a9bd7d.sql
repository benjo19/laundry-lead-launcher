ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'follow_up',
  ADD COLUMN IF NOT EXISTS project text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Zagreb',
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'not_synced',
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS sync_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE TABLE IF NOT EXISTS public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;