# Project rules

- Load complete lead collections through `fetchAllLeadRows` with fresh queries, existing access filters, and stable unique ordering; single Supabase responses truncate larger collections and produce incorrect counts and duplicate checks.- Google Calendar sync runs only in the `google-calendar` edge function via the per-user App User Connector (encrypted keys in server-only `app_user_connections`); a CRM reminder is saved first, then synced, with a deterministic Google event id so retries never duplicate.
- Calendar wall-clock helpers live in `src/lib/calendarTime.ts` and are mirrored in `supabase/functions/_shared/calendarTime.ts`; a test asserts both agree.
