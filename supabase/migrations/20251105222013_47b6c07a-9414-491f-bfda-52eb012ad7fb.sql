-- Create secure OAuth tokens table
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- No policies for regular users - only service role can access
-- This prevents client-side access to tokens

-- Create index for faster lookups
CREATE INDEX idx_oauth_tokens_user_provider ON public.oauth_tokens(user_id, provider);

-- Migrate existing OAuth tokens from user_settings to oauth_tokens
INSERT INTO public.oauth_tokens (user_id, provider, access_token, refresh_token, token_email, created_at)
SELECT 
  user_id,
  'google' as provider,
  (email_settings->'oauth_providers'->'google'->>'access_token') as access_token,
  (email_settings->'oauth_providers'->'google'->>'refresh_token') as refresh_token,
  (email_settings->'oauth_providers'->'google'->>'email') as token_email,
  COALESCE(
    (email_settings->'oauth_providers'->'google'->>'connected_at')::timestamptz,
    now()
  ) as created_at
FROM public.user_settings
WHERE email_settings->'oauth_providers'->'google' IS NOT NULL
  AND email_settings->'oauth_providers'->'google'->>'access_token' IS NOT NULL
ON CONFLICT (user_id, provider) DO NOTHING;

INSERT INTO public.oauth_tokens (user_id, provider, access_token, refresh_token, token_email, created_at)
SELECT 
  user_id,
  'outlook' as provider,
  (email_settings->'oauth_providers'->'outlook'->>'access_token') as access_token,
  (email_settings->'oauth_providers'->'outlook'->>'refresh_token') as refresh_token,
  (email_settings->'oauth_providers'->'outlook'->>'email') as token_email,
  COALESCE(
    (email_settings->'oauth_providers'->'outlook'->>'connected_at')::timestamptz,
    now()
  ) as created_at
FROM public.user_settings
WHERE email_settings->'oauth_providers'->'outlook' IS NOT NULL
  AND email_settings->'oauth_providers'->'outlook'->>'access_token' IS NOT NULL
ON CONFLICT (user_id, provider) DO NOTHING;

-- Remove OAuth tokens from user_settings (keep the structure but remove sensitive data)
UPDATE public.user_settings
SET email_settings = jsonb_set(
  COALESCE(email_settings, '{}'::jsonb),
  '{oauth_providers}',
  jsonb_build_object(
    'google', 
    CASE 
      WHEN email_settings->'oauth_providers'->'google' IS NOT NULL 
      THEN jsonb_build_object(
        'email', email_settings->'oauth_providers'->'google'->>'email',
        'connected_at', email_settings->'oauth_providers'->'google'->>'connected_at',
        'connected', true
      )
      ELSE NULL
    END,
    'outlook',
    CASE 
      WHEN email_settings->'oauth_providers'->'outlook' IS NOT NULL 
      THEN jsonb_build_object(
        'email', email_settings->'oauth_providers'->'outlook'->>'email',
        'connected_at', email_settings->'oauth_providers'->'outlook'->>'connected_at',
        'connected', true
      )
      ELSE NULL
    END
  )
)
WHERE email_settings->'oauth_providers' IS NOT NULL;