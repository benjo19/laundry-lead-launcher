
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city text;
CREATE INDEX IF NOT EXISTS leads_city_idx ON public.leads (city);
CREATE INDEX IF NOT EXISTS leads_country_idx ON public.leads (country);

-- Conservative backfill: only when location has 2+ comma-separated parts
-- country = last trimmed segment (must contain only letters/spaces, no digits)
-- city = second-to-last trimmed segment with any leading postal code stripped
UPDATE public.leads
SET country = COALESCE(country, NULLIF(TRIM(BOTH FROM split_part(location, ',', array_length(string_to_array(location, ','), 1))), ''))
WHERE location IS NOT NULL
  AND country IS NULL
  AND array_length(string_to_array(location, ','), 1) >= 2
  AND TRIM(BOTH FROM split_part(location, ',', array_length(string_to_array(location, ','), 1))) ~ '^[^0-9]+$';

UPDATE public.leads
SET city = NULLIF(TRIM(BOTH FROM regexp_replace(
    split_part(location, ',', GREATEST(array_length(string_to_array(location, ','), 1) - 1, 1)),
    '^\s*\d{3,6}\s*', ''
  )), '')
WHERE location IS NOT NULL
  AND city IS NULL
  AND array_length(string_to_array(location, ','), 1) >= 2;
