import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import {
  appUserReconnectRequired,
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
  exchangeAppUserOAuthCode,
} from "../_shared/appUserConnector.ts";
import {
  adminClient,
  deleteConnectionForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "../_shared/appUserConnections.ts";
import {
  CRM_TIMEZONE,
  fromGoogleDateTime,
  googleEventIdForReminder,
  minutesBetween,
  toGoogleTimes,
} from "../_shared/calendarTime.ts";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_calendar";
const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
];
const CAL = "/calendar/v3/calendars/primary/events";
const CRM_SOURCE = "marketing-crm";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("start"), origin: z.string().url().max(300) }),
  z.object({ action: z.literal("complete"), code: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("disconnect") }),
  z.object({ action: z.literal("sync"), reminder_id: z.string().uuid(), op: z.enum(["upsert", "cancel"]) }),
  z.object({ action: z.literal("pull") }),
]);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const missingConfig = () => {
  const missing: string[] = [];
  if (!Deno.env.get("LOVABLE_API_KEY")) missing.push("LOVABLE_API_KEY");
  if (!Deno.env.get("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY")) missing.push("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY");
  if (!Deno.env.get("APP_USER_CONNECTION_KEY_SECRET")) missing.push("APP_USER_CONNECTION_KEY_SECRET");
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
};

class SyncError extends Error {
  constructor(message: string, public status = 502, public reconnect = false) { super(message); }
}

/** Google call with retry on network errors, 429 and 5xx (exponential backoff, max 3 tries). */
async function google(key: string, path: string, init?: RequestInit): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 400 * 3 ** (attempt - 1)));
    try {
      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: key,
        connectorId: CONNECTOR_ID,
        path,
        init: { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } },
        requiredScopes: GOOGLE_CALENDAR_SCOPES,
      });
      if (await appUserReconnectRequired(res)) throw new SyncError("Google veza je istekla — ponovno poveži Google Calendar.", 401, true);
      if (res.status !== 429 && res.status < 500) return res;
      last = res;
    } catch (e) {
      if (e instanceof SyncError) throw e;
      if (attempt === 2) throw new SyncError(`Google nije dostupan: ${(e as Error).message}`);
    }
  }
  return last!;
}

async function failText(res: Response) {
  const t = await res.text();
  console.error(`Google Calendar request failed [${res.status}]: ${t.slice(0, 500)}`);
  return `Google Calendar greška ${res.status}: ${t.slice(0, 300)}`;
}

const TYPE_LABEL: Record<string, string> = { meeting: "Sastanak", call: "Poziv", follow_up: "Follow-up" };

// deno-lint-ignore no-explicit-any
function eventBody(r: any) {
  const times = toGoogleTimes(r.date, r.time, r.duration_minutes || 60);
  const lines = [
    r.description || "",
    "",
    `Lead / tvrtka: ${r.company}`,
    `Vrsta: ${TYPE_LABEL[r.event_type] ?? r.event_type}`,
    r.project ? `Projekt: ${r.project}` : "",
    `Prioritet: ${r.priority}`,
    "Kreirano iz Marketing Manager CRM-a.",
  ].filter((l, i) => l || i === 1);
  return {
    summary: r.title,
    description: lines.join("\n").trim(),
    ...times,
    status: "confirmed",
    extendedProperties: { private: { crmReminderId: r.id, crmSource: CRM_SOURCE } },
  };
}

// deno-lint-ignore no-explicit-any
async function upsertEvent(key: string, r: any): Promise<string> {
  const body = eventBody(r);
  const q = "?sendUpdates=none";
  if (r.calendar_event_id) {
    const res = await google(key, `${CAL}/${encodeURIComponent(r.calendar_event_id)}${q}`, { method: "PATCH", body: JSON.stringify(body) });
    if (res.ok) return r.calendar_event_id;
    if (res.status !== 404 && res.status !== 410) throw new SyncError(await failText(res));
    await res.body?.cancel();
  }
  const id = googleEventIdForReminder(r.id);
  const ins = await google(key, `${CAL}${q}`, { method: "POST", body: JSON.stringify({ ...body, id }) });
  if (ins.ok) return id;
  if (ins.status === 409) {
    await ins.body?.cancel();
    // Event with this deterministic id already exists (earlier attempt or cancelled) — update it instead of duplicating.
    const put = await google(key, `${CAL}/${id}${q}`, { method: "PUT", body: JSON.stringify(body) });
    if (put.ok) return id;
    throw new SyncError(await failText(put));
  }
  throw new SyncError(await failText(ins));
}

async function cancelEvent(key: string, eventId: string) {
  const res = await google(key, `${CAL}/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: "DELETE" });
  if (res.ok || res.status === 404 || res.status === 410) { await res.body?.cancel(); return; }
  throw new SyncError(await failText(res));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Prijava je obavezna." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Prijava je obavezna." }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const input = parsed.data;

    const missing = missingConfig();
    if (input.action === "status") {
      if (missing.length) return json({ configured: false, connected: false, missing });
      const key = await getConnectionKeyForUser(user.id, CONNECTOR_ID);
      if (!key) return json({ configured: true, connected: false });
      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: CONNECTOR_ID,
        path: "/calendar/v3/calendars/primary", requiredScopes: GOOGLE_CALENDAR_SCOPES,
      });
      if (await appUserReconnectRequired(res)) return json({ configured: true, connected: false, reconnectRequired: true });
      if (!res.ok) return json({ configured: true, connected: true, error: await failText(res) });
      const cal = await res.json();
      return json({ configured: true, connected: true, calendar: { summary: cal.summary, timeZone: cal.timeZone } });
    }

    if (missing.length) {
      return json({ error: "Google Calendar integracija nije konfigurirana na poslužitelju.", missing, configured: false }, 503);
    }

    if (input.action === "start") {
      const returnUrl = new URL("/oauth/google-calendar/return", input.origin).toString();
      const existing = await getConnectionKeyForUser(user.id, CONNECTOR_ID);
      const { authorizationUrl } = await authorizeAppUserOAuth({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectorId: CONNECTOR_ID,
        appUserId: user.id,
        clientAPIKey: Deno.env.get("GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY")!,
        returnUrl,
        connectionAPIKey: existing ?? undefined,
        credentialsConfiguration: { scopes: GOOGLE_CALENDAR_SCOPES },
      });
      return json({ authorizationUrl });
    }

    if (input.action === "complete") {
      const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, input.code);
      if (connectorId !== CONNECTOR_ID) return json({ error: "Pogrešan konektor." }, 400);
      await saveConnectionKeyForUser(user.id, connectorId, connectionAPIKey);
      return json({ ok: true });
    }

    const key = await getConnectionKeyForUser(user.id, CONNECTOR_ID);

    if (input.action === "disconnect") {
      if (key) await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: CONNECTOR_ID });
      await deleteConnectionForUser(user.id, CONNECTOR_ID);
      return json({ ok: true });
    }

    if (!key) return json({ error: "Google Calendar nije povezan.", connected: false }, 409);
    const admin = adminClient();

    if (input.action === "sync") {
      const { data: r, error } = await admin.from("reminders").select("*").eq("id", input.reminder_id).eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!r) return json({ error: "Podsjetnik nije pronađen." }, 404);

      await admin.from("reminders").update({ sync_status: "pending", sync_attempts: (r.sync_attempts ?? 0) + 1 }).eq("id", r.id);
      try {
        if (input.op === "cancel") {
          if (r.calendar_event_id) await cancelEvent(key, r.calendar_event_id);
          await admin.from("reminders").update({ sync_status: "cancelled", sync_error: null, last_synced_at: new Date().toISOString() }).eq("id", r.id);
          return json({ ok: true, sync_status: "cancelled" });
        }
        const eventId = await upsertEvent(key, r);
        await admin.from("reminders").update({
          calendar_event_id: eventId, sync_status: "synced", sync_error: null, last_synced_at: new Date().toISOString(),
        }).eq("id", r.id);
        return json({ ok: true, sync_status: "synced", calendar_event_id: eventId });
      } catch (e) {
        const msg = (e as Error).message;
        await admin.from("reminders").update({ sync_status: "error", sync_error: msg.slice(0, 500) }).eq("id", r.id);
        const se = e instanceof SyncError ? e : new SyncError(msg);
        return json({ error: msg, sync_status: "error", reconnectRequired: se.reconnect }, se.status);
      }
    }

    // pull: bring Google-side edits/cancellations of CRM-created events back into the CRM.
    const updatedMin = new Date(Date.now() - 60 * 86400000).toISOString();
    // deno-lint-ignore no-explicit-any
    const events: any[] = [];
    let pageToken = "";
    for (let page = 0; page < 10; page++) {
      const params = new URLSearchParams({
        privateExtendedProperty: `crmSource=${CRM_SOURCE}`, showDeleted: "true", singleEvents: "true",
        timeZone: CRM_TIMEZONE, updatedMin, maxResults: "250",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await google(key, `${CAL}?${params}`);
      if (!res.ok) return json({ error: await failText(res) }, 502);
      const body = await res.json();
      events.push(...(body.items ?? []));
      if (!body.nextPageToken) break;
      pageToken = body.nextPageToken;
    }
    const ids = events.map((e) => e.extendedProperties?.private?.crmReminderId).filter(Boolean);
    if (!ids.length) return json({ ok: true, checked: 0, updated: 0, cancelled: 0 });
    const { data: rows, error } = await admin.from("reminders").select("*").eq("user_id", user.id).in("id", ids);
    if (error) throw error;
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));
    let updated = 0, cancelled = 0;
    for (const ev of events) {
      const r = byId.get(ev.extendedProperties?.private?.crmReminderId);
      if (!r) continue;
      if (r.last_synced_at && Date.parse(ev.updated) <= Date.parse(r.last_synced_at)) continue;
      const now = new Date().toISOString();
      if (ev.status === "cancelled") {
        if (r.status !== "Otkazan") {
          await admin.from("reminders").update({ status: "Otkazan", sync_status: "cancelled", last_synced_at: now, updated_at: now }).eq("id", r.id);
          cancelled++;
        }
        continue;
      }
      if (!ev.start?.dateTime || !ev.end?.dateTime) continue;
      const { date, time } = fromGoogleDateTime(ev.start.dateTime);
      const duration = minutesBetween(ev.start.dateTime, ev.end.dateTime);
      const patch: Record<string, unknown> = { last_synced_at: now, sync_status: "synced", sync_error: null };
      if (date !== r.date || time !== String(r.time).slice(0, 5) || duration !== r.duration_minutes || (ev.summary && ev.summary !== r.title)) {
        Object.assign(patch, { date, time, duration_minutes: duration, title: ev.summary || r.title, updated_at: now });
        updated++;
      }
      await admin.from("reminders").update(patch).eq("id", r.id);
    }
    return json({ ok: true, checked: events.length, updated, cancelled });
  } catch (e) {
    console.error("google-calendar error:", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
