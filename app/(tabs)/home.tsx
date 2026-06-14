import React, { useState, useCallback, useEffect } from 'react'
import {
  ScrollView,
  View,
  StatusBar,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native'
import HeroCard from '@/components/home/HeroCard'
import HabitSection from '@/components/home/HabitSection'
import StreakRow from '@/components/home/StreakRow'
import QuestCard from '@/components/home/QuestCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { processMissedDays } from '@/lib/streak'
import { COLORS, SPACING } from '@/constants/theme'

export default function HomeScreen() {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [heroData, setHeroData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchHeroStats = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('heroes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!data) {
      setLoading(false)
      return
    }
    const updated = await processMissedDays(user.id, data)
    setHeroData(updated)
    setLoading(false)
  }

  useEffect(() => {
    fetchHeroStats()
  }, [user, refreshTick])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshTick((prev) => prev + 1)
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.secondary ?? '#00E5FF'}
            colors={[COLORS.secondary ?? '#00E5FF']}
          />
        }
      >
        {loading ? (
          <>
            <SkeletonBox style={{ height: 200, marginHorizontal: 20, borderRadius: 24 }} />
            <SkeletonStreak />
            <SkeletonQuest />
            <SkeletonHabit />
          </>
        ) : (
          <>
            <HeroCard hero={heroData} refreshTick={refreshTick} />
            {heroData && (
              <StreakRow
                currentStreak={heroData.current_streak}
                longestStreak={heroData.longest_streak}
                shields={heroData.streak_shields}
              />
            )}
            <QuestCard />
            <HabitSection refreshTick={refreshTick} />
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

// --- Skeleton Helpers ---

const SkeletonBox = ({ style }: { style: any }) => {
  const anim = React.useRef(new Animated.Value(0.3)).current
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  return <Animated.View style={[style, { opacity: anim, backgroundColor: COLORS.surface2 }]} />
}

const SkeletonStreak = () => (
  <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: COLORS.outline }}>
    {[1, 2, 3].map(i => (
      <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
        <SkeletonBox style={{ width: 40, height: 16, borderRadius: 4 }} />
        <SkeletonBox style={{ width: 30, height: 8, borderRadius: 2 }} />
      </View>
    ))}
  </View>
)

const SkeletonQuest = () => (
  <View style={{ paddingHorizontal: 20 }}>
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.outline, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonBox style={{ width: 48, height: 48, borderRadius: 12 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox style={{ width: '70%', height: 16, borderRadius: 4 }} />
          <SkeletonBox style={{ width: '90%', height: 10, borderRadius: 4 }} />
        </View>
      </View>
      <SkeletonBox style={{ width: '100%', height: 8, borderRadius: 4 }} />
    </View>
  </View>
)

const SkeletonHabit = () => (
  <View style={{ paddingHorizontal: 20 }}>
    <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.outline, overflow: 'hidden' }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, height: 52, borderBottomWidth: 1, borderColor: COLORS.outlineVariant }}>
          <SkeletonBox style={{ width: 24, height: 24, borderRadius: 6, marginRight: 16 }} />
          <SkeletonBox style={{ width: '60%', height: 12, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  </View>
)

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background }, // Deepest background
  scroll: { flex: 1 },
  scrollContent: { paddingTop: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md },
})