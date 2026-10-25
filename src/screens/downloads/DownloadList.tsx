import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { accountKey, useSessionStore } from '../../core/session';
import { offlineFiles, type OfflineFile } from '../../core/offlineFiles';
import { useAsyncAction } from '../../core/useAsyncAction';
import { useResource } from '../../core/useResource';
import { usePreferencesStore } from '../../features/settings/preferencesStore';
import { clay, colors, space } from '../../theme';
import {
  AppText,
  ClayButton,
  ClayCard,
  EmptyState,
  ErrorState,
  FilterChip,
  IconButton,
  LoadingBlock,
} from '../../components/ui';
import { DetailHeader, Screen } from '../../components/layout/Screen';
import { Icon, type IconName } from '../../assets/icons';

type Filter = 'all' | OfflineFile['kind'];
type Sort = 'recent' | 'name' | 'size';
type SavedFile = OfflineFile & { available: boolean };

const filters: { label: string; kind: Filter }[] = [
  { label: 'All', kind: 'all' },
  { label: 'Notes', kind: 'notes' },
  { label: 'PDFs', kind: 'pdf' },
];

export function formatDownloadBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1073741824)
    return `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function sortFiles(files: SavedFile[], sort: Sort): SavedFile[] {
  return [...files].sort((a, b) => {
    if (sort === 'name') return a.title.localeCompare(b.title);
    if (sort === 'size') return b.bytes - a.bytes;
    return (
      Date.parse(b.savedAt ?? b.expiresAt) -
      Date.parse(a.savedAt ?? a.expiresAt)
    );
  });
}

function accessLabel(file: SavedFile): string {
  if (!file.available) return 'Needs renewal';
  const days = Math.max(
    1,
    Math.ceil((Date.parse(file.expiresAt) - Date.now()) / 86400000),
  );
  return `Available offline · ${days} day${days === 1 ? '' : 's'} left`;
}

export function DownloadList() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const owner = accountKey();
  const status = useSessionStore(s => s.status);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [sort, setSort] = React.useState<Sort>('recent');
  const [manage, setManage] = React.useState(false);
  const wifiOnly = usePreferencesStore(s => s.wifiOnly);
  const resource = useResource();
  const selected = React.useRef<OfflineFile | null>(null);
  const bulkIds = React.useRef<string[]>([]);
  const files = useQuery({
    queryKey: ['offline-files', owner],
    queryFn: () => offlineFiles.list(owner),
    enabled: status === 'authenticated',
    networkMode: 'always',
    refetchInterval: focused ? 10000 : false,
  });
  const refetchFiles = files.refetch;
  const pullRefresh = usePullRefreshFeedback({
    refreshing: files.isRefetching && !files.isLoading,
    onRefresh: () => {
      files.refetch().catch(() => undefined);
    },
    enabled: status === 'authenticated',
  });

  React.useEffect(() => {
    if (!focused) return;
    if (status === 'authenticated') void refetchFiles();
  }, [focused, status, refetchFiles]);

  const open = useAsyncAction(async () => {
    const file = selected.current;
    if (!file) return;
    (navigation.navigate as (screen: string, params: object) => void)('ProtectedViewer', {
      resourceId: file.resourceId,
      title: file.title,
      mimeType: 'application/pdf',
      kind: file.kind === 'pdf' ? 'pdf' : 'notes',
    });
  });
  const remove = useAsyncAction(async () => {
    if (!selected.current) return;
    await offlineFiles.remove(owner, selected.current.resourceId);
    await files.refetch();
  });
  const removeMany = useAsyncAction(async () => {
    for (const id of bulkIds.current) await offlineFiles.remove(owner, id);
    setManage(false);
    await files.refetch();
  });

  const allFiles = (files.data ?? []) as SavedFile[];
  const visible = sortFiles(
    allFiles.filter(item => filter === 'all' || item.kind === filter),
    sort,
  );
  const totalBytes = allFiles.reduce((sum, item) => sum + item.bytes, 0);
  const noteBytes = allFiles
    .filter(item => item.kind === 'notes')
    .reduce((sum, item) => sum + item.bytes, 0);
  const pdfBytes = totalBytes - noteBytes;
  const sortLabel =
    sort === 'recent'
      ? 'Recently saved'
      : sort === 'name'
      ? 'Name'
      : 'Largest first';
  const busy = open.busy || remove.busy || removeMany.busy || resource.busy;

  const chooseSort = () =>
    Alert.alert('Sort downloads', 'Choose how saved resources are arranged.', [
      { text: 'Recently saved', onPress: () => setSort('recent') },
      { text: 'Name', onPress: () => setSort('name') },
      { text: 'Largest first', onPress: () => setSort('size') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const removeFile = (item: OfflineFile) => {
    selected.current = item;
    Alert.alert(
      'Remove saved file?',
      'You can download this resource again while you have access.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void remove.run(),
        },
      ],
    );
  };

  const showActions = (item: SavedFile) => {
    selected.current = item;
    const primary = item.available
      ? { text: 'Open', onPress: () => void open.run() }
      : { text: 'Renew download', onPress: () => resource.open(item, true) };
    Alert.alert(item.title, accessLabel(item), [
      primary,
      { text: 'Remove', style: 'destructive', onPress: () => removeFile(item) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmBulkRemove = () => {
    bulkIds.current = visible.map(item => item.resourceId);
    if (!bulkIds.current.length) return;
    Alert.alert(
      `Remove ${bulkIds.current.length} ${
        bulkIds.current.length === 1 ? 'file' : 'files'
      }?`,
      filter === 'all'
        ? 'This clears all RACI downloads from this device.'
        : `This clears the visible ${filters
            .find(item => item.kind === filter)
            ?.label.toLowerCase()} downloads.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void removeMany.run(),
        },
      ],
    );
  };

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Downloads"
        subtitle="Learn without internet"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="slider"
            onPress={chooseSort}
            accessibilityLabel="Sort downloads"
          />
        }
      />
      <ScrollView
        {...pullRefresh.scrollProps}
        contentContainerStyle={styles.page}
      >
        {status !== 'authenticated' ? (
          <EmptyState
            title="Sign in to save resources"
            body="Your downloaded notes are kept separate from other accounts."
            actionLabel="Sign in"
            onAction={() => useSessionStore.getState().showLogin()}
          />
        ) : (
          <>
            <StorageCard
              total={totalBytes}
              notes={noteBytes}
              pdfs={pdfBytes}
              count={allFiles.length}
            />

            <View style={styles.filters}>
              {filters.map(item => (
                <FilterChip
                  key={item.kind}
                  label={item.label}
                  selected={filter === item.kind}
                  onPress={() => setFilter(item.kind)}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitle}>
                <AppText weight="900" size={15} color={colors.navy}>
                  Downloaded content
                </AppText>
                <AppText size={10.5} color={colors.text2}>
                  {visible.length} {visible.length === 1 ? 'item' : 'items'} ·{' '}
                  {sortLabel}
                </AppText>
              </View>
              {visible.length ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setManage(value => !value)}
                  hitSlop={8}
                >
                  <AppText weight="800" size={12} color={colors.primary}>
                    {manage ? 'Done' : 'Manage'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            {files.isLoading ? <LoadingBlock /> : null}
            {files.isError ? (
              <ErrorState
                message="Saved files could not be loaded."
                onRetry={() => void files.refetch()}
              />
            ) : null}
            {open.error ||
            remove.error ||
            removeMany.error ||
            resource.error ? (
              <AppText accessibilityRole="alert" color={colors.error}>
                {open.error ||
                  remove.error ||
                  removeMany.error ||
                  resource.error}
              </AppText>
            ) : null}

            {!files.isLoading && !files.isError
              ? visible.map(item => (
                  <DownloadRow
                    key={item.resourceId}
                    item={item}
                    busy={busy}
                    managing={manage}
                    onOpen={() => {
                      selected.current = item;
                      if (item.available) void open.run();
                      else resource.open(item, true);
                    }}
                    onMore={() => showActions(item)}
                    onRemove={() => removeFile(item)}
                  />
                ))
              : null}

            {!files.isLoading && !files.isError && !visible.length ? (
              <EmptyState
                title={
                  filter === 'all' ? 'No saved files yet' : `No saved ${filter}`
                }
                body="Use Save PDF in a lesson or on an issued document to keep it on this device."
              />
            ) : null}

            {manage && visible.length ? (
              <ClayButton
                label={
                  removeMany.busy
                    ? 'Removing…'
                    : `Remove visible ${
                        visible.length === 1 ? 'file' : 'files'
                      }`
                }
                tone="ghost"
                disabled={busy}
                onPress={confirmBulkRemove}
              />
            ) : null}

            <ClayCard variant="white" style={styles.notice}>
              <Icon name="wifi" size={19} color={colors.orange} />
              <View style={styles.noticeText}>
                <AppText weight="800" size={12} color={colors.navy}>
                  {wifiOnly
                    ? 'Wi-Fi only is on'
                    : 'Mobile data downloads are allowed'}
                </AppText>
                <AppText
                  size={10.5}
                  color={colors.text2}
                  style={styles.lineHeight}
                >
                  {wifiOnly
                    ? 'New downloads wait for Wi-Fi to help save mobile data.'
                    : 'Downloads may use your mobile data. Change this anytime in Settings.'}
                </AppText>
              </View>
            </ClayCard>

            <AppText size={10.5} color={colors.text2} style={styles.footnote}>
              Offline access lasts until the institute’s authorization expires.
              Sign out removes app-managed copies; files opened in another app
              are managed by that app.
            </AppText>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StorageCard({
  total,
  notes,
  pdfs,
  count,
}: {
  total: number;
  notes: number;
  pdfs: number;
  count: number;
}) {
  const noteWidth = total ? (`${(notes / total) * 100}%` as const) : '0%';
  const pdfWidth = total ? (`${(pdfs / total) * 100}%` as const) : '0%';
  return (
    <ClayCard variant="white" style={styles.storageCard}>
      <View style={styles.storageTop}>
        <View>
          <AppText weight="900" size={14} color={colors.navy}>
            Storage used
          </AppText>
          <AppText size={10.5} color={colors.text2}>
            {count} saved {count === 1 ? 'file' : 'files'} on this device
          </AppText>
        </View>
        <AppText weight="800" size={13} color={colors.navy}>
          {formatDownloadBytes(total)}
        </AppText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Download storage by category"
        style={styles.storageBar}
      >
        <View
          style={[
            styles.storageSegment,
            { width: noteWidth, backgroundColor: clay.mint.icon },
          ]}
        />
        <View
          style={[
            styles.storageSegment,
            { width: pdfWidth, backgroundColor: colors.primary },
          ]}
        />
      </View>
      <View style={styles.legend}>
        <Legend
          color={clay.mint.icon}
          label="Notes"
          value={formatDownloadBytes(notes)}
        />
        <Legend
          color={colors.primary}
          label="PDFs"
          value={formatDownloadBytes(pdfs)}
        />
      </View>
    </ClayCard>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText size={10} color={colors.text2}>
        {label} {value}
      </AppText>
    </View>
  );
}

function DownloadRow({
  item,
  busy,
  managing,
  onOpen,
  onMore,
  onRemove,
}: {
  item: SavedFile;
  busy: boolean;
  managing: boolean;
  onOpen: () => void;
  onMore: () => void;
  onRemove: () => void;
}) {
  const isNote = item.kind === 'notes';
  const icon: IconName = isNote ? 'file' : 'doc';
  return (
    <ClayCard variant="white" style={styles.downloadCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.available ? 'Open' : 'Renew'} ${
          item.title
        }`}
        disabled={busy || managing}
        onPress={onOpen}
        style={styles.downloadMain}
      >
        <View
          style={[
            styles.fileTile,
            {
              backgroundColor: isNote
                ? colors.pastel.mint
                : colors.pastel.orange,
            },
          ]}
        >
          <Icon
            name={icon}
            size={18}
            color={isNote ? clay.mint.icon : clay.orange.icon}
          />
        </View>
        <View style={styles.fileBody}>
          <AppText weight="800" size={12} color={colors.navy} numberOfLines={2}>
            {item.title}
          </AppText>
          <AppText size={10} color={colors.text2}>
            {formatDownloadBytes(item.bytes)} · {isNote ? 'Notes' : 'PDF'}
          </AppText>
          <AppText
            weight="600"
            size={9.5}
            color={item.available ? colors.success : colors.orange}
          >
            {accessLabel(item)}
          </AppText>
        </View>
      </Pressable>
      {managing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.title}`}
          disabled={busy}
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeIcon}
        >
          <Icon name="logout" size={17} color={colors.error} />
        </Pressable>
      ) : item.available ? (
        <View style={styles.savedBadge}>
          <Icon name="check" size={10} color={colors.success} />
          <AppText
            weight="800"
            size={8}
            color={colors.success}
            style={styles.badgeText}
          >
            SAVED
          </AppText>
        </View>
      ) : (
        <IconButton
          icon="refresh"
          color={colors.orange}
          onPress={onMore}
          accessibilityLabel={`Renew ${item.title}`}
        />
      )}
      {!managing && item.available ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${item.title}`}
          disabled={busy}
          onPress={onMore}
          hitSlop={7}
          style={styles.moreButton}
        >
          <Icon name="kebab" size={16} color={colors.text3} />
        </Pressable>
      ) : null}
    </ClayCard>
  );
}

const styles = createThemedStyles({
  page: { padding: space.pageX, gap: 12, paddingBottom: space.pageBottom },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storageCard: { padding: 14, gap: 12 },
  storageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  storageBar: {
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  storageSegment: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 3 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  sectionTitle: { gap: 3 },
  downloadCard: {
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: { flex: 1, minWidth: 0, gap: 4 },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  badgeText: { letterSpacing: 0.5 },
  moreButton: { paddingVertical: 8, paddingLeft: 2 },
  removeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    marginTop: 2,
  },
  noticeText: { flex: 1, minWidth: 0, gap: 3 },
  lineHeight: { lineHeight: 15 },
  footnote: { lineHeight: 15, paddingHorizontal: 2 },
});
