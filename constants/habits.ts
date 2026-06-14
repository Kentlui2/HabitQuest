// constants/habits.ts
import { COLORS } from '@/constants/theme'

export type Habit = {
    id: string
    title: string
    description: string | null
    difficulty: 'easy' | 'medium' | 'hard'
    stat_type: 'strength' | 'intelligence' | 'vitality' | 'dexterity' | 'wisdom'
    frequency: string
    xp_reward: number
    gold_reward: number
    is_archived: boolean
    icon_emoji: string
    done_today: boolean
}

export const DIFFICULTIES = [
    { key: 'easy', label: 'Easy', xp: 20, gold: 5, color: COLORS.success },      // Teal
    { key: 'medium', label: 'Medium', xp: 50, gold: 15, color: COLORS.warning }, // Amber
    { key: 'hard', label: 'Hard', xp: 100, gold: 30, color: COLORS.danger },    // Red
] as const

export const STATS = [
    { key: 'strength', label: 'STR', icon: '💪' },
    { key: 'intelligence', label: 'INT', icon: '📚' },
    { key: 'vitality', label: 'VIT', icon: '🧘' },
    { key: 'dexterity', label: 'DEX', icon: '⚡' },
    { key: 'wisdom', label: 'WIS', icon: '🌿' },
] as const

export const FILTERS = ['All', 'Today', 'Done'] as const

// ── RPG REWARD ENGINE ────────────────────────────────────────────────
/**
 * Rolls dynamic quest rewards based on the baseline configuration values.
 * Applies a random swing modifier to make loot drops feel unique.
 */
export const rollQuestRewards = (difficultyKey: 'easy' | 'medium' | 'hard') => {
    // Find the current difficulty configuration layer safely
    const config = DIFFICULTIES.find((d) => d.key === difficultyKey) || DIFFICULTIES[1] // Default to medium fallback

    // Min/Max multipliers (e.g., 80% to 130% of the baseline reward values)
    const MIN_MODIFIER = 0.8
    const MAX_MODIFIER = 1.3

    const calculateLoot = (baseValue: number): number => {
        const min = Math.floor(baseValue * MIN_MODIFIER)
        const max = Math.floor(baseValue * MAX_MODIFIER)
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    return {
        xpGained: calculateLoot(config.xp),
        goldGained: calculateLoot(config.gold),
    }
}