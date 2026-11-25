import {buildLocalNotifications} from '../src/core/localInbox';
import type {LiveClass} from '../src/core/types';

const nowIso = '2026-11-19T08:00:00.000Z';

function liveClass(overrides: Partial<LiveClass> = {}): LiveClass {
  return {
    id: 'live-1',
    title: 'Computer Fundamentals',
    startsAt: '2026-11-19T10:00:00.000Z',
    endsAt: '2026-11-19T11:00:00.000Z',
    instructorName: 'Anita',
    status: 'scheduled',
    recordingAvailable: false,
    ...overrides,
  };
}

describe('local notification inbox', () => {
  it('keeps a welcome message and an upcoming class', () => {
    const {items} = buildLocalNotifications({
      nowIso,
      seenAt: {},
      readIds: [],
      liveClasses: [liveClass(), liveClass({id: 'ended', status: 'ended', title: 'Old class'})],
      classesEnabled: true,
      reminderEnabled: false,
      reminderHour: 19,
      reminderMinute: 0,
    });

    expect(items.map(item => item.id)).toEqual(['local-welcome', 'local-class-live-1']);
    expect(items[1]).toMatchObject({
      category: 'classes',
      read: false,
      actionLabel: 'View class',
      target: {kind: 'liveClass', id: 'live-1'},
    });
  });

  it('remembers which messages were already read', () => {
    const {items, seenAt} = buildLocalNotifications({
      nowIso,
      seenAt: {'local-welcome': '2026-11-18T08:00:00.000Z'},
      readIds: ['local-welcome'],
      liveClasses: [],
      classesEnabled: true,
      reminderEnabled: true,
      reminderHour: 19,
      reminderMinute: 30,
    });

    expect(items.find(item => item.id === 'local-welcome')).toMatchObject({
      read: true,
      createdAt: '2026-11-18T08:00:00.000Z',
    });
    expect(items.find(item => item.id === 'local-study-reminder')?.body).toContain('7:30 PM');
    expect(seenAt['local-welcome']).toBe('2026-11-18T08:00:00.000Z');
    expect(seenAt['local-study-reminder']).toBe(nowIso);
  });

  it('hides class rows when class alerts are off', () => {
    const {items} = buildLocalNotifications({
      nowIso,
      seenAt: {},
      readIds: [],
      liveClasses: [liveClass({status: 'live'})],
      classesEnabled: false,
      reminderEnabled: false,
      reminderHour: 19,
      reminderMinute: 0,
    });

    expect(items.map(item => item.category)).toEqual(['system']);
  });
});
