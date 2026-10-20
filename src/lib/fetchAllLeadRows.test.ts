import { describe, expect, test } from 'bun:test';
import { fetchAllLeadRows } from './fetchAllLeadRows';

describe('complete lead loading', () => {
  test('loads all 2299 records beyond the 1000-row response limit', async () => {
    const records = Array.from({ length: 2299 }, (_, id) => ({ id }));
    const result = await fetchAllLeadRows(async (from, to) => ({
      data: records.slice(from, to + 1), error: null,
    }));
    expect(result.error).toBeNull();
    expect(result.data).toEqual(records);
  });

  test('continues even when the server returns less than the requested page size', async () => {
    const records = Array.from({ length: 1001 }, (_, id) => ({ id }));
    const result = await fetchAllLeadRows(async (from) => ({
      data: records.slice(from, from + 100), error: null,
    }));
    expect(result.data).toEqual(records);
  });

  test('does not present a partial total when a later page fails', async () => {
    const result = await fetchAllLeadRows(async (from) => from === 0
      ? { data: [{ id: 1 }], error: null }
      : { data: null, error: { message: 'Request failed' } });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Request failed');
  });

  test('finishes for an empty collection', async () => {
    const result = await fetchAllLeadRows(async () => ({ data: [], error: null }));
    expect(result.data).toEqual([]);
  });
});