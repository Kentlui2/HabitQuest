import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

import Podium from '@/components/leaderboard/Podium'
import RankRow from '@/components/leaderboard/RankRow'
import MyRankCard from '@/components/leaderboard/MyRankCard'

type LeaderboardEntry = {
  user_id: string
  rank: number
  hero_name: string
  class: string
  level: number
  xp_earned: number
  username: string
}

export default function LeaderboardScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<'squad' | 'global'>('global')
  const [activeTab, setActiveTab] = useState<'ladder' | 'hallOfFame'>('ladder')
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    fetchLeaderboardData()
  }, [filterMode])

  const fetchUserFallbackMetrics = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('name, class, level, weekly_xp')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !data) return

      setCurrentUserRank({
        user_id: user.id,
        rank: 999,
        hero_name: data.name ?? 'YOU',
        class: data.class ?? 'warrior',
        level: data.level ?? 1,
        xp_earned: data.weekly_xp ?? 0,
        username: 'YOU',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLeaderboardData = async () => {
    if (!user) return
    setLoading(true)
    try {
      setCurrentUserRank(null)

      if (filterMode === 'global') {
        const { data, error } = await supabase
          .from('leaderboard_cache')
          .select(`
            user_id, xp_earned,
            heroes ( name, class, level ),
            profiles ( username )
          `)
          .order('xp_earned', { ascending: false })
          .limit(100)

        if (error) throw error

        const parsed = (data || []).map((item: any, index) => {
          const hero = Array.isArray(item.heroes) ? item.heroes[0] : item.heroes
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
          return {
            user_id: item.user_id,
            rank: index + 1,
            hero_name: hero?.name ?? 'Unknown Hero',
            class: hero?.class ?? 'warrior',
            level: hero?.level ?? 1,
            xp_earned: item.xp_earned ?? 0,
            username: profile?.username ?? 'Anonymous',
          }
        })
        setRankings(parsed)
        const me = parsed.find((p) => p.user_id === user.id)
        if (me) setCurrentUserRank(me)
        else await fetchUserFallbackMetrics()
      } else {
        const { data: currentHero, error: heroError } = await supabase
          .from('heroes')
          .select('guild_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (heroError || !currentHero?.guild_id) {
          setRankings([])
          return
        }

        const { data, error } = await supabase
          .from('heroes')
          .select('user_id, name, class, level, weekly_xp')
          .eq('guild_id', currentHero.guild_id)
          .order('weekly_xp', { ascending: false })

        if (error) throw error

        const parsedAllies = (data || []).map((item: any, index) => ({
          user_id: item.user_id,
          rank: index + 1,
          hero_name: item.name ?? 'Hero',
          class: item.class ?? 'warrior',
          level: item.level ?? 1,
          xp_earned: item.weekly_xp ?? 0,
          username: 'SQUAD',
        }))
        setRankings(parsedAllies)
        const me = parsedAllies.find((p) => p.user_id === user.id)
        if (me) setCurrentUserRank(me)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cleanRankings = Array.isArray(rankings) ? rankings : []
  const podiumData = cleanRankings.slice(0, 3)

  // 🛡️ HCI Optimization: Filter out current user from scrolling list to eliminate duplication
  const ladderData = cleanRankings.filter(item => item.user_id !== user?.id)

  // Calculate metrics for user tracking panel
  const targetPlayer = cleanRankings.find(item => currentUserRank && item.rank === currentUserRank.rank - 1)
  const xpDifference = targetPlayer && currentUserRank ? targetPlayer.xp_earned - currentUserRank.xp_earned : 0

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeContainer}>

        {/* ACTION BAR */}
        <View style={styles.headerRow}>
          {/* Modified to explicitly push straight back into the guild tab segment context */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/guild')}
          >
            <Ionicons name="arrow-back-sharp" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>THE ARENA</Text>
            <Text style={styles.headerSub}>WEEKLY RESET // 2D 04H</Text>
          </View>

          {/* Matchmaking Filter Toggle Button */}
          <TouchableOpacity
            style={styles.filterToggleBtn}
            onPress={() => setFilterMode(filterMode === 'global' ? 'squad' : 'global')}
          >
            <Ionicons
              name={filterMode === 'global' ? "globe-outline" : "shield-half-outline"}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.filterToggleText}>{filterMode.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* NAVIGATION SEGMENT INTERFACE */}
        <View style={styles.tabTrack}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ladder' && styles.activeTabBtn]}
            onPress={() => setActiveTab('ladder')}
          >
            <Text style={[styles.tabText, activeTab === 'ladder' && styles.activeTabText]}>
              COMPETITIVE LADDER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'hallOfFame' && styles.activeTabBtn]}
            onPress={() => setActiveTab('hallOfFame')}
          >
            <Text style={[styles.tabText, activeTab === 'hallOfFame' && styles.activeTabText]}>
              HALL OF FAME
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : activeTab === 'hallOfFame' ? (
          /* DISPLAY DOMAIN: PLATFORM HALL OF FAME */
          <View style={styles.podiumViewContainer}>
            {podiumData.length > 0 ? (
              <Podium entries={podiumData} />
            ) : (
              <Text style={styles.emptyText}>No podium contenders records found.</Text>
            )}
            {currentUserRank && (
              <View style={styles.podiumStatusContainer}>
                <Text style={styles.statusLabel}>YOUR ARCHIVED RANKING</Text>
                <MyRankCard rankData={currentUserRank} />
              </View>
            )}
          </View>
        ) : (
          /* DISPLAY DOMAIN: COMPETITIVE SCROLL FEED */
          <View style={{ flex: 1 }}>
            <FlatList
              data={ladderData}
              keyExtractor={(item, index) => item.user_id || index.toString()}
              contentContainerStyle={styles.scrollList}
              showsVerticalScrollIndicator={false}

              ListHeaderComponent={
                currentUserRank ? (
                  <View style={styles.stickyHeaderCardWrap}>
                    <Text style={styles.stickyLabel}>YOUR COMPETITIVE STANDING</Text>
                    <MyRankCard rankData={currentUserRank} nextRankXpGap={xpDifference} />
                    <View style={styles.dividerLine} />
                  </View>
                ) : null
              }

              ListEmptyComponent={
                <Text style={styles.emptyText}>No combat profiles indexed within this matchmaking filter.</Text>
              }

              renderItem={({ item }) => (
                <RankRow
                  rank={item.rank}
                  heroName={item.hero_name}
                  heroClass={item.class}
                  level={item.level}
                  xp={item.xp_earned}
                  username={item.username}
                  isCurrentUser={false} // Since user is isolated directly inside header component layout, this is always false
                />
              )}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeContainer: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterToggleText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.text,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginHorizontal: SPACING.lg,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  activeTabBtn: {
    backgroundColor: COLORS.surface2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  podiumViewContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  podiumStatusContainer: {
    marginBottom: 20,
    gap: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  stickyHeaderCardWrap: {
    marginBottom: 12,
  },
  stickyLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 8,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.dim,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 40,
  },
})