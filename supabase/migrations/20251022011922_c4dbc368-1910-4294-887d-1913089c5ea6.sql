-- Add custom AI system prompt to business profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS ai_system_prompt text;

COMMENT ON COLUMN business_profiles.ai_system_prompt IS 'Custom system prompt for AI behavior specific to this business profile';