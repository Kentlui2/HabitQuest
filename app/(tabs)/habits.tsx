// app/(tabs)/habits.tsx
//
// Fixed:
// 1. Removed duplicate FAB (layout FAB handles this now)
// 2. Subscribed to habitSheetEvents from _layout.tsx so layout FAB opens this sheet
// 3. AddHabitSheet stays here but is controlled by the event emitter
//
import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, StyleSheet, StatusBar, FlatList, Text,
  LayoutAnimation, Platform, UIManager, Pressable,
  RefreshControl, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'
import HabitRow from '@/components/habits/HabitRow'
import HabitCalendar from '@/components/habits/HabitCalendar'
import AddHabitSheet from '@/components/habits/AddHabitSheet'
import { Habit } from '@/constants/habits'
import { processMissedDays, incrementStreakIfNeeded } from '@/lib/streak'
import { incrementActiveQuests } from '@/lib/quest'

// ── Import the event emitter from layout ──────────────────
import { habitSheetEvents } from '@/app/(tabs)/_layout'
import { useHero } from '@/context/HeroContext'
import { awardHeroRewards } from '@/lib/hero'
import LevelUpModal from '@/components/ui/LevelUpModal'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const FILTERS = ['All', 'Today', 'Done']

function toDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

/* ── Skeleton ──────────────────────────────────────────── */
function HabitsSkeleton() {
  const shimmer = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={{ opacity: shimmer }}>
      <View style={skeletonStyles.calendar}>
        <View style={skeletonStyles.calendarHeader} />
        <View style={skeletonStyles.calendarGrid}>
          {Array.from({ length: 35 }).map((_, i) => (
            <View key={i} style={skeletonStyles.calendarCell} />
          ))}
        </View>
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={skeletonStyles.card}>
          <View style={skeletonStyles.icon} />
          <View style={skeletonStyles.info}>
            <View style={skeletonStyles.title} />
            <View style={skeletonStyles.meta} />
            <View style={skeletonStyles.stars} />
          </View>
          <View style={skeletonStyles.right}>
            <View style={skeletonStyles.tag} />
            <View style={skeletonStyles.check} />
          </View>
        </View>
      ))}
    </Animated.View>
  )
}

/* ── Screen ────────────────────────────────────────────── */
export default function HabitsScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [habits, setHabits] = useState<Habit[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('All')
  const [sheetVisible, setSheetVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  
  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number, class: string } | null>(null)
  
  const { refresh: refreshHeroContext } = useHero()

  const isViewingToday = selectedDate === toDateStr(new Date())

  // ── Subscribe to layout FAB events ───────────────────
  useEffect(() => {
    const unsubscribe = habitSheetEvents.subscribe(() => {
      setSheetVisible(true)
    })
    return unsubscribe
  }, [])

  /* ── Fetch Habits ──────────────────────────────────── */
  const fetchHabits = useCallback(async (isRefresh = false) => {
    if (!user) return
    if (isRefresh) setRefreshing(true)
    else setInitialLoading(true)

    try {
      const { data: rawHero } = await supabase
        .from('heroes').select('*').eq('user_id', user.id).single()
      if (rawHero) await processMissedDays(user.id, rawHero)

      const { data: habitsData } = await supabase
        .from('habits').select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })

      if (!habitsData) { setHabits([]); return }

      const { data: logs } = await supabase
        .from('habit_logs').select('habit_id')
        .eq('user_id', user.id).eq('log_date', selectedDate)

      const doneIds = new Set(logs?.map(l => l.habit_id) || [])
      setHabits(habitsData.map(h => ({ ...h, done_today: doneIds.has(h.id) })))
    } catch (err) {
      console.error('Failed to fetch habits:', err)
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [user, selectedDate])

  useEffect(() => {
    if (user) fetchHabits()
  }, [user, fetchHabits])

  /* ── Date selection ────────────────────────────────── */
  const handleSelectDate = useCallback(async (date: string) => {
    setSelectedDate(date)
    if (!user) return
    const { data: logs } = await supabase
      .from('habit_logs').select('habit_id')
      .eq('user_id', user.id).eq('log_date', date)
    const doneIds = new Set(logs?.map(l => l.habit_id) || [])
    setHabits(prev => prev.map(h => ({ ...h, done_today: doneIds.has(h.id) })))
  }, [user])

  /* ── Complete habit ────────────────────────────────── */
  const handleComplete = async (habit: Habit, xpGained: number, goldGained: number) => {
    if (habit.done_today || !user || !isViewingToday) return
    const today = toDateStr(new Date())

    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, done_today: true } : h))

    const { data: rawHero } = await supabase
      .from('heroes').select('*').eq('user_id', user.id).single()
    if (!rawHero) return

    const hero = await incrementStreakIfNeeded(user.id, rawHero)
    const mult = hero.current_streak >= 30 ? 2 : hero.current_streak >= 7 ? 1.5 : hero.current_streak >= 3 ? 1.25 : 1
    const finalXp = Math.round(xpGained * mult)
    const finalGold = Math.round(goldGained * mult)

    await supabase.from('habit_logs').insert({
      habit_id: habit.id, user_id: user.id,
      log_date: today, xp_granted: finalXp,
      gold_granted: finalGold, multiplier: mult,
    })

    try {
      const { leveledUp, newLevel } = await awardHeroRewards(user.id, finalXp, finalGold)
      if (leveledUp) {
        setLevelUpData({
          level: newLevel,
          class: hero.class || 'warrior'
        })
        setShowLevelUp(true)
      }
      await refreshHeroContext()
    } catch (err) {
      console.error('Error awarding habit rewards:', err)
    }

    const remaining = habits.filter(h => h.id !== habit.id && !h.done_today)
    if (remaining.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    await incrementActiveQuests(user.id)
  }

  /* ── Delete habit ──────────────────────────────────── */
  const handleDelete = async (habit: Habit) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHabits(prev => prev.filter(h => h.id !== habit.id))
    await supabase.from('habits').update({ is_archived: true }).eq('id', habit.id)
  }

  /* ── Save habit ────────────────────────────────────── */
  const handleSaveHabit = async (formData: any) => {
    if (!user) return

    const { data, error } = await supabase
      .from('habits')
      .insert({ ...formData, user_id: user.id, sort_order: habits.length })
      .select().single()

    if (error) { console.error('Error creating habit:', error); return }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHabits(prev => [...prev, { ...data, done_today: false }])
    setSheetVisible(false)
  }

  /* ── Filter ────────────────────────────────────────── */
  const filtered = habits.filter(h => {
    if (filter === 'Today') return !h.done_today
    if (filter === 'Done') return h.done_today
    return true
  })

  const doneCount = habits.filter(h => h.done_today).length
  const listLabel = isViewingToday
    ? `Today · ${doneCount}/${habits.length} done`
    : `${selectedDate} · ${doneCount} logged`

  /* ── Empty state ───────────────────────────────────── */
  const renderEmpty = () => {
    let emoji = '📋', title = 'LOG EMPTY', sub = 'Create a new habit to get going!'
    if (!isViewingToday) { emoji = '📡'; title = 'NO RECORDS'; sub = 'No habits were logged on this day' }
    else if (filter === 'Today') { emoji = '⚔️'; title = 'ALL DONE'; sub = 'Well done, keep going!' }
    else if (filter === 'Done') { emoji = '📡'; title = 'ALL DONE TODAY'; sub = 'Rest up and prepare for tomorrow' }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
      </View>
    )
  }

  /* ── Render ────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Filter bar */}
      <View style={[styles.filterBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.filterTrackContainer}>
          {FILTERS.map(f => {
            const isActive = filter === f
            return (
              <Pressable
                key={f}
                onPress={() => {
                  if (!isActive) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setFilter(f)
                  }
                }}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {initialLoading ? (
        <View style={styles.listContent}><HabitsSkeleton /></View>
      ) : (
        <>
          {user && (
            <HabitCalendar
              userId={user.id}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}

          <Text style={styles.sectionLabel}>{listLabel}</Text>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <HabitRow
                habit={item}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchHabits(true)}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
                progressBackgroundColor={COLORS.surface}
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        </>
      )}

      {/* AddHabitSheet — controlled by layout FAB via habitSheetEvents */}
      <AddHabitSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSave={handleSaveHabit}
      />

      <LevelUpModal
        visible={showLevelUp}
        level={levelUpData?.level ?? 1}
        heroClass={levelUpData?.class ?? 'warrior'}
        onClose={() => setShowLevelUp(false)}
      />
    </View>
  )
}

/* ── Styles ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  filterBar: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: COLORS.background },
  filterTrackContainer: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 999, borderWidth: 1, borderColor: COLORS.outline, padding: 3,
  },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  filterTextActive: { color: '#FFFFFF', fontWeight: '800' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 20, marginBottom: 12, marginTop: 6,
  },
  listContent: { paddingHorizontal: 20, paddingTop: SPACING.xs, paddingBottom: 110 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: SPACING.xs },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 1.2, textAlign: 'center' },
  emptySub: { fontSize: 12, color: COLORS.dim, marginTop: 6, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18, fontWeight: '700' },
})

const skeletonStyles = StyleSheet.create({
  calendar: { marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.outline },
  calendarHeader: { width: 140, height: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', alignSelf: 'center', marginBottom: 16 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calendarCell: { width: '13%', height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.outline, padding: 12, marginBottom: 10, gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.06)' },
  info: { flex: 1, gap: 8 },
  title: { width: '70%', height: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  meta: { width: '45%', height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },
  stars: { width: 70, height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)' },
  right: { alignItems: 'flex-end', gap: 10 },
  tag: { width: 50, height: 18, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.05)' },
})