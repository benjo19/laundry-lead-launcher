# Jarvis Telegram identity linking — integration contract (staging only)

## Current state
- CRM authenticated endpoint: `jarvis-telegram-link-start`, JWT required. Returns short-lived challenge token to logged-in CRM owner.
- Identity table: `jarvis_telegram_identities`; challenge table: `jarvis_telegram_link_challenges`.
- Privileged RPC: `jarvis_complete_telegram_link(p_token, p_telegram_user_id, p_telegram_chat_id)` accessible to service_role, not authenticated or anon.
- Existing `jarvis-telegram-bridge` is *fail-closed* and currently always rejects identity completion. Do not change until origin authentication is in place.
- Make Command Chat scenario 9846129 must remain unchanged; write-capable modules 9, 13, 17 remain disabled.

## Security prerequisites for phase 2
1. Establish the trusted ingress for Telegram updates: a Telegram-owned webhook verified with its secret header, **or** a Make module with a Telegram-verified event plus an authenticated, anti-replay signed forwarding envelope.
2. Determine which system owns the single Telegram bot webhook. Never call `setWebhook` without a planned cutover; Telegram allows only one active webhook per bot.
3. Configure secrets server-side via Supabase Secrets and Make's encrypted connection/secret mechanism. Do not place service role keys or bridge secrets in Git, plain Make mappings, Telegram messages or this chat.
4. Verify `message.from.id` and `message.chat.id` from the authenticated ingress, require private chat and positive ID matching, parse only `/link <48 hex characters>`, reject other commands.
5. Ensure replay prevention (Telegram update_id and nonce), rate limits, audit without token, and no direct service-role RPC call from client. The challenge RPC is one-use and 10 minute validity.
6. Call privileged link-completion RPC from trusted backend only *after* authenticating Telegram origin. Never use untrusted user-supplied IDs for this RPC.
7. After a successful link, independently verify authorization for every approval request; never infer it merely from possession of Telegram chat ID.

## Safe staging test cases (no live messages)
- Missing signing secret -> reject
- Invalid Telegram origin signature -> reject
- Public/group chat -> reject
- Token malformed or expired -> reject
- Second use of same token -> reject
- Existing active link -> reject
- Different Telegram sender -> reject
- No write action is activated merely by linking identity

## Release criteria
Run isolated tests, review RLS and privileged SQL functions, verify the Telegram ingestion chain, then manually approve a staged cutover. Keep Gmail, CRM and GitHub action modules disabled until dedicated approval integration is proven.
