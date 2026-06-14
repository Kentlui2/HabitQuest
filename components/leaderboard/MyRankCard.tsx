import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, RADIUS } from '@/constants/theme'

interface MyRankCardProps {
    rankData: {
        rank?: number
        hero_name?: string
        squad_name?: string
        class?: string
        level?: number
        xp_earned?: number
        username?: string
    } | null | undefined
    nextRankXpGap?: number
}

export default function MyRankCard({ rankData, nextRankXpGap = 0 }: MyRankCardProps) {
    if (!rankData) {
        return (
            <View style={[styles.container, styles.unrankedContainer]}>
                <Text style={styles.unrankedText}>⚔️ NOT INDEXED</Text>
                <Text style={styles.subText}>Complete competitive challenges to calibrate entry.</Text>
            </View>
        )
    }

    const displayName = (rankData.hero_name || rankData.squad_name || 'Unknown').toUpperCase()
    const displaySubtitle = rankData.class
        ? `${rankData.class.toUpperCase()} · LVL ${rankData.level || 1}`
        : `SQUAD METRICS INDEX`

    return (
        <View style={styles.container}>
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{rankData?.rank || '-'}</Text>
            </View>
            <View style={styles.meta}>
                <Text style={styles.nameText}>{displayName}</Text>
                <Text style={styles.classText}>{displaySubtitle}</Text>
                {nextRankXpGap > 0 && (
                    <Text style={styles.feedbackText}>
                        🔥 {nextRankXpGap.toLocaleString()} XP TO NEXT RANK
                    </Text>
                )}
            </View>
            <Text style={styles.xpText}>
                {(rankData?.xp_earned || 0).toLocaleString()} XP
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryContainer,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: RADIUS.xl,
        padding: 16,
    },
    unrankedContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderColor: COLORS.outlineVariant,
        borderStyle: 'dashed',
        gap: 4,
    },
    unrankedText: {
        fontSize: 12,
        fontWeight: '900',
        color: COLORS.muted,
        letterSpacing: 0.5,
    },
    subText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.dim,
        textAlign: 'center',
    },
    rankBadge: { width: 44, justifyContent: 'center' },
    rankText: { fontSize: 15, fontWeight: '900', color: COLORS.primary },
    meta: { flex: 1, gap: 2 },
    nameText: { fontSize: 13, fontWeight: '800', color: COLORS.text },
    classText: { fontSize: 10, fontWeight: '700', color: COLORS.dim },
    feedbackText: {
        fontSize: 9,
        fontWeight: '800',
        color: COLORS.primary,
        marginTop: 2,
        letterSpacing: 0.2,
    },
    xpText: { fontSize: 14, fontWeight: '900', color: COLORS.secondary },
})