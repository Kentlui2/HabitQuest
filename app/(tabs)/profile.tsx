import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from '@/hooks/useProfileData';
import { useHeroStats } from '@/hooks/useHeroStats';
import { HeroStatusCard } from '@/components/profile/HeroStatusCard';
import { ProgressTracker } from '@/components/profile/ProgressTracker';
import { LoadoutGrid } from '@/components/profile/LoadoutGrid';
import { AchievementList } from '@/components/profile/AchievementList';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { heroData, equippedItems, achievements, loading, refresh } = useProfileData(user?.id);
  const totalStats = useHeroStats(heroData, equippedItems);
  const username = user?.user_metadata?.username;

  if (loading && !heroData) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Slim Hero Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{username}</Text>
          <Text style={styles.headerSub}>ID: {user?.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={16} color={C.textTertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />}
      >
        <HeroStatusCard data={heroData} totalStats={totalStats} />
        <ProgressTracker xp={heroData?.xp ?? 0} total={heroData?.xp_to_next ?? 100} />
        <LoadoutGrid items={equippedItems} />
        <AchievementList data={achievements} />

        <View style={styles.systemsGrid}>
          <TouchableOpacity style={styles.systemBtn} onPress={() => Alert.alert('Coming Soon', 'The tutorial is currently under construction.')}>
            <Ionicons name="book-outline" size={16} color={COLORS.primary} />
            <Text style={styles.systemBtnText}>TUTORIAL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.systemBtn, { borderColor: COLORS.danger }]} onPress={signOut}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.systemBtnText, { color: COLORS.danger }]}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingCenter: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: SPACING.xl, gap: SPACING.md, paddingHorizontal: SPACING.md },

  // Compact Header
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, // Reduced vertical height
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg
  },
  headerTitle: {
    fontSize: 16, // Slightly smaller title
    fontWeight: '900',
    color: C.textPrimary,
  },
  headerSub: {
    fontSize: 9, // Smaller ID text
    fontWeight: '800',
    color: C.textTertiary,
    letterSpacing: 1,
  },
  settingsBtn: {
    width: 32, // Smaller button
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md
  },

  systemsGrid: { flexDirection: 'row', gap: SPACING.sm },
  systemBtn: {
    flex: 1,
    height: 44, // Slightly shorter
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md
  },
  systemBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: C.textPrimary,
  },
});