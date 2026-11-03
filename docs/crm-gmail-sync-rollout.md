# Automind CRM — Gmail sync rollout (DRAFT, NOT ACTIVE)

## Existing state verified 2026-11-03
- Make scenario 9839834 is active and polls Gmail every 900 seconds.
- Trigger Gmail search: `in:inbox subject:"Ideja za" -from:auto.mind.ai2025@gmail.com`; this is reply triage, NOT a complete inbox sync.
- Scenario looks up a lead in `automind_unique_reply_leads` and calls `mark_automind_reply`; it must not be modified as a side effect of adding message history.
- Existing `public.emails` contains 0 rows. It is not proof of Gmail history and has its own user-based RLS.
- Draft migration `20261103_crm_email_messages_draft.sql` has NOT been applied.
- Existing frontend email panel reads legacy `emails` and explicitly labels it as NOT synced.

## Implementation plan, subject to explicit approval
1. Security review: confirm which Supabase project the frontend uses, admin access rules, and that only authorized CRM admins can read cross-user message metadata. Review existing `private.is_super_admin` implementation and RLS in a real authenticated session.
2. Apply the draft table migration only after approval. Keep client write privileges revoked. Store message metadata, not full bodies or attachments.
3. Add a separate Make sync scenario or secure backend ingestion endpoint, initially INACTIVE. Do not edit or reactivate the existing outbound email scenario 9839830.
4. Ingest messages with Gmail message ID and thread ID. Use `(mailbox,provider_message_id)` as idempotency key; replays update existing metadata instead of inserting duplicates.
5. Normalize sender and recipients by trim/lowercase. For incoming messages, match sender; for outgoing, match recipients. Resolve a lead only when exactly ONE candidate exists. Ambiguous/unmatched records retain NULL lead ID. Never pick the first match.
6. Only record provider-confirmed statuses. Gmail message presence is not proof of delivery or reading. Record observed/sent/failed/unknown accordingly.
7. Track sync cursor/checkpoint, pagination, rate limits, API errors and retries. Never mark a batch processed before durable writes. Use least-privilege credentials, no service-role secret in browser.
8. After RLS and ingestion tests pass, update the CRM frontend to read `crm_email_messages` filtered by `matched_lead_id` and display direction, sender, subject, received_at, match_status, and provenance. Keep manual lead activities separate.
9. Test in staging with a controlled mailbox and unique, duplicate, and unknown lead addresses. Confirm no duplicate messages after replay; confirm unauthorized users see nothing; confirm incoming replies do not accidentally trigger outgoing campaigns.
10. Activate only with explicit approval and a rollback plan. Monitor failed sync batches and Make credits. Publish UI only after separate approval.

## Acceptance criteria
- 1 Gmail message processed twice -> exactly 1 stored record.
- 2 leads with the same email -> 0 automatically linked records.
- Unknown sender -> 0 automatically linked records.
- No RLS access -> no CRM email metadata returned.
- No email sent by sync.
- No false delivered/read claims.
- Failed ingestion is visible in logs, retried safely, and not marked successful.
- Existing reply scenario and outbound scenario behavior unchanged.
