import React, {useCallback, useMemo} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {RediLogo} from '../../assets/illustrations';
import {Icon} from '../../assets/icons';
import {styles} from './styles';
import {useResource} from '../../core/useResource';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

function formatIssuedDate(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}

function detail(details: Record<string, string>, key: string) {
  return details[key]?.trim() || '';
}

export function CertificateScreen() {
  const navigation = useNavigation();
  const documentId = (useRoute().params as {documentId: string}).documentId;
  const repos = useRepositories();
  const resource = useResource();
  const doc = useQuery({
    queryKey: queryKeys.document(accountKey(), documentId),
    queryFn: () => repos.account.document(documentId),
  });
  const pullRefresh = usePullRefreshFeedback({
    refreshing: doc.isRefetching,
    onRefresh: () => {
      doc.refetch().catch(() => undefined);
    },
  });
  const data = doc.data;

  const course = detail(data?.details ?? {}, 'course');
  const score = detail(data?.details ?? {}, 'score');
  const grade = detail(data?.details ?? {}, 'grade');
  const certificateId = detail(data?.details ?? {}, 'certificateId');
  const signatory = detail(data?.details ?? {}, 'signatory') || 'Authorized Signatory';
  const signatoryRole = detail(data?.details ?? {}, 'signatoryRole') || 'RACI';
  const issuedLabel = formatIssuedDate(data?.issuedAt);

  const headerSubtitle = useMemo(() => {
    if (!course) return 'Course Completed';
    const short = course.split(/[—–-]/)[0]?.trim() || course;
    return `${short} · Course Completed`;
  }, [course]);

  const onOpenPdf = useCallback(() => {
    if (!data?.resourceId) return;
    (navigation.navigate as (screen: string, params: object) => void)('ProtectedViewer', {resourceId: data.resourceId, title: data.title, mimeType: 'application/pdf', kind: 'pdf'});
  }, [data, navigation]);

  const onDownloadPdf = useCallback(() => {
    if (!data?.resourceId) return;
    resource.open({resourceId: data.resourceId, title: data.title, kind: 'pdf', mimeType: 'application/pdf'}, true);
  }, [data, resource]);

  const onVerify = useCallback(() => {
    if (!data?.verificationToken) {
      Alert.alert('Verification', 'This document does not include a verification token.');
      return;
    }
    void repos.account.verifyDocument(data.verificationToken).then(result => {
      const lines = [
        result.valid ? 'This document is valid.' : result.message || 'This document could not be verified.',
        result.serial ? `Serial: ${result.serial}` : '',
        result.displayName ? `Name: ${result.displayName}` : '',
        result.issuer ? `Issuer: ${result.issuer}` : '',
      ].filter(Boolean);
      Alert.alert(result.valid ? 'Verified' : 'Not verified', lines.join('\n'));
    }).catch(error => {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Verification could not be completed.';
      Alert.alert('Verification', message);
    });
  }, [data?.verificationToken, repos.account]);

  if (doc.isLoading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  if (doc.isError || data?.status !== 'issued' || data.kind !== 'certificate') {
    return (
      <Screen padded={false}>
        <DetailHeader title="Certificate" onBack={() => navigation.goBack()} />
        <ErrorState
          message="This certificate is unavailable or has been revoked."
          onRetry={() => void doc.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Certificate"
        subtitle={headerSubtitle}
        onBack={() => navigation.goBack()}
      />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Gradient colors={gradients.certificate} start={{x: 0.1, y: 0}} end={{x: 0.9, y: 1}} style={styles.cert}>
          <View pointerEvents="none" style={[styles.certCorner, styles.certCornerTL]} />
          <View pointerEvents="none" style={[styles.certCorner, styles.certCornerTR]} />
          <View pointerEvents="none" style={[styles.certCorner, styles.certCornerBL]} />
          <View pointerEvents="none" style={[styles.certCorner, styles.certCornerBR]} />

          <RediLogo size={48} borderColor="#D4AF37" />

          <AppText
            face="mono"
            weight="700"
            size={10}
            color="#8D6E63"
            center
            style={styles.certEyebrow}>
            CERTIFICATE OF COMPLETION
          </AppText>

          <AppText size={9.5} color={colors.text2} center style={styles.certPresented}>
            This certificate is proudly presented to
          </AppText>

          <AppText face="caveat" weight="700" size={34} color={colors.navy} center style={styles.certName}>
            {data.learnerName}
          </AppText>

          <AppText size={10} color="#424242" center style={styles.certBody}>
            for successfully completing the course{'\n'}
            <AppText size={10} weight="800" color={colors.navy}>
              {course || data.title}
            </AppText>
          </AppText>

          <Gradient colors={['#FFB74D', '#E65100']} start={{x: 0.3, y: 0.2}} end={{x: 1, y: 1}} style={styles.seal}>
            <Icon name="cap" size={26} color="#fff" />
          </Gradient>

          <View style={styles.chipRow}>
            {score ? (
              <View style={[styles.typeChip, styles.chipScore]}>
                <AppText weight="800" size={8.5} color={colors.success} style={styles.chipLabel}>
                  SCORE {score.replace(/^SCORE\s+/i, '')}
                </AppText>
              </View>
            ) : null}
            {grade ? (
              <View style={[styles.typeChip, styles.chipGrade]}>
                <AppText weight="800" size={8.5} color={colors.activeBlue} style={styles.chipLabel}>
                  GRADE {grade.replace(/^GRADE\s+/i, '')}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.sigRow}>
            <View style={styles.sig}>
              <AppText face="caveat" weight="700" size={16} color={colors.navy} center>
                {signatory}
              </AppText>
              <AppText size={8} weight="600" color={colors.text2} center style={styles.sigMeta}>
                {signatoryRole}
              </AppText>
            </View>
            <View style={styles.sigDivider} />
            <View style={styles.sig}>
              <AppText face="caveat" weight="700" size={16} color={colors.navy} center>
                {issuedLabel}
              </AppText>
              <AppText size={8} weight="600" color={colors.text2} center style={styles.sigMeta}>
                Date of Issue
              </AppText>
            </View>
          </View>

          {certificateId ? (
            <View>
              <AppText face="mono" weight="600" size={7.5} color="#8D6E63" center style={styles.certId}>
                CERT ID · {certificateId}
              </AppText>
            </View>
          ) : null}

          {data.verified ? (
            <AppText face="mono" weight="600" size={7.5} color={colors.success} center style={styles.verifiedLine}>
              ISSUED VIA RACI ADMIN PANEL · VERIFIED
            </AppText>
          ) : (
            <AppText face="mono" weight="600" size={7.5} color="#8D6E63" center style={styles.verifiedLine}>
              ISSUED VIA RACI ADMIN PANEL
            </AppText>
          )}
        </Gradient>

        {resource.error ? (
          <AppText accessibilityRole="alert" color={colors.error} size={12}>
            {resource.error}
          </AppText>
        ) : null}

        <ClayButton
          label={resource.busy ? 'Working…' : 'Save protected PDF'}
          icon="download"
          compact
          disabled={resource.busy || !data.resourceId}
          onPress={onDownloadPdf}
        />

        <ClayButton
          label={resource.busy ? 'Working…' : 'Open official PDF'}
          tone="ghost"
          compact
          disabled={resource.busy || !data.resourceId}
          onPress={onOpenPdf}
        />

        <AppText size={10} color={colors.text2}>
          This issued document can only be opened inside RACI. Sharing, exporting and printing are disabled.
        </AppText>

        <ClayCard variant="white" style={styles.verifyCard} onPress={onVerify}>
          <View style={styles.verifyRow}>
            <Icon name="shield" size={18} color="#1565C0" />
            <AppText size={10} color={colors.text2} style={styles.verifyText}>
              {data.verificationUrl
                ? `Issued by RACI Admin Panel · tap to open the verification link for certificate ID ${certificateId || 'on record'}.`
                : `Issued by RACI Admin Panel · certificate ID ${certificateId || 'on record'} is verified only from the issued record.`}
            </AppText>
          </View>
        </ClayCard>
      </ScrollView>
    </Screen>
  );
}
