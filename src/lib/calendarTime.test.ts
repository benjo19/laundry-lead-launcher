import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { toGoogleTimes, fromGoogleDateTime, googleEventIdForReminder, addMinutesLocal } from './calendarTime';
import * as server from '../../supabase/functions/_shared/calendarTime';

describe('Europe/Zagreb calendar sync', () => {
  test('events are sent in Europe/Zagreb without shifting the wall clock', () => {
    const t = toGoogleTimes('2026-11-04', '09:30', 60);
    assert.deepEqual(t.start, { dateTime: '2026-11-04T09:30:00', timeZone: 'Europe/Zagreb' });
    assert.deepEqual(t.end, { dateTime: '2026-11-04T10:30:00', timeZone: 'Europe/Zagreb' });
  });

  test('a meeting that crosses midnight ends on the next day', () => {
    assert.deepEqual(addMinutesLocal('2026-12-31', '23:30', 45), { date: '2027-01-01', time: '00:15' });
  });

  test('times pulled from Google keep the Zagreb wall clock', () => {
    assert.deepEqual(fromGoogleDateTime('2026-03-29T10:15:00+02:00'), { date: '2026-03-29', time: '10:15' });
  });

  test('one CRM entry always maps to the same Google event id (no duplicates on retry)', () => {
    const id = 'A1B2C3D4-0000-4000-8000-00000000000f';
    assert.equal(googleEventIdForReminder(id), googleEventIdForReminder(id));
    assert.match(googleEventIdForReminder(id), /^[a-v0-9]{5,1024}$/);
  });

  test('browser and server helpers agree', () => {
    assert.deepEqual(server.toGoogleTimes('2026-11-04', '23:50', 30), toGoogleTimes('2026-11-04', '23:50', 30));
    assert.equal(server.googleEventIdForReminder('ab-cd-ef01'), googleEventIdForReminder('ab-cd-ef01'));
  });
});
