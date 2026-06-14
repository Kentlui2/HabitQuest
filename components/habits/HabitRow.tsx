// components/habits/HabitRow.tsx
import React, { useRef } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    Alert,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Habit, STATS } from '@/constants/habits'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'

interface HabitRowProps {
    habit: Habit
    onComplete: (h: Habit, xp: number, gold: number) => void
    onDelete: (h: Habit) => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Star rating based on difficulty
const DIFFICULTY_STARS: Record<string, number> = {
    easy: 2,
    normal: 3,
    hard: 4,
    epic: 5,
}

function StarRating({ count, done }: { count: number; done: boolean }) {
    return (
        <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Text
                    key={i}
                    style={[
                        styles.star,
                        i < count ? (done ? styles.starDone : styles.starActive) : styles.starEmpty,
                    ]}
                >
                    ★
                </Text>
            ))}
        </View>
    )
}

export default function HabitRow({ habit, onComplete, onDelete }: HabitRowProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current

    const handlePressIn = () => {
        if (habit?.done_today) return
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 400, friction: 15 }).start()
    }
    const handlePressOut = () => {
        if (habit?.done_today) return
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 400, friction: 15 }).start()
    }

    const handleComplete = () => {
        if (habit?.done_today) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onComplete(habit, habit.xp_reward ?? 0, habit.gold_reward ?? 0)
    }

    const handleDeleteLongPress = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        Alert.alert(
            'Delete Habit',
            `Remove "${habit?.title || 'this quest'}" from your quests?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(habit) },
            ]
        )
    }

    const statObj = STATS?.find((s) => s.key === habit?.stat_type)
    const displayTitle = habit?.title || 'Untitled Quest'
    const displayDifficulty = habit?.difficulty ?? 'normal'
    const displayLabel = statObj?.label || 'SYSTEM'
    const displayIcon = statObj?.icon || '⚡'
    const displayXp = habit?.xp_reward || 0
    const starCount = DIFFICULTY_STARS[displayDifficulty.toLowerCase()] ?? 3

    return (
        <AnimatedPressable
            onPress={handleComplete}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleDeleteLongPress}
            delayLongPress={500}
            style={[
                styles.card,
                habit?.done_today && styles.cardDone,
                { transform: [{ scale: scaleAnim }] },
            ]}
        >
            {/* Left: circular icon */}
            <View style={[styles.iconCircle, habit?.done_today && styles.iconCircleDone]}>
                <Text style={styles.iconText}>{displayIcon}</Text>
            </View>

            {/* Center: info block */}
            <View style={styles.info}>
                <Text
                    style={[styles.title, habit?.done_today && styles.titleDone]}
                    numberOfLines={1}
                >
                    {displayTitle}
                </Text>
                <Text style={styles.metaLine}>
                    {displayLabel}  ·  +{displayXp} XP
                </Text>
                <StarRating count={starCount} done={!!habit?.done_today} />
            </View>

            {/* Right: difficulty tag + check */}
            <View style={styles.right}>
                <View style={[
                    styles.difficultyTag,
                    habit?.done_today && styles.difficultyTagDone,
                ]}>
                    <Text style={[
                        styles.difficultyText,
                        habit?.done_today && styles.difficultyTextDone,
                    ]}>
                        {displayDifficulty.toUpperCase()}
                    </Text>
                </View>
                <View style={[styles.checkCircle, habit?.done_today && styles.checkCircleDone]}>
                    {habit?.done_today && <Text style={styles.checkMark}>✓</Text>}
                </View>
            </View>
        </AnimatedPressable>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.outline,
        padding: 12,
        marginBottom: 10,
        gap: 12,
    },
    cardDone: {
        borderColor: 'rgba(0, 229, 255, 0.2)',
        backgroundColor: 'rgba(0, 229, 255, 0.04)',
        opacity: 0.75,
    },

    // Icon circle — matches inspo's circular avatar on left
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: COLORS.outline,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconCircleDone: {
        backgroundColor: 'rgba(0, 229, 255, 0.08)',
        borderColor: 'rgba(0, 229, 255, 0.25)',
    },
    iconText: {
        fontSize: 20,
    },

    // Info block
    info: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 0.1,
    },
    titleDone: {
        color: COLORS.dim,
        textDecorationLine: 'line-through',
    },
    metaLine: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.dim,
        letterSpacing: 0.3,
    },

    // Stars
    starRow: {
        flexDirection: 'row',
        gap: 1,
        marginTop: 2,
    },
    star: {
        fontSize: 11,
    },
    starActive: {
        color: COLORS.primary,
    },
    starDone: {
        color: COLORS.dim,
        opacity: 0.5,
    },
    starEmpty: {
        color: 'rgba(255,255,255,0.1)',
    },

    // Right side
    right: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
    },
    difficultyTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 77, 0, 0.12)',
    },
    difficultyTagDone: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    difficultyText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 0.8,
    },
    difficultyTextDone: {
        color: COLORS.dim,
    },

    // Check circle
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleDone: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
    },
    checkMark: {
        fontSize: 11,
        color: COLORS.background,
        fontWeight: '800',
    },
})