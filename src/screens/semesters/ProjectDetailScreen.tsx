import React from 'react';
import {ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../core/di';
import {AppText, ClayButton, ErrorState, FormField, LoadingBlock} from '../../components/ui';
import {accountKey} from '../../core/session';
import {getAccountScoped, setAccountScoped} from '../../core/storage';
import {useAsyncAction} from '../../core/useAsyncAction';
import {colors} from '../../theme';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {LearningStackParamList} from '../../navigation/types';
import {styles} from './styles';

export function ProjectDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LearningStackParamList>>();
  const projectId = (useRoute().params as {projectId: string}).projectId;
  const repos = useRepositories();
  const [text, setText] = React.useState('');
  const owner = accountKey();
  const client = useQueryClient();
  const draftReady = React.useRef(false);
  const project = useQuery({queryKey: ['project', owner, projectId], queryFn: () => repos.learning.project(projectId)});
  React.useEffect(() => {
    let mounted = true;
    void getAccountScoped(owner, 'projectDraft.' + projectId, '').then(draft => { if (mounted) { setText(draft); draftReady.current = true; } });
    return () => { mounted = false; };
  }, [owner, projectId]);
  React.useEffect(() => {
    if (!draftReady.current) return;
    void setAccountScoped(owner, 'projectDraft.' + projectId, text);
  }, [text, owner, projectId]);
  const submitted = project.data?.status === 'submitted' || project.data?.status === 'accepted';
  const submit = useAsyncAction(async () => {
    if (!text.trim()) throw new Error('Add your written submission first.');
    const result = await repos.learning.submitProject(projectId, {text: text.trim()});
    client.setQueryData(['project', owner, projectId], result);
    await client.invalidateQueries({queryKey: ['learner', owner]});
  });
  return (
    <Screen padded={false}>
      <DetailHeader title="Project" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        {project.isLoading ? <LoadingBlock /> : null}
        {project.isError ? <ErrorState message="Could not load this project." onRetry={() => void project.refetch()} /> : null}
        <AppText weight="800">{project.data?.title}</AppText>
        <AppText size={12}>{project.data?.instructions}</AppText>
        {project.data?.feedback ? <AppText>{project.data.feedback}</AppText> : null}
        <FormField value={text} onChangeText={setText} label="Written submission" placeholder="Add your work here" multiline maxLength={20000} editable={!submitted && !submit.busy} />
        {submit.error ? <AppText accessibilityRole="alert" color={colors.error}>{submit.error}</AppText> : null}
        <ClayButton label={submitted ? 'Submitted for review' : submit.busy ? 'Submitting…' : 'Submit project'} disabled={!project.data || submitted || submit.busy || !text.trim()} onPress={() => void submit.run()} />
      </ScrollView>
    </Screen>
  );
}
