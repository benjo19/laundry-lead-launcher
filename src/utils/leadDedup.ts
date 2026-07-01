import type { AnalyzedLead } from '@/services/aiLeadAnalysisService';

const stripWww = (host: string) => host.replace(/^www\./i, '');
const twoPartTLDs = new Set([
  'co.uk', 'com.au', 'com.br', 'com.hr', 'com.tr', 'com.cn',
  'com.mx', 'com.ar', 'com.pl', 'com.sg', 'com.my',
]);

const getDomainRoot = (host: string): string => {
  const h = stripWww(host.toLowerCase());
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  return twoPartTLDs.has(last2) ? last3 : last2;
};

const domainKey = (website?: string): string | null => {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith('http') ? website : `https://${website}`);
    return getDomainRoot(u.hostname);
  } catch {
    return null;
  }
};

const phoneKey = (phone?: string): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, '');
  return digits.length >= 7 ? digits.slice(-9) : null;
};

const nameKey = (name?: string): string => {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(d\.?o\.?o\.?|j\.?d\.?o\.?o\.?|obrt|ltd|llc|inc|gmbh|s\.?r\.?o\.?)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

/**
 * Merges arrays of leads, removing duplicates by (in order):
 * 1. Domain root (e.g. example.com)
 * 2. Phone number (last 9 digits)
 * 3. Normalized company name + first token of address
 * When a duplicate is found, fields from the newer record fill in gaps.
 */
export function dedupeLeads<T extends AnalyzedLead>(...groups: T[][]): T[] {
  const byKey = new Map<string, T>();

  const upsert = (lead: T) => {
    const keys: string[] = [];
    const dk = domainKey(lead.website);
    if (dk) keys.push(`d:${dk}`);
    const pk = phoneKey(lead.phone);
    if (pk) keys.push(`p:${pk}`);
    const nk = nameKey(lead.name);
    if (nk) {
      const addrToken = (lead.address || '').toLowerCase().split(/[,\s]+/)[0] || '';
      keys.push(`n:${nk}|${addrToken}`);
    }

    // Find any existing entry sharing a key
    for (const k of keys) {
      const existing = byKey.get(k);
      if (existing) {
        // Merge: prefer existing values, fill gaps from new lead
        const merged: T = {
          ...lead,
          ...existing,
          email: existing.email || lead.email,
          phone: existing.phone || lead.phone,
          website: existing.website || lead.website,
          socialProfiles: { ...(lead as any).socialProfiles, ...(existing as any).socialProfiles },
        };
        keys.forEach((kk) => byKey.set(kk, merged));
        return;
      }
    }
    // No collision — register under every key
    keys.forEach((k) => byKey.set(k, lead));
  };

  for (const group of groups) {
    for (const lead of group) upsert(lead);
  }

  // Deduplicate final set (multiple keys point to same object)
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of byKey.values()) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
