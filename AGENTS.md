# Project rules

- Load complete lead collections through `fetchAllLeadRows` with fresh queries, existing access filters, and stable unique ordering; single Supabase responses truncate larger collections and produce incorrect counts and duplicate checks.