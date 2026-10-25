import {createThemedStyles} from '../../theme';

import {colors, space} from '../../theme';

export const styles = createThemedStyles({
  page: {paddingTop: 22, paddingHorizontal: space.pageX, gap: 14, paddingBottom: 26},

  hero: {alignItems: 'center', gap: 12},
  ring: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringAmber: {
    boxShadow:
      '0 20px 34px -12px rgba(230,81,0,0.42), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(230,126,0,0.2)',
  },
  ringGreen: {
    boxShadow:
      '0 20px 34px -12px rgba(46,125,50,0.5), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(46,125,50,0.22)',
  },
  ringRed: {
    boxShadow:
      '0 20px 34px -12px rgba(198,40,40,0.42), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(198,40,40,0.2)',
  },
  ringBlue: {
    boxShadow:
      '0 20px 34px -12px rgba(21,101,192,0.42), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(13,71,161,0.2)',
  },
  heroTitle: {letterSpacing: -0.2},
  heroSub: {textAlign: 'center', lineHeight: 16.5},

  checklist: {
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    boxShadow:
      '0 18px 30px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  checklistHead: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11},
  checklistTitle: {letterSpacing: -0.2},
  stepLabel: {letterSpacing: 0.6},
  checklistRows: {gap: 9},
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.scroll,
    boxShadow: 'inset 3px 3px 8px rgba(148,163,184,0.2), inset -2px -2px 6px rgba(255,255,255,0.9)',
  },
  wico: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wicoOk: {
    backgroundColor: colors.pastel.green,
    boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(46,125,50,0.14)',
  },
  wicoPend: {
    backgroundColor: colors.pastel.orange,
    boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(230,81,0,0.14)',
  },
  wicoTodo: {
    backgroundColor: colors.pastel.blue,
    boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(21,101,192,0.12)',
  },
  wicoFail: {
    backgroundColor: colors.pastel.red,
    boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(198,40,40,0.14)',
  },
  waitBody: {flex: 1, minWidth: 0, gap: 2},
  waitValue: {flexShrink: 0},
  footnote: {marginTop: 11, lineHeight: 14},

  semCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    boxShadow:
      '0 16px 26px -14px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  semNum: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  semNumLock: {
    backgroundColor: '#F1F4F9',
    boxShadow: 'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(100,116,139,0.16)',
  },
  semNumReady: {
    backgroundColor: colors.pastel.green,
    boxShadow:
      'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(46,125,50,0.18), 4px 5px 10px -6px rgba(46,125,50,0.35)',
  },
  semBody: {flex: 1, minWidth: 0, gap: 5},
  semTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  semTitle: {flex: 1, minWidth: 0, letterSpacing: -0.1},
  unlockRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  unlockRowText: {flex: 1, lineHeight: 11},

  chip: {paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, flexShrink: 0},
  chipPend: {backgroundColor: colors.pastel.orange},
  chipOk: {backgroundColor: colors.pastel.green},
  chipFail: {backgroundColor: colors.pastel.red},
  chipLock: {backgroundColor: '#F1F4F9'},
  chipText: {letterSpacing: 1},

  waitStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: colors.pastel.orange,
    boxShadow:
      '0 14px 22px -12px rgba(230,81,0,0.4), inset 4px 4px 10px rgba(255,255,255,0.75), inset -3px -3px 8px rgba(230,81,0,0.14)',
  },
  waitStripGreen: {
    backgroundColor: colors.pastel.green,
    boxShadow:
      '0 14px 22px -12px rgba(46,125,50,0.4), inset 4px 4px 10px rgba(255,255,255,0.75), inset -3px -3px 8px rgba(46,125,50,0.14)',
  },
  waitStripRed: {
    backgroundColor: colors.pastel.red,
    boxShadow:
      '0 14px 22px -12px rgba(198,40,40,0.35), inset 4px 4px 10px rgba(255,255,255,0.75), inset -3px -3px 8px rgba(198,40,40,0.12)',
  },
  waitStripText: {flex: 1, lineHeight: 15},

  banner: {minHeight: 128, borderRadius: 22, overflow: 'hidden', flexDirection: 'row'},
  bannerCopy: {flex: 1.4, padding: 15, alignItems: 'flex-start', justifyContent: 'center', gap: 7},
  bannerPill: {paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999},
  bannerArt: {flex: 0.7, alignItems: 'center', justifyContent: 'center'},
  pressed: {opacity: 0.88},

  /* ===== My Course · Semester outline (design board frame 24) ===== */
  pageOutline: {paddingTop: 14, paddingHorizontal: space.pageX, gap: 14, paddingBottom: 26},

  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    boxShadow:
      '0 18px 30px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  bigTile: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow:
      'inset 4px 4px 9px rgba(255,255,255,0.95), inset -4px -4px 9px rgba(100,116,139,0.2), 7px 9px 16px -7px rgba(26,35,126,0.35)',
  },
  identityBody: {flex: 1, minWidth: 0, gap: 7},
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  badge: {alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999},
  badgeText: {letterSpacing: 0.8},
  metaRow: {flexDirection: 'row', gap: 12},
  hmeta: {flexDirection: 'row', alignItems: 'center', gap: 6},

  progressCard: {
    borderRadius: 20,
    backgroundColor: colors.pastel.blue,
    padding: 14,
    boxShadow:
      '0 16px 26px -16px rgba(21,101,192,0.34), inset 5px 5px 12px rgba(255,255,255,0.72), inset -4px -4px 10px rgba(13,71,161,0.13)',
  },
  progressHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9},
  pwrap: {flexDirection: 'row', alignItems: 'center', gap: 8},
  progressCaption: {marginTop: 9, lineHeight: 12.6},

  shead: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2},
  sheadTitle: {letterSpacing: -0.2},

  semList: {gap: 11},
  semNumNow: {
    backgroundColor: colors.pastel.blue,
    boxShadow:
      'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(21,101,192,0.2), 4px 5px 10px -6px rgba(21,101,192,0.4)',
  },
  semNumPend: {
    backgroundColor: colors.pastel.orange,
    boxShadow: 'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(230,81,0,0.16)',
  },
  semNumFail: {
    backgroundColor: colors.pastel.red,
    boxShadow: 'inset 3px 3px 7px rgba(255,255,255,0.85), inset -3px -3px 7px rgba(198,40,40,0.16)',
  },
  semNumLabel: {letterSpacing: 1.2, marginTop: 2},
  chipNow: {backgroundColor: colors.pastel.blue},

  shieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    boxShadow:
      '0 18px 30px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  shieldText: {flex: 1, lineHeight: 15},

  purchasedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.pastel.green,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
