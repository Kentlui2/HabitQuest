// components/home/HabitSection.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { incrementStreakIfNeeded } from '@/lib/streak'
import { useHero } from '@/context/HeroContext'
import { awardHeroRewards } from '@/lib/hero'
import HabitRow from '@/components/home/HabitRow'
import HabitSkeleton from '@/components/home/HabitSkeleton'
import LevelUpModal from '@/components/ui/LevelUpModal'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'

type HabitEntry = {
  id: string
  title: string
  xp_reward: number
  gold_reward: number
  difficulty?: string
  done: boolean
}

type LevelUpData = { level: number; heroClass: string } | null

export default function HabitSection({ refreshTick }: { refreshTick?: number }) {
  const { user } = useAuth()
  const [habits, setHabits] = useState<HabitEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [levelUpData, setLevelUpData] = useState<LevelUpData>(null)
  const { refresh: refreshHeroContext } = useHero()

  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchHabits()
    }
  }, [user, refreshTick])

  const fetchHabits = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('id, title, xp_reward, gold_reward, difficulty')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })

    if (habitsError) {
      console.log('HabitSection fetch error:', habitsError.message)
      setLoading(false)
      return
    }

    if (!habitsData) {
      setLoading(false)
      return
    }

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('log_date', today)

    const doneIds = new Set(logsData?.map((l) => l.habit_id) || [])

    const allHabits = habitsData.map((h) => ({
      ...h,
      done: doneIds.has(h.id),
    }))

    const uncompleted = allHabits.filter((h) => !h.done).slice(0, 5)

    setHabits(uncompleted)
    setLoading(false)
  }

  const toggleHabit = async (habit: HabitEntry) => {
    if (habit.done || !user) return

    setHabits((prev) => prev.filter((h) => h.id !== habit.id))
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    const { data: rawHero } = await supabase
      .from('heroes')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!rawHero) return

    const hero = await incrementStreakIfNeeded(user.id, rawHero)
    const mult =
      hero.current_streak >= 30 ? 2
        : hero.current_streak >= 7 ? 1.5
          : hero.current_streak >= 3 ? 1.25
            : 1

    const today = new Date().toISOString().split('T')[0]
    const xpG = Math.round(habit.xp_reward * mult)
    const goldG = Math.round(habit.gold_reward * mult)

    await supabase.from('habit_logs').insert({
      habit_id: habit.id,
      user_id: user.id,
      log_date: today,
      xp_granted: xpG,
      gold_granted: goldG,
      multiplier: mult,
    })

    try {
      const { leveledUp, newLevel } = await awardHeroRewards(user.id, xpG, goldG)
      if (leveledUp) {
        setLevelUpData({ level: newLevel, heroClass: hero.class || 'warrior' })
      }
      await refreshHeroContext()
    } catch (err) {
      console.error('Error awarding habit rewards in home page:', err)
    }
  }

  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'easy': return COLORS.success
      case 'medium': return COLORS.warning
      case 'hard': return COLORS.danger
      default: return COLORS.dim
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TODAY'S QUESTS</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/habits')}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>VIEW LOG</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.dim ?? '#64748B'} />
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {loading ? (
          <HabitSkeleton />
        ) : habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚔️</Text>
            <Text style={styles.emptyTitle}>NO ACTIVE QUESTS</Text>
            <TouchableOpacity
              style={styles.emptyCTA}
              onPress={() => router.push('/(tabs)/habits')}
            >
              <Text style={styles.emptyCTAText}>ADD NEW HABIT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                title={h.title}
                xp={h.xp_reward}
                gold={h.gold_reward}
                difficultyColor={getDifficultyColor(h.difficulty)}
                completed={h.done}
                onPress={() => toggleHabit(h)}
              />
            ))}
          </View>
        )}
      </View>

      <LevelUpModal
        visible={levelUpData !== null}
        level={levelUpData?.level ?? 1}
        heroClass={levelUpData?.heroClass ?? 'warrior'}
        onClose={() => setLevelUpData(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.dim,
    letterSpacing: 2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  seeAllText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.outline,
    overflow: 'hidden',
  },
  list: { gap: 0 },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1
  },
  emptyCTA: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCTAText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1
  },
})