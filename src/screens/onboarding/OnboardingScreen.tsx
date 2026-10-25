import {createThemedStyles} from '../../theme';
import React from 'react';
import {
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '../../components/layout/Screen';
import {AppText, ClayButton} from '../../components/ui';
import {ClayCard, ClayIconTile} from '../../components/ui/Clay';
import {Icon, type IconName} from '../../assets/icons';
import {useSessionStore} from '../../core/session';
import {APP_LANGUAGES, LEARNING_GOALS, type LearningGoal} from '../../features/settings/preferences';
import {usePreferencesStore} from '../../features/settings/preferencesStore';
import type {RootNav} from '../../navigation/types';
import {colors, space} from '../../theme';

const GOAL_META: Record<LearningGoal, {icon: IconName; body: string; variant: 'blue' | 'pink' | 'green'}> = {
  computer: {icon: 'monitor', body: 'Practical skills and job-ready courses', variant: 'blue'},
  exams: {icon: 'target', body: 'Mock tests, news and focused preparation', variant: 'pink'},
  general: {icon: 'bulb', body: 'Awareness, facts and everyday learning', variant: 'green'},
};

export function OnboardingScreen() {
  const navigation = useNavigation<RootNav>();
  const prefs = usePreferencesStore();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [goal, setGoal] = React.useState<LearningGoal | null>(prefs.learningGoal);

  const save = () => {
    prefs.setLearningGoal(goal);
    prefs.setOnboardingComplete(true);
  };
  const openAuth = (screen: 'Login' | 'Register') => {
    save();
    navigation.replace(screen);
  };
  const browseAsGuest = () => {
    save();
    void useSessionStore.getState().enterGuest();
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <ClayIconTile icon="gradcap" color={colors.primary} size={58} />
          <AppText face="mono" size={11} weight="900" color={colors.primary}>RACI · START HERE</AppText>
        </View>

        {step === 1 ? (
          <>
            <View style={styles.heading}>
              <AppText weight="900" size={25} color={colors.navy}>What are you preparing for?</AppText>
              <AppText size={13} color={colors.text2}>We’ll put the most useful section first. You can change this later.</AppText>
            </View>
            <View style={styles.options}>
              {LEARNING_GOALS.map(item => {
                const meta = GOAL_META[item.id];
                const selected = goal === item.id;
                return (
                  <ClayCard key={item.id} variant={meta.variant} padded={false} onPress={() => setGoal(item.id)} style={[styles.goalCard, selected && styles.goalSelected]}>
                    <ClayIconTile icon={meta.icon} color={colors.primary} size={42} />
                    <View style={styles.goalCopy}>
                      <AppText weight="900" size={14} color={colors.navy}>{item.label}</AppText>
                      <AppText size={11} color={colors.text2}>{meta.body}</AppText>
                    </View>
                    <Icon name={selected ? 'check' : 'chev'} size={16} color={selected ? colors.success : colors.text3} />
                  </ClayCard>
                );
              })}
            </View>
            <ClayButton label="Continue" disabled={!goal} onPress={() => setStep(2)} />
            <Pressable accessibilityRole="button" onPress={browseAsGuest} style={styles.skip}>
              <AppText weight="700" size={12} color={colors.text2} center>Skip for now</AppText>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.heading}>
              <AppText weight="900" size={25} color={colors.navy}>Choose your app language</AppText>
              <AppText size={13} color={colors.text2}>Course and test content stays in the language in which it was published.</AppText>
            </View>
            <View style={styles.options}>
              {APP_LANGUAGES.map(item => {
                const selected = prefs.language === item.id;
                return (
                  <ClayCard key={item.id} variant={selected ? 'blue' : 'white'} onPress={() => prefs.setLanguage(item.id)} style={styles.languageCard}>
                    <View style={styles.goalCopy}>
                      <AppText weight="900" size={15} color={colors.navy}>{item.native}</AppText>
                      <AppText size={11} color={colors.text2}>{item.label}</AppText>
                    </View>
                    {selected ? <Icon name="check" size={17} color={colors.success} /> : null}
                  </ClayCard>
                );
              })}
            </View>
            <ClayButton label="Browse as guest" onPress={browseAsGuest} />
            <View style={styles.authRow}>
              <View style={styles.authButton}><ClayButton label="Login" tone="ghost" onPress={() => openAuth('Login')} /></View>
              <View style={styles.authButton}><ClayButton label="Register" tone="ghost" onPress={() => openAuth('Register')} /></View>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setStep(1)} style={styles.skip}>
              <AppText weight="700" size={12} color={colors.primary} center>Back to learning goal</AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = createThemedStyles({
  page: {flexGrow: 1, justifyContent: 'center', padding: space.pageX, gap: 20, paddingVertical: 28},
  brand: {alignItems: 'center', gap: 10},
  heading: {gap: 8},
  options: {gap: 11},
  goalCard: {minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13},
  goalSelected: {borderWidth: 2, borderColor: colors.primary},
  goalCopy: {flex: 1, minWidth: 0, gap: 4},
  languageCard: {flexDirection: 'row', alignItems: 'center'},
  authRow: {flexDirection: 'row', gap: 10},
  authButton: {flex: 1},
  skip: {minHeight: 42, justifyContent: 'center'},
});
