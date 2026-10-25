import React from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {accountKey} from '../../core/session';
import {colors} from '../../theme';
import {AppText, ErrorState, LoadingBlock} from '../../components/ui';
import {ClayCard} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Icon} from '../../assets/icons';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../../navigation/types';
import {styles} from './styles';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';

function statusLabel(status: string) {
  switch (status) {
    case 'issued':
      return 'Issued';
    case 'revoked':
      return 'Revoked';
    case 'expired':
      return 'Expired';
    case 'superseded':
      return 'Superseded';
    default:
      return 'Not issued';
  }
}

export function DocumentListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const kind = (useRoute().params as {kind?: 'admit_card' | 'certificate'} | undefined)?.kind;
  const repos = useRepositories();
  const docs = useQuery({queryKey: queryKeys.documents(accountKey(), kind), queryFn: () => repos.account.documents(kind)});
  const pullRefresh = usePullRefreshFeedback({
    refreshing: docs.isRefetching,
    onRefresh: () => {
      docs.refetch().catch(() => undefined);
    },
  });

  if (docs.isLoading) {
    return (
      <Screen padded={false}>
        <DetailHeader title={kind === 'admit_card' ? 'Admit cards' : 'Certificates'} onBack={() => navigation.goBack()} />
        <LoadingBlock />
      </Screen>
    );
  }

  if (docs.isError) {
    return (
      <Screen padded={false}>
        <DetailHeader title={kind === 'admit_card' ? 'Admit cards' : 'Certificates'} onBack={() => navigation.goBack()} />
        <ErrorState message="Could not load documents." onRetry={() => void docs.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader title={kind === 'admit_card' ? 'Admit cards' : 'Certificates'} onBack={() => navigation.goBack()} />
      <ScrollView {...pullRefresh.scrollProps} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {docs.data?.map(doc => {
          const course = doc.details.course;
          const score = doc.details.score;
          const grade = doc.details.grade;
          const examDate = doc.details.examDate;
          const openIssued = () => {
            if (doc.kind === 'admit_card') navigation.navigate('AdmitCard', {documentId: doc.id});
            else navigation.navigate('Certificate', {documentId: doc.id});
          };
          return (
            <ClayCard
              key={doc.id}
              variant={doc.kind === 'certificate' ? 'cream' : 'sky'}
              onPress={doc.status === 'issued' ? openIssued : undefined}>
              <View style={styles.listRow}>
                <View style={styles.listIcon}>
                  <Icon
                    name={doc.kind === 'certificate' ? 'award' : 'clipboard'}
                    size={18}
                    color={doc.kind === 'certificate' ? '#F9A825' : colors.activeBlue}
                  />
                </View>
                <View style={styles.listBody}>
                  <AppText weight="800" size={13} color={colors.navy}>
                    {doc.title}
                  </AppText>
                  {course ? (
                    <AppText size={11} color={colors.text2} numberOfLines={2}>
                      {course}
                    </AppText>
                  ) : null}
                  <View style={styles.listMeta}>
                    <AppText size={10} weight="700" color={doc.status === 'issued' ? colors.success : colors.text3}>
                      {statusLabel(doc.status)}
                      {doc.verified && doc.status === 'issued' ? ' · Verified' : ''}
                    </AppText>
                    {doc.kind === 'certificate' && (score || grade) ? (
                      <AppText size={10} weight="700" color={colors.navy}>
                        {[score, grade && `Grade ${grade}`].filter(Boolean).join(' · ')}
                      </AppText>
                    ) : null}
                    {doc.kind === 'admit_card' && examDate ? (
                      <AppText size={10} weight="700" color={colors.navy} numberOfLines={1}>
                        {examDate}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                {doc.status === 'issued' ? <Icon name="chev" size={14} color={colors.text3} /> : null}
              </View>
            </ClayCard>
          );
        })}
        {!docs.data?.length ? (
          <AppText color={colors.text2} size={13}>
            {kind === 'admit_card'
              ? 'No admit cards yet. Issued semester exam cards appear here.'
              : 'No certificates yet. Completed courses appear here after the admin issues them.'}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
