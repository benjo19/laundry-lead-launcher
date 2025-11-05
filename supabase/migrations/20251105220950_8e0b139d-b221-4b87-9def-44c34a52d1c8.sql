-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job for Make.com webhook keepalive
-- Runs every day at 3:00 AM UTC
SELECT cron.schedule(
  'make-webhook-keepalive-daily',
  '0 3 * * *', -- Svaki dan u 3:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://uwtzhkdgprmrmknjrfeb.supabase.co/functions/v1/make-webhook-keepalive',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHpoa2RncHJtcm1rbmpyZmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MzcxNTksImV4cCI6MjA2NDMxMzE1OX0.uck1u0Q1sDZf2aQXB9yw3FE_n2cIjZEA292YavuIDb0"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);