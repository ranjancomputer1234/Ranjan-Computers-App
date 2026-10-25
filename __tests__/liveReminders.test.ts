import type {LiveClass} from '../src/core/types';
import {
  isUpcomingLiveClass,
  liveClassReminderTimestamp,
} from '../src/features/settings/reminders';

const scheduledClass = (startsAt: string): LiveClass => ({
  id: 'live-test',
  title: 'Test class',
  startsAt,
  endsAt: new Date(Date.parse(startsAt) + 60 * 60_000).toISOString(),
  instructorName: 'Teacher',
  status: 'scheduled',
  recordingAvailable: false,
});

describe('live class reminder timing', () => {
  const now = Date.parse('2026-09-24T10:00:00.000Z');

  it('schedules 15 minutes before a future class', () => {
    const startsAt = '2026-09-24T12:00:00.000Z';
    expect(liveClassReminderTimestamp(startsAt, now)).toBe(Date.parse(startsAt) - 15 * 60_000);
  });

  it('schedules promptly when enabled inside the 15-minute window', () => {
    expect(liveClassReminderTimestamp('2026-09-24T10:05:00.000Z', now)).toBe(now + 1_000);
  });

  it('rejects ended, invalid, and non-scheduled classes', () => {
    expect(liveClassReminderTimestamp('2026-09-24T09:59:00.000Z', now)).toBeNull();
    expect(liveClassReminderTimestamp('invalid', now)).toBeNull();
    expect(isUpcomingLiveClass({...scheduledClass('2026-09-24T12:00:00.000Z'), status: 'ended'}, now)).toBe(false);
  });

});
