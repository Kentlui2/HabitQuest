// lib/quest.ts
import { supabase } from '@/lib/supabase'

export type QuestWithProgress = {
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
  claimed_at: string | null
  days_left: number
}

export type MysteryQuest = {
  id: string
  title: string
  description: string
  icon: string
  xp_reward: number
  gold_reward: number
  is_completed: boolean
  completed_at: string | null
  daily_mystery_id: string | null
}

// ── Helpers ───────────────────────────────────────────────
function parseTargetCount(quest: any): number {
  if (quest.target_count && quest.target_count > 0) return quest.target_count
  if (quest.condition?.count) return Number(quest.condition.count)
  return 5
}

function getDaysLeft(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── Fetch weekly quests with user progress ─────────────────
export async function fetchQuestsWithProgress(userId: string): Promise<QuestWithProgress[]> {
  const now = new Date().toISOString()

  // Step 1 — get active quests
  const { data: quests, error: qError } = await supabase
    .from('quests')
    .select('*')
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('created_at', { ascending: true })

  if (qError) {
    console.error('fetchQuestsWithProgress — quests error:', qError.message)
    return []
  }
  if (!quests || quests.length === 0) {
    console.warn('fetchQuestsWithProgress — no active quests found. Check starts_at/ends_at dates.')
    return []
  }

  // Step 2 — get user progress (separate query avoids broken join filtering)
  const questIds = quests.map(q => q.id)
  const { data: progressRows, error: pError } = await supabase
    .from('quest_progress')
    .select('quest_id, progress, is_completed, claimed_at')
    .eq('user_id', userId)
    .in('quest_id', questIds)

  if (pError) console.error('fetchQuestsWithProgress — progress error:', pError.message)

  // Step 3 — build lookup map
  const progressMap: Record<string, {
    progress: number
    is_completed: boolean
    claimed_at: string | null
  }> = {}
  progressRows?.forEach(p => {
    progressMap[p.quest_id] = {
      progress: p.progress ?? 0,
      is_completed: p.is_completed ?? false,
      claimed_at: p.claimed_at ?? null,
    }
  })

  // Step 4 — merge quests + progress
  return quests.map(q => {
    const p = progressMap[q.id]
    const target = parseTargetCount(q)
    const progress = p?.progress ?? 0
    const completed = p?.is_completed ?? (progress >= target)

    return {
      id: q.id,
      title: q.title,
      description: q.description ?? undefined,
      icon_emoji: q.icon_emoji,
      xp_reward: q.xp_reward,
      gold_reward: q.gold_reward,
      target_count: target,
      starts_at: q.starts_at,
      ends_at: q.ends_at,
      progress,
      is_completed: completed,
      claimed_at: p?.claimed_at ?? null,
      days_left: getDaysLeft(q.ends_at),
    }
  })
}

// ── Increment quest progress (call on every habit completion) ──
export async function incrementActiveQuests(userId: string): Promise<void> {
  const now = new Date().toISOString()

  const { data: activeQuests, error } = await supabase
    .from('quests')
    .select('id, target_count, condition')
    .lte('starts_at', now)
    .gte('ends_at', now)

  if (error || !activeQuests?.length) return

  const questIds = activeQuests.map(q => q.id)
  const { data: progressRows } = await supabase
    .from('quest_progress')
    .select('quest_id, progress, is_completed')
    .eq('user_id', userId)
    .in('quest_id', questIds)

  const progressMap: Record<string, { progress: number; is_completed: boolean }> = {}
  progressRows?.forEach(p => { progressMap[p.quest_id] = p })

  const upserts = activeQuests
    .filter(q => !progressMap[q.id]?.is_completed)
    .map(q => {
      const current = progressMap[q.id]?.progress ?? 0
      const newProgress = current + 1
      const target = parseTargetCount(q)
      return {
        user_id: userId,
        quest_id: q.id,
        progress: newProgress,
        is_completed: newProgress >= target,
        updated_at: now,
      }
    })

  if (upserts.length > 0) {
    const { error: upsertErr } = await supabase
      .from('quest_progress')
      .upsert(upserts, { onConflict: 'user_id,quest_id' })
    if (upsertErr) console.error('incrementActiveQuests error:', upsertErr.message)
  }
}

// ── Fetch today's mystery quest for a user ─────────────────
// If none rolled yet → picks one deterministically from the pool.
// Same quest sticks for the whole day, resets at midnight.
export async function fetchTodayMysteryQuest(userId: string): Promise<MysteryQuest | null> {
  const today = new Date().toISOString().split('T')[0]

  // Check if already rolled today
  const { data: existing } = await supabase
    .from('daily_mystery')
    .select('id, is_completed, completed_at, mystery_quest_id, mystery_quests(*)')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    const mq = existing.mystery_quests as any
    if (!mq) return null
    return {
      id: mq.id,
      title: mq.title,
      description: mq.description,
      icon: mq.icon,
      xp_reward: mq.xp_reward,
      gold_reward: mq.gold_reward,
      is_completed: existing.is_completed,
      completed_at: existing.completed_at ?? null,
      daily_mystery_id: existing.id,
    }
  }

  // Not rolled yet — fetch the full pool
  const { data: pool, error: poolErr } = await supabase
    .from('mystery_quests')
    .select('*')
    .eq('is_active', true)

  if (poolErr || !pool || pool.length === 0) {
    console.error('fetchTodayMysteryQuest — pool empty or error:', poolErr?.message)
    return null
  }

  // Deterministic seed: date string + userId chars
  let seed = 0
  const seedStr = today + userId
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i)
  const picked = pool[seed % pool.length]

  // Save roll to DB — if another request races, ignore the conflict
  const { data: inserted, error: insertErr } = await supabase
    .from('daily_mystery')
    .insert({
      user_id: userId,
      mystery_quest_id: picked.id,
      date: today,
      is_completed: false,
    })
    .select('id')
    .maybeSingle()

  if (insertErr) {
    console.error('fetchTodayMysteryQuest — insert error:', insertErr.message)
    return null
  }

  return {
    id: picked.id,
    title: picked.title,
    description: picked.description,
    icon: picked.icon,
    xp_reward: picked.xp_reward,
    gold_reward: picked.gold_reward,
    is_completed: false,
    completed_at: null,
    daily_mystery_id: inserted?.id ?? null,
  }
}

// ── Complete today's mystery quest ─────────────────────────
export async function completeMysteryQuest(
  userId: string,
  dailyMysteryId: string,
  xpReward: number,
  goldReward: number
): Promise<{ success: boolean; leveledUp: boolean; newLevel: number }> {
  const now = new Date().toISOString()

  const { error: completeErr } = await supabase
    .from('daily_mystery')
    .update({ is_completed: true, completed_at: now })
    .eq('id', dailyMysteryId)
    .eq('user_id', userId)

  if (completeErr) {
    console.error('completeMysteryQuest error:', completeErr.message)
    return { success: false, leveledUp: false, newLevel: 1 }
  }

  const { data: hero } = await supabase
    .from('heroes')
    .select('xp, gold, level, xp_to_next')
    .eq('user_id', userId)
    .single()

  if (!hero) return { success: true, leveledUp: false, newLevel: 1 }

  // ── FIX: Using a while loop to handle multiple level-ups ──
  let currentXP = hero.xp + xpReward
  let newGold = hero.gold + goldReward
  let currentLevel = hero.level
  let nextLevelXP = hero.xp_to_next
  let leveledUp = false

  // Continue leveling up as long as the current XP is enough for the next level
  while (currentXP >= nextLevelXP) {
    currentXP -= nextLevelXP // Consume XP required for this level
    currentLevel += 1
    nextLevelXP = Math.round(100 * Math.pow(currentLevel, 1.5))
    leveledUp = true
  }

  await supabase
    .from('heroes')
    .update({
      xp: currentXP,
      gold: newGold,
      level: currentLevel,
      xp_to_next: nextLevelXP
    })
    .eq('user_id', userId)

  return { success: true, leveledUp, newLevel: currentLevel }
}