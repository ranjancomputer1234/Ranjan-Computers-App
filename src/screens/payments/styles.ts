import {createThemedStyles} from '../../theme';

import {colors, space} from '../../theme';

export const styles = createThemedStyles({
  page: {paddingTop: 26, paddingHorizontal: space.pageX, gap: 14, paddingBottom: 28},

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
  ringGreen: {
    boxShadow:
      '0 20px 34px -12px rgba(46,125,50,0.5), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(46,125,50,0.22)',
  },
  ringRed: {
    boxShadow:
      '0 20px 34px -12px rgba(198,40,40,0.42), inset 5px 5px 12px rgba(255,255,255,0.9), inset -5px -5px 14px rgba(198,40,40,0.2)',
  },
  heroTitle: {letterSpacing: -0.2},
  heroSub: {textAlign: 'center', lineHeight: 16.5, paddingHorizontal: 8},

  receipt: {
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 15,
    gap: 10,
    boxShadow:
      '0 16px 28px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.12)',
  },
  receiptHead: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between'},
  receiptRows: {gap: 3},
  receiptRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12},
  receiptLabel: {flexShrink: 0, lineHeight: 18},
  receiptValue: {flex: 1, textAlign: 'right', lineHeight: 18},
  mrpStrike: {textDecorationLine: 'line-through', fontWeight: '500'},

  okStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: colors.pastel.green,
    boxShadow:
      '0 14px 22px -12px rgba(46,125,50,0.45), inset 4px 4px 10px rgba(255,255,255,0.75), inset -3px -3px 8px rgba(46,125,50,0.14)',
  },
  failStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: colors.pastel.red,
    boxShadow:
      '0 14px 22px -12px rgba(198,40,40,0.35), inset 4px 4px 10px rgba(255,255,255,0.75), inset -3px -3px 8px rgba(198,40,40,0.12)',
  },
  stripText: {flex: 1, lineHeight: 15},

  dual: {gap: 10},
  dualRow: {flexDirection: 'row', gap: 10},
  dualBtn: {flex: 1},
  btnOut: {
    minHeight: 48,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#64B5F6',
    boxShadow: '0 6px 10px -5px rgba(21,101,192,0.4), inset 2px 2px 4px rgba(255,255,255,0.9)',
  },
  btnSolid: {
    minHeight: 48,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      '0 7px 12px -5px rgba(21,101,192,0.6), inset 2px 2px 4px rgba(255,255,255,0.38), inset -2px -2px 4px rgba(13,71,161,0.4)',
  },
  pressed: {opacity: 0.85},

  tipBanner: {minHeight: 120, borderRadius: 22, overflow: 'hidden', flexDirection: 'row'},
  tipCopy: {flex: 1.4, padding: 15, alignItems: 'flex-start', justifyContent: 'center', gap: 7},
  tipPill: {paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999},
  tipArt: {flex: 0.7, alignItems: 'center', justifyContent: 'center'},

  tipsCard: {
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 15,
    gap: 10,
    boxShadow:
      '0 16px 28px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.12)',
  },
  tipRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  tipDot: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.orange,
    marginTop: 1,
  },
  tipRowText: {flex: 1, lineHeight: 16},

  checkoutPage: {paddingTop: 14, paddingHorizontal: space.pageX, gap: 14, paddingBottom: 26},
  summary: {
    borderRadius: 20,
    backgroundColor: colors.pastel.sky,
    padding: 14,
    gap: 11,
    boxShadow:
      '0 18px 30px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  shead: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between'},
  summaryRows: {gap: 10},
  ordrow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10},
  ordLabel: {flex: 1, color: '#424242'},
  divider: {height: 1.5, borderRadius: 99, backgroundColor: 'rgba(25,118,210,0.15)'},
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.pastel.green,
    boxShadow:
      '0 12px 20px -12px rgba(46,125,50,0.45), inset 3px 3px 8px rgba(255,255,255,0.75), inset -3px -3px 7px rgba(46,125,50,0.14)',
  },
  couponCopy: {flex: 1},
  couponComposer: {flexDirection: 'row', alignItems: 'flex-end', gap: 9},
  couponField: {flex: 1},
  payGroup: {gap: 10},
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: colors.white,
    boxShadow:
      '0 14px 24px -14px rgba(26,35,126,0.24), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.12)',
  },
  payRowOn: {
    boxShadow:
      '0 16px 26px -14px rgba(21,101,192,0.45), inset 5px 5px 12px rgba(255,255,255,0.8), inset -4px -4px 10px rgba(21,101,192,0.2), 0 0 0 2.5px #64B5F6',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 1px 1px 3px rgba(148,163,184,0.4)',
  },
  radioOn: {borderColor: colors.primary},
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  payIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCopy: {flex: 1, minWidth: 0, gap: 2},
  recBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    boxShadow:
      '0 4px 8px -2px rgba(46,125,50,0.5), inset 1.5px 1.5px 3px rgba(255,255,255,0.4), inset -1.5px -1.5px 3px rgba(27,94,32,0.28)',
  },
  addLabel: {flexShrink: 0},
  optionWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 44, paddingRight: 4},
  optionChip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: colors.white,
    boxShadow:
      '0 10px 18px -12px rgba(26,35,126,0.24), inset 4px 4px 9px rgba(255,255,255,0.85), inset -3px -3px 8px rgba(100,116,139,0.1)',
  },
  optionChipOn: {
    backgroundColor: colors.pastel.blue,
    boxShadow: '0 0 0 1.5px #64B5F6, inset 2px 2px 5px rgba(255,255,255,0.85)',
  },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    boxShadow:
      '0 18px 30px -16px rgba(26,35,126,0.28), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.13)',
  },
  trustCopy: {flex: 1, lineHeight: 15},
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.pastel.green,
  },
  payCta: {
    minHeight: 48,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    boxShadow:
      '0 7px 12px -5px rgba(230,81,0,0.6), inset 2px 2px 4px rgba(255,255,255,0.38), inset -2px -2px 4px rgba(194,65,12,0.4)',
  },
  cardHint: {
    marginLeft: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.pressed,
    boxShadow: 'inset 3px 3px 8px rgba(148,163,184,0.2), inset -2px -2px 6px rgba(255,255,255,0.9)',
  },
});
