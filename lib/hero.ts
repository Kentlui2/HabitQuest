import { supabase } from '@/lib/supabase'

export async function awardHeroRewards(
  userId: string,
  xpGained: number,
  goldGained: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
  // 1. Fetch current hero stats
  const { data: hero, error } = await supabase
    .from('heroes')
    .select('xp, gold, level, xp_to_next')
    .eq('user_id', userId)
    .single()

  if (error || !hero) {
    throw error || new Error('Hero not found')
  }

  // 2. Calculate new stats and level ups
  let currentXP = (hero.xp ?? 0) + xpGained
  let newGold = (hero.gold ?? 0) + goldGained
  let currentLevel = hero.level ?? 1
  let nextLevelXP = hero.xp_to_next ?? 100
  let leveledUp = false

  while (currentXP >= nextLevelXP) {
    currentXP -= nextLevelXP
    currentLevel += 1
    nextLevelXP = Math.round(100 * Math.pow(currentLevel, 1.5))
    leveledUp = true
  }

  // 3. Update database
  const { error: updateError } = await supabase
    .from('heroes')
    .update({
      xp: currentXP,
      gold: newGold,
      level: currentLevel,
      xp_to_next: nextLevelXP,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw updateError
  }

  return { leveledUp, newLevel: currentLevel }
}
