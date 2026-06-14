// components/quests/MysteryQuestCard.tsx
import React, { useState, useRef, useEffect } from 'react'
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/context/AuthContext'
import { fetchTodayMysteryQuest, completeMysteryQuest, MysteryQuest } from '@/lib/quest'
import { COLORS } from '@/constants/theme'
import { useHero } from '@/context/HeroContext'

export default function MysteryQuestCard() {
    const { user } = useAuth()
    const { refresh: refreshHeroContext } = useHero()
    const [quest, setQuest] = useState<MysteryQuest | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFlipped, setIsFlipped] = useState(false)
    const [completing, setCompleting] = useState(false)

    const fadeAnim = useRef(new Animated.Value(1)).current

    useEffect(() => {
        if (!user) return
        loadQuest()
    }, [user])

    const loadQuest = async () => {
        setLoading(true)
        try {
            const data = await fetchTodayMysteryQuest(user!.id)
            setQuest(data)
            // If already rolled and has progress, show it revealed
            if (data?.is_completed || (data && data.daily_mystery_id)) {
                setIsFlipped(true)
            }
        } catch (err) {
            console.error('MysteryQuestCard load error:', err)
        } finally {
            setLoading(false)
        }
    }

    const triggerReveal = () => {
        if (isFlipped || !quest) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setIsFlipped(true)
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
        })
    }

    const handleComplete = async () => {
        if (!quest || quest.is_completed || !quest.daily_mystery_id || completing) return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setCompleting(true)

        // Optimistic update
        setQuest(prev => prev ? { ...prev, is_completed: true } : prev)

        const result = await completeMysteryQuest(
            user!.id,
            quest.daily_mystery_id,
            quest.xp_reward,
            quest.gold_reward,
        )

        setCompleting(false)

        if (!result.success) {
            // Rollback
            setQuest(prev => prev ? { ...prev, is_completed: false } : prev)
            Alert.alert('Error', 'Could not save completion. Try again.')
            return
        }

        await refreshHeroContext()

        if (result.leveledUp) {
            Alert.alert(
                '⚡ Level Up!',
                `You reached level ${result.newLevel}! Keep going, adventurer.`
            )
        }
    }

    // ── Loading state ──────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingCard]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadingText}>Rolling today's anomaly...</Text>
            </View>
        )
    }

    // ── No quest available ─────────────────────────────────
    if (!quest) {
        return (
            <View style={[styles.container, styles.errorCard]}>
                <Ionicons name="warning-outline" size={24} color="rgba(255,255,255,0.3)" />
                <Text style={styles.errorText}>No mystery quest available today.</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {!isFlipped ? (
                /* ── UNREVEALED ──────────────────────────────────── */
                <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.cardFront} onPress={triggerReveal} activeOpacity={0.8}>
                        <View style={styles.parchmentBorder}>
                            <Ionicons name="help-buoy-outline" size={32} color="#FFD700" style={{ marginBottom: 6, opacity: 0.85 }} />
                            <Text style={styles.frontTitle}>UNMAPPED TERRITORY</Text>
                            <Text style={styles.frontSub}>Tap to reveal today's spontaneous anomaly</Text>
                            <View style={styles.lootBadge}>
                                <Text style={styles.lootText}>🎁 MYSTERY REWARD</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                /* ── REVEALED ────────────────────────────────────── */
                <Animated.View style={[
                    styles.cardBack,
                    quest.is_completed && styles.cardBackCompleted,
                    { opacity: fadeAnim },
                ]}>
                    <View style={styles.revealedContent}>

                        {/* Top row */}
                        <View style={styles.topRow}>
                            <View style={[styles.iconBox, quest.is_completed && styles.iconBoxDone]}>
                                <Text style={styles.iconText}>
                                    {quest.is_completed ? '✅' : quest.icon}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rarityLabel}>
                                    {quest.is_completed ? 'COMPLETED' : 'SPONTANEOUS ANOMALY'}
                                </Text>
                                <Text style={[styles.title, quest.is_completed && styles.textMuted]} numberOfLines={1}>
                                    {quest.title}
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={[styles.desc, quest.is_completed && styles.textMuted]}>
                            {quest.description}
                        </Text>

                        {/* Footer */}
                        <View style={styles.footerRow}>
                            <View style={styles.rewardRow}>
                                <View style={styles.rewardPill}>
                                    <Text style={styles.rewardText}>⚡ {quest.xp_reward} XP</Text>
                                </View>
                                <View style={styles.rewardPill}>
                                    <Text style={[styles.rewardText, { color: COLORS.gold }]}>💎 {quest.gold_reward}</Text>
                                </View>
                            </View>

                            {quest.is_completed ? (
                                <View style={styles.doneChip}>
                                    <Ionicons name="checkmark" size={12} color={COLORS.secondary} />
                                    <Text style={styles.doneText}>LOGGED</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.completeBtn}
                                    onPress={handleComplete}
                                    disabled={completing}
                                    activeOpacity={0.8}
                                >
                                    {completing
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.completeBtnText}>MARK COMPLETE</Text>
                                    }
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>
                </Animated.View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { height: 165, width: '100%', marginVertical: 4 },

    loadingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.outline,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: { fontSize: 12, color: COLORS.dim, fontWeight: '600' },

    errorCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.outline,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    errorText: { fontSize: 12, color: COLORS.dim, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },

    // Front
    cardFront: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderColor: `${COLORS.gold}33`,
        borderWidth: 1,
        borderRadius: 16,
        padding: 4,
    },
    parchmentBorder: {
        flex: 1,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: `${COLORS.gold}4D`,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 4,
    },
    frontTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
    frontSub: { fontSize: 11, color: COLORS.dim, textAlign: 'center', paddingHorizontal: 20 },
    lootBadge: { marginTop: 6, backgroundColor: `${COLORS.gold}1A`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    lootText: { fontSize: 10, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.5 },

    // Back
    cardBack: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderColor: `${COLORS.primary}4D`,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    cardBackCompleted: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.outline,
    },
    revealedContent: { flex: 1, justifyContent: 'space-between' },

    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${COLORS.primary}1A`, borderWidth: 1, borderColor: `${COLORS.primary}33`, alignItems: 'center', justifyContent: 'center' },
    iconBoxDone: { backgroundColor: `${COLORS.secondary}14`, borderColor: `${COLORS.secondary}33` },
    iconText: { fontSize: 20 },
    rarityLabel: { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5, marginBottom: 2 },
    title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    textMuted: { color: COLORS.dim },
    desc: { fontSize: 12, color: COLORS.dim, lineHeight: 17 },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rewardRow: { flexDirection: 'row', gap: 6 },
    rewardPill: { backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.outline },
    rewardText: { fontSize: 11, fontWeight: '700', color: COLORS.dim },

    doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.secondary}14`, borderWidth: 1, borderColor: `${COLORS.secondary}26`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    doneText: { fontSize: 10, fontWeight: '800', color: COLORS.secondary },

    completeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minWidth: 120, alignItems: 'center' },
    completeBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.text, letterSpacing: 0.3 },
})
