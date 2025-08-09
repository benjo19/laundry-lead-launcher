-- Secure update_knowledge_updated_at with fixed search_path and security definer
CREATE OR REPLACE FUNCTION public.update_knowledge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the timestamp safely
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;