import React from 'react';
import {Modal, Pressable, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../../assets/icons';
import {AppText, ClayButton} from '../../components/ui';
import {useUiTranslation} from '../../features/settings/uiTranslations';
import {colors, gradients} from '../../theme';
import {styles} from './styles';

const WEEKDAY_LABELS = Array.from({length: 7}, (_, index) =>
  new Date(2024, 0, 1 + index).toLocaleDateString('en-IN', {weekday: 'narrow'}),
);

export type DayMark = {count: number; live: boolean};

export function dayKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthCells(month: Date) {
  const first = startOfMonth(month);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const count = lead + daysInMonth > 35 ? 42 : 35;
  return Array.from({length: count}, (_, index) => addDays(first, index - lead));
}

export function ScheduleCalendarSheet({
  visible,
  selectedKey,
  featuredKey,
  marks,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedKey: string;
  featuredKey: string | null;
  marks: Map<string, DayMark>;
  onClose: () => void;
  onSelect: (key: string) => void;
}) {
  const tx = useUiTranslation();
  const insets = useSafeAreaInsets();
  const [cursor, setCursor] = React.useState(() => startOfMonth(dateFromKey(selectedKey)));

  React.useEffect(() => {
    if (visible) setCursor(startOfMonth(dateFromKey(selectedKey)));
  }, [visible, selectedKey]);

  const cells = React.useMemo(() => monthCells(cursor), [cursor]);
  const classDays = cells.filter(date => date.getMonth() === cursor.getMonth() && marks.has(dayKey(date))).length;
  const todayKey = dayKey(new Date());
  const showNextClass = Boolean(featuredKey && featuredKey !== todayKey && featuredKey !== selectedKey);
  const monthLabel = cursor.toLocaleDateString('en-IN', {month: 'long', year: 'numeric'});

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable accessible={false} style={styles.calendarBackdrop} onPress={onClose}>
        <Pressable
          accessible={false}
          accessibilityViewIsModal
          onPress={event => event.stopPropagation()}
          style={[styles.calendarSheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
          <View style={styles.calendarHandle} />
          <View style={styles.calendarHead}>
            <AppText weight="900" size={18} color={colors.navy}>
              Choose a day
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={tx('Close calendar')} hitSlop={8}>
              <AppText weight="700" size={13} color={colors.primary}>
                Close
              </AppText>
            </Pressable>
          </View>

          <View style={styles.calendarMonthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Previous month')}
              onPress={() => setCursor(current => shiftMonth(current, -1))}
              style={({pressed}) => [styles.calendarNav, pressed && {opacity: 0.7}]}>
              <Icon name="chev" size={16} color={colors.navy} style={{transform: [{scaleX: -1}]}} />
            </Pressable>
            <View style={styles.calendarMonthCopy}>
              <AppText weight="800" size={16} color={colors.navy} center>
                {monthLabel}
              </AppText>
              <AppText weight="600" size={11} color={colors.text2} center>
                {classDays === 0 ? 'No classes this month' : classDays === 1 ? '1 day with a class' : classDays}
                {classDays > 1 ? ' days with classes' : ''}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Next month')}
              onPress={() => setCursor(current => shiftMonth(current, 1))}
              style={({pressed}) => [styles.calendarNav, pressed && {opacity: 0.7}]}>
              <Icon name="chev" size={16} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.calendarWeekdays}>
            {WEEKDAY_LABELS.map((label, index) => (
              <AppText key={`${label}-${index}`} weight="700" size={10} color={colors.text3} style={styles.calendarWeekday}>
                {label}
              </AppText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map(date => {
              const key = dayKey(date);
              const inMonth = date.getMonth() === cursor.getMonth();
              const selected = key === selectedKey;
              const today = key === todayKey;
              const mark = marks.get(key);
              const label = [
                date.toLocaleDateString('en-IN', {weekday: 'long', month: 'long', day: 'numeric'}),
                mark ? `${mark.count} ${tx(mark.count === 1 ? 'Class' : 'Classes')}` : '',
                mark?.live ? tx('Live now') : '',
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{selected}}
                  onPress={() => onSelect(key)}
                  style={({pressed}) => [styles.calendarCell, pressed && !selected && {opacity: 0.72}]}>
                  <View
                    style={[
                      styles.calendarDay,
                      selected && {backgroundColor: gradients.primaryButton[1]},
                      today && !selected && styles.calendarDayToday,
                    ]}>
                    <AppText
                      weight={selected || today || mark ? '800' : '600'}
                      size={13}
                      color={selected ? '#fff' : inMonth ? colors.navy : colors.text3}
                      style={mark ? {marginTop: -5} : undefined}>
                      {date.getDate()}
                    </AppText>
                    {mark ? (
                      <View
                        style={[
                          styles.calendarDot,
                          {
                            backgroundColor: selected && !mark.live ? '#fff' : mark.live ? colors.error : colors.primary,
                            borderWidth: selected && mark.live ? 1 : 0,
                            borderColor: '#fff',
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.calendarLegend}>
            <View style={styles.calendarLegendItem}>
              <View style={[styles.calendarLegendDot, {backgroundColor: colors.primary}]} />
              <AppText weight="600" size={11} color={colors.text2}>
                Class
              </AppText>
            </View>
            <View style={styles.calendarLegendItem}>
              <View style={[styles.calendarLegendDot, {backgroundColor: colors.error}]} />
              <AppText weight="600" size={11} color={colors.text2}>
                Live now
              </AppText>
            </View>
          </View>

          <View style={styles.calendarActions}>
            <ClayButton label="Today" tone="ghost" compact style={{flex: 1}} onPress={() => onSelect(todayKey)} />
            {showNextClass && featuredKey ? (
              <ClayButton label="Next class" compact style={{flex: 1}} onPress={() => onSelect(featuredKey)} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
