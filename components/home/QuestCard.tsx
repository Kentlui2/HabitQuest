// components/home/QuestCard.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, RADIUS } from '@/constants/theme'

type QuestEntry = {
  id: string
  title: string
  description: string
  icon_emoji: string
  xp_reward: number
  gold_reward: number
  progress: number
  target: number
  ends_at: string
}

export default function QuestCard() {
  const { user } = useAuth()
  const [quest, setQuest] = useState<QuestEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchQuest()
    }
  }, [user])

  const fetchQuest = async () => {
    if (!user) return
    const now = new Date().toISOString()
    const { data: questData } = await supabase
      .from('quests')
      .select('id, title, description, icon_emoji, xp_reward, gold_reward, target_count, ends_at')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .limit(1)
      .single()

    if (!questData) { setLoading(false); return }

    const { data: progressData } = await supabase
      .from('quest_progress')
      .select('progress')
      .eq('quest_id', questData.id)
      .eq('user_id', user.id)
      .single()

    setQuest({
      ...questData,
      progress: progressData?.progress || 0,
      target: questData.target_count || 5,
    })
    setLoading(false)
  }

  if (loading || !quest) return null

  const progressPct = Math.min(quest.progress / quest.target, 1)
  const daysLeft = Math.ceil((new Date(quest.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/quests')} activeOpacity={0.9}>
        <View style={styles.topRow}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{quest.icon_emoji}</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.questTitle} numberOfLines={1}>{quest.title}</Text>
            <Text style={styles.questDesc} numberOfLines={2}>{quest.description}</Text>
          </View>
          {daysLeft <= 3 && (
            <View style={styles.daysPill}>
              <Text style={styles.daysText}>{daysLeft}D LEFT</Text>
            </View>
          )}
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{quest.progress} / {quest.target} TASKS</Text>
            <Text style={styles.progressPct}>{Math.round(progressPct * 100)}%</Text>
          </View>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progressPct * 100)}%` }]} />
          </View>
        </View>

        <View style={styles.rewardsRow}>
          <View style={styles.rewardPill}>
            <Ionicons name="flash" size={12} color={COLORS.secondary} />
            <Text style={styles.rewardText}>{quest.xp_reward} XP</Text>
          </View>
          <View style={styles.rewardPill}>
            <Ionicons name="ellipse" size={12} color={COLORS.secondary} />
            <Text style={styles.rewardText}>{quest.gold_reward} GOLD</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.dim} style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    gap: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  emoji: { fontSize: 24 },
  titleSection: { flex: 1, gap: 4 },
  questTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  questDesc: { fontSize: 11, fontWeight: '600', color: COLORS.dim, lineHeight: 16 },
  daysPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  daysText: { fontSize: 9, fontWeight: '900', color: '#FBBF24' },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 10, fontWeight: '900', color: COLORS.dim, letterSpacing: 0.8 },
  progressPct: { fontSize: 10, fontWeight: '900', color: COLORS.secondary },
  progressBarOuter: { height: 8, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 4 },
  rewardsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  rewardText: { fontSize: 10, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
})