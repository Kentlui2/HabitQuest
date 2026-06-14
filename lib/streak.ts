import { supabase } from '@/lib/supabase'

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export async function processMissedDays(userId: string, hero: any) {
  if (!hero) return hero

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('log_date')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(1)

  if (!logs || logs.length === 0) return hero

  const lastLogDateStr = logs[0].log_date
  const todayStr = getTodayDateString()

  if (lastLogDateStr === todayStr) return hero

  const lastLogDate = new Date(lastLogDateStr)
  const todayDate = new Date(todayStr)

  const diffTime = Math.abs(todayDate.getTime() - lastLogDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 1) {
    const daysMissed = diffDays - 1
    const shieldsToUse = Math.min(daysMissed, hero.streak_shields)
    const newShields = hero.streak_shields - shieldsToUse
    const remainingMissed = daysMissed - shieldsToUse

    let newStreak = hero.current_streak
    if (remainingMissed > 0) {
      newStreak = 0 // Streak broken
    }

    if (newShields !== hero.streak_shields || newStreak !== hero.current_streak) {
      await supabase.from('heroes').update({
        streak_shields: newShields,
        current_streak: newStreak
      }).eq('user_id', userId)

      return { ...hero, streak_shields: newShields, current_streak: newStreak }
    }
  }

  return hero
}

export async function incrementStreakIfNeeded(userId: string, hero: any) {
  if (!hero) return hero

  const todayStr = getTodayDateString()

  // Prevent double-incrementing: check if we already updated today
  if (hero.last_streak_update === todayStr) {
    return hero;
  }

  const { count } = await supabase
    .from('habit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('log_date', todayStr)

  if (count && count > 0) {
    const newStreak = hero.current_streak + 1
    const newLongest = Math.max(hero.longest_streak, newStreak)

    await supabase.from('heroes').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_streak_update: todayStr
    }).eq('user_id', userId)

    return {
      ...hero,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_streak_update: todayStr
    }
  }

  return hero
}