// app/(tabs)/quests.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, SafeAreaView, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import MysteryQuestCard from '@/components/quests/MysteryQuestCard'
import QuestSkeleton from '@/components/quests/QuestSkeleton'
import { fetchQuestsWithProgress } from '@/lib/quest'
import QuestTabItem from '@/components/quests/QuestTabItem'
import * as Haptics from 'expo-haptics'
import { COLORS } from '@/constants/theme'
import LevelUpModal from '@/components/ui/LevelUpModal'
import { useHero } from '@/context/HeroContext'
import { awardHeroRewards } from '@/lib/hero'

type QuestWithProgress = {
  id: string
  title: string
  description?: string
  icon_emoji: string
  xp_reward: number
  gold_reward: number
  target_count: number
  starts_at: string
  ends_at: string
  progress: number
  is_completed: boolean
  claimed_at?: string | null
  reward_item_id?: string // Added to interface
}

export default function QuestsScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active')
  const [quests, setQuests] = useState<QuestWithProgress[]>([])

  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number, class: string } | null>(null)
  
  const { refresh: refreshHeroContext } = useHero()

  const loadQuests = useCallback(async (isRefreshing = false) => {
    if (!user) return
    if (!isRefreshing) setLoading(true)

    try {
      const data = await fetchQuestsWithProgress(user.id)
      setQuests(data as QuestWithProgress[])
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    loadQuests()
  }, [loadQuests])

  const onRefresh = () => {
    setRefreshing(true)
    loadQuests(true)
  }

  const filteredQuests = useMemo(() => {
    return quests.filter(q =>
      activeTab === 'Active' ? !q.claimed_at : !!q.claimed_at
    )
  }, [quests, activeTab])

  const handleClaim = async (questId: string) => {
    if (!user) return
    const quest = quests.find(q => q.id === questId)
    if (!quest || !quest.is_completed || quest.claimed_at) return

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const now = new Date().toISOString()

    // 1. Optimistic UI Update
    setQuests(prev => prev.map(q =>
      q.id === questId ? { ...q, claimed_at: now } : q
    ))

    try {
      // 2. Mark quest as claimed in progress table
      const { error: upError } = await supabase
        .from('quest_progress')
        .update({ claimed_at: now })
        .eq('quest_id', questId)
        .eq('user_id', user.id)
      if (upError) throw upError

      // 3. Update stats (XP/Gold) using helper
      const { leveledUp, newLevel } = await awardHeroRewards(user.id, quest.xp_reward, quest.gold_reward)

      // 4. Fetch Hero class for modal and inventory
      const { data: hero } = await supabase
        .from('heroes')
        .select('id, class')
        .eq('user_id', user.id)
        .single()

      // TRIGGER LEVEL UP MODAL
      if (leveledUp && hero) {
        setLevelUpData({
          level: newLevel,
          class: hero.class || 'warrior'
        })
        setShowLevelUp(true)
      }

      // 5. Grant Item Reward
      if (quest.reward_item_id && hero) {
        const { error: invError } = await supabase
          .from('inventory')
          .insert({
            hero_id: hero.id,
            item_id: quest.reward_item_id
          });
        if (invError) console.error("Failed to grant item:", invError);
      }

      // 6. Refresh context stats
      await refreshHeroContext()

    } catch (error) {
      console.error("Claim failed:", error)
      setQuests(prev => prev.map(q =>
        q.id === questId ? { ...q, claimed_at: null } : q
      ))
      Alert.alert("Network Error", "Reward could not be claimed. Please try again.")
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Side Quests</Text>
            <Text style={styles.headerSub}>TAKE A BREAK AND DO SOME QUESTS 🤘</Text>
          </View>
          <QuestSkeleton />
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Side Quests</Text>
          <Text style={styles.headerSub}>TAKE A BREAK AND DO SOME QUESTS 🤘</Text>
        </View>

        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {(['Active', 'Completed'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setActiveTab(tab)
                }}
                activeOpacity={0.9}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab === 'Active' ? 'ACTIVE QUESTS' : 'ARCHIVE'}
                </Text>
                {tab === 'Active' && quests.filter(q => q.is_completed && !q.claimed_at).length > 0 && (
                  <View style={styles.dot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {activeTab === 'Active' && (
            <View style={styles.mysterySectionContainer}>
              <Text style={styles.sectionLabel}>Spontaneous Anomalies</Text>
              <MysteryQuestCard />
              <Text style={styles.sectionLabel}>Active Side Quests</Text>
            </View>
          )}

          {filteredQuests.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name={activeTab === 'Active' ? "map-outline" : "checkmark-done-sharp"}
                size={52}
                color="rgba(255, 255, 255, 0.15)"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'Active' ? 'NO ACTIVE MISSIONS' : 'MISSION LOG EMPTY'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'Active'
                  ? 'CHECK BACK LATER FOR NEW ASSIGNMENTS'
                  : 'NO COMPLETED RECORDS FOUND IN THIS SECTOR'}
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredQuests.map(quest => (
                <QuestTabItem
                  key={quest.id}
                  quest={quest}
                  onClaim={handleClaim}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* MODAL LAYER */}
      <LevelUpModal
        visible={showLevelUp}
        level={levelUpData?.level ?? 0}
        heroClass={levelUpData?.class ?? 'warrior'}
        onClose={() => setShowLevelUp(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060B13' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5, marginTop: 2 },
  tabBarContainer: { paddingHorizontal: 24, marginTop: 12, marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.outlineVariant },
  tab: { flex: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 9, gap: 6 },
  activeTab: { backgroundColor: COLORS.surface2 },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.5 },
  activeTabText: { color: COLORS.primary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 110 },
  mysterySectionContainer: { gap: 14, marginBottom: 4, width: '100%' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 6, marginBottom: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: '-1%', width: '102%' },
  empty: { marginTop: 40, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40, width: '100%' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  emptySub: { fontSize: 13, fontWeight: '500', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', lineHeight: 18 },
})