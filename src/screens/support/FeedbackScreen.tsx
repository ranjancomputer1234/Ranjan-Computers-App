import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {AppText, ClayButton, ErrorState, FilterChip, FormField, LoadingBlock} from '../../components/ui';
import {useRepositories} from '../../core/di';
import {queryKeys} from '../../core/query';
import {space} from '../../theme';
import {useTheme} from '../../theme/ThemeProvider';

const CATEGORIES = ['Bug', 'Content', 'Payment', 'Other'] as const;
type Category = typeof CATEGORIES[number];

export function FeedbackScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const repos = useRepositories();
  const support = useQuery({queryKey: queryKeys.support(), queryFn: () => repos.account.support()});
  const [category, setCategory] = React.useState<Category>('Bug');
  const [message, setMessage] = React.useState('');
  const validEmail = support.data?.email && !support.data.email.endsWith('.invalid') ? support.data.email : undefined;

  const send = async () => {
    const body = message.trim();
    if (body.length < 10) {
      Alert.alert('Add a little more detail', 'Please enter at least 10 characters so the team can understand your feedback.');
      return;
    }
    if (!validEmail) return;
    const url = `mailto:${validEmail}?subject=${encodeURIComponent(`RACI app feedback · ${category}`)}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email support', `Send your ${category.toLowerCase()} feedback to ${validEmail}.`);
    }
  };

  return (
    <Screen padded={false}>
      <DetailHeader title="Send Feedback" subtitle="Tell us what would make RACI better" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        {support.isLoading ? <LoadingBlock /> : null}
        {support.isError ? <ErrorState message="Support contact details could not be loaded." onRetry={() => void support.refetch()} /> : null}
        {!support.isLoading && !support.isError ? (
          <>
            <View style={styles.chips}>
              {CATEGORIES.map(item => (
                <FilterChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
              ))}
            </View>
            <FormField
              label="Feedback"
              placeholder="What happened, or what would you like to see?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={styles.message}
              maxLength={1200}
            />
            <AppText size={10.5} color={theme.colors.text3}>{message.length}/1200</AppText>
            {validEmail ? (
              <>
                <ClayButton label="Open email app" icon="send" onPress={() => void send()} />
                <AppText size={11} color={theme.colors.text2} center>
                  Your email app will open with this message. Nothing is submitted until you send it.
                </AppText>
              </>
            ) : (
              <ErrorState message="No support email is configured for this build." />
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {padding: space.pageX, gap: 14, paddingBottom: 28},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  message: {minHeight: 150, paddingTop: 12},
});
