import {createThemedStyles} from '../../theme';

import {radius, space} from '../../theme';

export const styles = createThemedStyles({
  page: {
    paddingTop: 14,
    paddingHorizontal: space.pageX,
    paddingBottom: space.pageBottom,
    gap: 14,
  },
  searchWrap: {marginBottom: 2},
  group: {gap: 10},
  groupHead: {
    marginTop: 6,
    marginHorizontal: 2,
    marginBottom: 8,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  row: {
    minHeight: 60,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow:
      '0 14px 24px -14px rgba(26,35,126,0.24), inset 5px 5px 12px rgba(255,255,255,0.85), inset -4px -4px 10px rgba(100,116,139,0.12)',
  },
  rowPressed: {opacity: 0.9, transform: [{translateY: -1}]},
  mic: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {flex: 1, minWidth: 0, gap: 2},
  title: {lineHeight: 14},
  subtitle: {lineHeight: 12},
  value: {flexShrink: 0, marginLeft: 4},
  version: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  delete: {alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 8},
  empty: {alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 12},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,35,126,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: {
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
    maxHeight: '72%',
  },
  modalHint: {marginTop: -4, lineHeight: 16},
  modalRow: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bannerCard: {padding: 13, gap: 6, borderRadius: 16},
  footerGap: {gap: 8},
});
