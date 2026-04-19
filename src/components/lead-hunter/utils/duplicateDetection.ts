import { Lead } from '@/types';

export interface DuplicateGroup {
  id: string;
  matchType: 'email' | 'company' | 'both';
  leads: Lead[];
}

export const normalizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

export const normalizeCompany = (name: string | null | undefined): string => {
  if (!name) return '';
  let n = name.trim().toLowerCase();
  // Remove common Croatian/EU legal suffixes
  n = n.replace(/[.,]/g, ' ');
  n = n.replace(/\b(j\s*d\s*o\s*o|d\s*o\s*o|d\s*d|obrt|ltd|llc|inc|gmbh|sarl|sa|bv|ag)\b/gi, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  return n;
};

// Union-Find (disjoint set) for grouping
class UnionFind {
  private parent: Map<number, number> = new Map();

  find(x: number): number {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export const findDuplicateGroups = (
  leads: Lead[],
  mode: 'email' | 'company' | 'both'
): DuplicateGroup[] => {
  if (leads.length < 2) return [];

  const uf = new UnionFind();
  const emailMap = new Map<string, number>(); // normalizedEmail -> first leadId
  const companyMap = new Map<string, number>();
  const matchedByEmail = new Set<number>();
  const matchedByCompany = new Set<number>();

  for (const lead of leads) {
    uf.find(lead.id); // ensure node exists

    if (mode === 'email' || mode === 'both') {
      const e = normalizeEmail(lead.email);
      if (e) {
        if (emailMap.has(e)) {
          uf.union(emailMap.get(e)!, lead.id);
          matchedByEmail.add(lead.id);
          matchedByEmail.add(emailMap.get(e)!);
        } else {
          emailMap.set(e, lead.id);
        }
      }
    }

    if (mode === 'company' || mode === 'both') {
      const c = normalizeCompany(lead.company);
      if (c) {
        if (companyMap.has(c)) {
          uf.union(companyMap.get(c)!, lead.id);
          matchedByCompany.add(lead.id);
          matchedByCompany.add(companyMap.get(c)!);
        } else {
          companyMap.set(c, lead.id);
        }
      }
    }
  }

  // Group leads by their root
  const groupsMap = new Map<number, Lead[]>();
  for (const lead of leads) {
    if (!matchedByEmail.has(lead.id) && !matchedByCompany.has(lead.id)) continue;
    const root = uf.find(lead.id);
    if (!groupsMap.has(root)) groupsMap.set(root, []);
    groupsMap.get(root)!.push(lead);
  }

  const groups: DuplicateGroup[] = [];
  for (const [root, groupLeads] of groupsMap.entries()) {
    if (groupLeads.length < 2) continue;
    const hasEmailMatch = groupLeads.some((l) => matchedByEmail.has(l.id));
    const hasCompanyMatch = groupLeads.some((l) => matchedByCompany.has(l.id));
    let matchType: 'email' | 'company' | 'both' = 'company';
    if (hasEmailMatch && hasCompanyMatch) matchType = 'both';
    else if (hasEmailMatch) matchType = 'email';
    groups.push({
      id: `group-${root}`,
      matchType,
      leads: groupLeads.sort((a, b) => (a.dateAdded || '').localeCompare(b.dateAdded || '')),
    });
  }

  return groups.sort((a, b) => b.leads.length - a.leads.length);
};

const countFilledFields = (lead: Lead): number => {
  const fields = [
    lead.email,
    lead.phone,
    lead.website,
    lead.location,
    lead.industry,
    lead.employees,
    lead.notes,
  ];
  return fields.filter((f) => f && String(f).trim().length > 0).length;
};

export const pickBestMaster = (leads: Lead[]): Lead => {
  return [...leads].sort((a, b) => {
    const fa = countFilledFields(a);
    const fb = countFilledFields(b);
    if (fb !== fa) return fb - fa;
    // Tie-breaker: oldest first
    return (a.dateAdded || '').localeCompare(b.dateAdded || '');
  })[0];
};

export const mergeLeadData = (master: Lead, duplicates: Lead[]): Partial<Lead> => {
  const merged: Partial<Lead> = {};
  const fields: (keyof Lead)[] = [
    'email',
    'phone',
    'website',
    'location',
    'industry',
    'employees',
  ];

  for (const field of fields) {
    const masterVal = master[field];
    if (!masterVal || String(masterVal).trim() === '') {
      // Find first duplicate with a value
      for (const dup of duplicates) {
        const dv = dup[field];
        if (dv && String(dv).trim() !== '') {
          (merged as any)[field] = dv;
          break;
        }
      }
    }
  }

  // Concat notes
  const allNotes = [master.notes, ...duplicates.map((d) => d.notes)]
    .filter((n) => n && String(n).trim() !== '')
    .join('\n---\n');
  if (allNotes && allNotes !== (master.notes || '')) {
    merged.notes = allNotes;
  }

  return merged;
};
