import {canRemindLiveClass, visibleLiveClasses} from '../src/features/live/visibleClasses';
import type {LiveClass} from '../src/core/types';

const now = Date.parse('2026-11-22T00:00:00.000Z');

function liveClass(id: string, startsAt: string, status: LiveClass['status'] = 'scheduled'): LiveClass {
  return {
    id,
    title: id,
    startsAt,
    endsAt: startsAt,
    instructorName: 'Faculty',
    status,
    recordingAvailable: false,
  };
}

describe('live class reminder', () => {
  it('shows the bell for a scheduled or starting class and hides it when the server says no', () => {
    expect(canRemindLiveClass(liveClass('soon', '2026-11-23T04:00:00.000Z'))).toBe(true);
    expect(canRemindLiveClass({...liveClass('soon', '2026-11-23T04:00:00.000Z', 'starting'), canSetReminder: true})).toBe(true);
    expect(canRemindLiveClass({...liveClass('live', '2026-11-23T04:00:00.000Z', 'live'), canSetReminder: false})).toBe(false);
  });
});

describe('visible live classes', () => {
  it('keeps the requested window when it has classes', () => {
    const upcoming = [liveClass('soon', '2026-11-23T04:00:00.000Z')];
    const older = [liveClass('old', '2026-10-01T04:00:00.000Z')];
    expect(visibleLiveClasses(upcoming, older, now).map(item => item.id)).toEqual(['soon']);
  });

  it('shows the nearest recent class first when the window is empty', () => {
    const catalog = [
      liveClass('october', '2026-10-21T06:49:10.430Z'),
      liveClass('november', '2026-11-19T19:33:00.000Z'),
      liveClass('cancelled', '2026-11-20T10:00:00.000Z', 'cancelled'),
    ];
    expect(visibleLiveClasses([], catalog, now).map(item => item.id)).toEqual(['november', 'october']);
  });
});
