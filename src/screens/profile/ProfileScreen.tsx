import React from 'react';
import {Image, Pressable, ScrollView, View} from 'react-native';
import {usePullRefreshFeedback} from '../../components/ui/AppRefreshControl';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSessionStore} from '../../core/session';
import {clay, colors, gradients} from '../../theme';
import {AppText, ClayButton, ErrorState, Skeleton} from '../../components/ui';
import {ClayCard, IconButton} from '../../components/ui/Clay';
import {DetailHeader, Screen} from '../../components/layout/Screen';
import {Gradient} from '../../components/ui/Gradient';
import {ICON_NAMES, Icon, type IconName} from '../../assets/icons';
import type {ClayVariant} from '../../theme';
import type {IssuedDocument, LearnerProfile} from '../../core/types';
import type {ProfileStackParamList} from '../../navigation/types';
import {useProfile} from '../../features/profile/hooks/useProfile';
import {styles} from './styles';

type ProfileNavigation = NativeStackNavigationProp<ProfileStackParamList>;

type MenuRow = {
  label: string;
  subtitle: string;
  icon: IconName;
  variant: ClayVariant;
  onPress: () => void;
};

const iconNames = new Set<string>(ICON_NAMES);

function profileIcon(value: string): IconName {
  return iconNames.has(value) ? (value as IconName) : 'award';
}

function memberYear(memberSince?: string): string {
  if (!memberSince) return 'recently';
  const match = memberSince.match(/^\d{4}/);
  return match?.[0] ?? 'recently';
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return 'No offline files';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB offline`;
  return `${(mb / 1024).toFixed(1)} GB offline`;
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const {
    status,
    profile,
    profileQuery,
    docs,
    certificates,
    downloads,
    refreshing,
    refresh,
  } = useProfile();
  const pullRefresh = usePullRefreshFeedback({
    refreshing,
    onRefresh: refresh,
    enabled: status === 'authenticated',
  });

  const admitCard = docs.data?.find(document => document.status === 'issued');
  const issuedCertificates = certificates.data?.filter(document => document.status === 'issued').length ?? 0;
  const offlineBytes =
    downloads.data
      ?.filter(item => item.status === 'completed')
      .reduce((total, item) => total + item.bytes, 0) ?? 0;

  const rows: MenuRow[] = [
    {
      label: 'My Courses',
      subtitle: `${profile?.stats.courses ?? 0} enrolled`,
      icon: 'bookopen',
      variant: 'blue',
      onPress: () => navigation.navigate('EnrolledCourses'),
    },
    {
      label: 'Certificates',
      subtitle: issuedCertificates === 1 ? '1 earned' : `${issuedCertificates} earned`,
      icon: 'award',
      variant: 'cyan',
      onPress: () => navigation.navigate('DocumentList', {kind: 'certificate'}),
    },
    {
      label: 'Downloads',
      subtitle: formatBytes(offlineBytes),
      icon: 'download',
      variant: 'mint',
      onPress: () => navigation.navigate('Downloads'),
    },
    {
      label: 'Help & Support',
      subtitle: 'FAQ · email · phone',
      icon: 'help',
      variant: 'orange',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <Screen padded={false} pullGestureHandlers={pullRefresh.gestureHandlers}>
      <DetailHeader
        title="Profile"
        subtitle="Your learning account"
        right={<IconButton icon="gear" onPress={() => navigation.navigate('Settings')} accessibilityLabel="Settings" />}
      />
      <ScrollView
        {...pullRefresh.scrollProps}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}>
        {status !== 'authenticated' ? (
          <SignedOutProfile onLogin={() => useSessionStore.getState().showLogin()} />
        ) : profileQuery.isPending && !profile ? (
          <ProfileSkeleton />
        ) : profileQuery.isError && !profile ? (
          <ErrorState message="Your profile could not be loaded. Check your connection and try again." onRetry={refresh} />
        ) : profile ? (
          <>
            <ProfileIdentity profile={profile} onEdit={() => navigation.navigate('EditProfile')} />

            <View style={styles.stats}>
              <Stat value={profile.stats.courses} label="Courses" variant="blue" />
              <Stat value={profile.stats.tests} label="Tests" variant="green" />
              <Stat value={profile.stats.streakDays} label="Day Streak" variant="orange" />
            </View>

            <SectionTitle>Achievements</SectionTitle>
            {profile.achievements.length ? (
              <View style={styles.achievements}>
                {profile.achievements.slice(0, 3).map(item => (
                  <Achievement
                    key={item.id}
                    label={item.label}
                    icon={profileIcon(item.icon)}
                    variant={item.clay as ClayVariant}
                  />
                ))}
              </View>
            ) : (
              <ClayCard variant="yellow" style={styles.emptyAchievement}>
                <Icon name="award" size={22} color={clay.yellow.icon} />
                <AppText size={12} color={colors.text2} style={styles.emptyAchievementText}>
                  Keep learning—your first achievement will appear here.
                </AppText>
              </ClayCard>
            )}

            <SectionTitle>Account</SectionTitle>
            <View style={styles.menuList}>
              {rows.map(row => (
                <AccountRow key={row.label} {...row} />
              ))}
            </View>

            {admitCard ? (
              <AdmitCardBanner document={admitCard} onPress={() => navigation.navigate('AdmitCard', {documentId: admitCard.id})} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function SignedOutProfile({onLogin}: {onLogin: () => void}) {
  return (
    <ClayCard variant="sky" style={styles.signedOut}>
      <View style={styles.signedOutIcon}>
        <Icon name="user" size={30} color={colors.primary} />
      </View>
      <AppText weight="900" size={20} color={colors.navy} center>
        Your learning, all in one place
      </AppText>
      <AppText size={13} color={colors.text2} center style={styles.signedOutCopy}>
        Sign in to track courses, test results, achievements, downloads, and certificates.
      </AppText>
      <ClayButton label="Login to continue" onPress={onLogin} />
    </ClayCard>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.skeletons}>
      <Skeleton height={176} variant="sky" />
      <View style={styles.stats}>
        <View style={styles.skeletonStat}><Skeleton height={78} variant="blue" /></View>
        <View style={styles.skeletonStat}><Skeleton height={78} variant="green" /></View>
        <View style={styles.skeletonStat}><Skeleton height={78} variant="orange" /></View>
      </View>
      <Skeleton height={88} variant="yellow" />
      <Skeleton height={250} variant="white" />
    </View>
  );
}

function ProfileIdentity({profile, onEdit}: {profile: LearnerProfile; onEdit: () => void}) {
  const initial = profile.fullName.trim().charAt(0).toUpperCase() || 'R';
  return (
    <View style={styles.identity}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        onPress={onEdit}
        hitSlop={8}
        style={({pressed}) => [styles.avatarWrap, pressed && styles.pressed]}>
        {profile.avatarUrl ? (
          <Image source={{uri: profile.avatarUrl}} style={styles.avatarImage} />
        ) : (
          <Gradient colors={gradients.avatar} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.avatar}>
            <AppText weight="900" size={30} color={colors.white}>
              {initial}
            </AppText>
          </Gradient>
        )}
        <View style={styles.cameraBadge}>
          <Icon name="cam" size={13} color={colors.navy} />
        </View>
      </Pressable>
      <View style={styles.identityCopy}>
        <AppText weight="900" size={20} color={colors.navy} center numberOfLines={1}>
          {profile.fullName}
        </AppText>
        <AppText size={11.5} color={colors.text2} center>
          Learner · Member since {memberYear(profile.memberSince)}
        </AppText>
        {profile.batchId ? (
          <AppText size={11} weight="700" color={colors.text2} center>
            Batch {profile.batchId}
          </AppText>
        ) : null}
        {profile.currentlyLearning ? (
          <View style={styles.learningPill}>
            <View style={styles.learningDot} />
            <AppText size={10.5} weight="700" color={colors.activeBlue} numberOfLines={1}>
              Learning {profile.currentlyLearning}
            </AppText>
          </View>
        ) : null}
      </View>
      <ClayButton label="Edit Profile" tone="ghost" compact icon="edit" onPress={onEdit} />
    </View>
  );
}

function SectionTitle({children}: {children: React.ReactNode}) {
  return (
    <AppText weight="900" size={15} color={colors.navy} style={styles.sectionTitle}>
      {children}
    </AppText>
  );
}

function Stat({value, label, variant}: {value: number; label: string; variant: ClayVariant}) {
  return (
    <ClayCard variant={variant} style={styles.stat}>
      <AppText weight="900" size={20} color={colors.navy}>
        {value}
      </AppText>
      <AppText size={10.5} weight="700" color={colors.text2} center>
        {label}
      </AppText>
    </ClayCard>
  );
}

function Achievement({label, icon, variant}: {label: string; icon: IconName; variant: ClayVariant}) {
  return (
    <ClayCard variant={variant} style={styles.achievement}>
      <Icon name={icon} size={23} color={clay[variant].icon} />
      <AppText size={10} weight="800" color={colors.navy} center numberOfLines={2} style={styles.achievementLabel}>
        {label}
      </AppText>
    </ClayCard>
  );
}

function AccountRow({label, subtitle, icon, variant, onPress}: MenuRow) {
  return (
    <ClayCard variant="white" onPress={onPress} style={styles.menuCard}>
      <View style={styles.row}>
        <View style={[styles.menuIcon, {backgroundColor: clay[variant].bg}]}>
          <Icon name={icon} size={18} color={clay[variant].icon} />
        </View>
        <View style={styles.rowCopy}>
          <AppText weight="800" size={13.5} color={colors.navy} numberOfLines={1}>
            {label}
          </AppText>
          <AppText size={10.5} color={colors.text2} numberOfLines={1} style={styles.rowSubtitle}>
            {subtitle}
          </AppText>
        </View>
        <Icon name="chev" size={15} color="#B0BEC5" />
      </View>
    </ClayCard>
  );
}

function AdmitCardBanner({document, onPress}: {document: IssuedDocument; onPress: () => void}) {
  const details = [document.details.semester, document.details.examDate, document.details.venue].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View admit card"
      onPress={onPress}
      style={({pressed}) => [styles.bannerPressable, pressed && styles.pressed]}>
      <Gradient colors={['#311B92', '#4527A0', '#5E35B1']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.banner}>
        <View style={styles.bannerGlow} />
        <View style={styles.bannerCopy}>
          <View style={styles.adminPill}>
            <AppText size={8.5} weight="900" color="#5D4037" style={styles.adminPillText}>
              ADMIN ISSUED
            </AppText>
          </View>
          <AppText weight="900" size={17} color={colors.white}>
            Admit Card Ready!
          </AppText>
          <View style={styles.bannerDetail}>
            <Icon name="cal" size={13} color="#D1C4E9" />
            <AppText size={10.5} color="#EDE7F6" numberOfLines={2} style={styles.bannerDetailText}>
              {details || document.title}
            </AppText>
          </View>
          <View style={styles.bannerButton}>
            <AppText weight="800" size={11} color="#4A148C">
              View Admit Card
            </AppText>
            <Icon name="chev" size={12} color="#4A148C" />
          </View>
        </View>
        <View style={styles.qrWrap}>
          <Icon name="qr" size={72} color="#FFD54F" />
        </View>
      </Gradient>
    </Pressable>
  );
}
