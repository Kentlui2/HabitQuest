import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import AvatarBadge from './AvatarBadge'
import { LeaderboardEntry } from './types'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

const RANK_COLORS = ['#FFD700', '#E2E8F0', '#CD7F32'] // High-fidelity gold, silver, bronze tokens

type Props = {
    entries: (LeaderboardEntry & { squad_name?: string; members_count?: number })[] | null | undefined
}

export default function Podium({ entries }: Props) {
    // 🛡️ Safe Guard 1: Verify entries is an active array before running calculations
    const safeEntries = Array.isArray(entries) ? entries : []
    if (safeEntries.length === 0) return null

    // Order array configuration: Left side (Rank 2), Center (Rank 1), Right side (Rank 3)
    const arranged = [safeEntries[1] || null, safeEntries[0] || null, safeEntries[2] || null]
    const heights = [100, 140, 80]
    const sizes = [52, 64, 48]

    return (
        <View style={styles.podiumContainer}>
            <View style={styles.podiumWrap}>
                {arranged.map((entry, i) => {
                    if (!entry) return <View key={`empty-${i}`} style={styles.emptyColumn} />

                    const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
                    const color = RANK_COLORS[realRank - 1]
                    const isFirst = realRank === 1

                    // 🛡️ Safe Guard 2: Handle fallback formatting for names safely
                    const rawName = entry.username || entry.squad_name || 'UNKNOWN'
                    const displayName = rawName.toUpperCase()

                    // 🛡️ Safe Guard 3: Use a fallback class/icon string if squad data is passed down
                    const resolvedClass = entry.class || 'squad'

                    return (
                        <View key={entry.user_id || `podium-${realRank}`} style={[styles.podiumEntry, isFirst && styles.podiumFirst]}>

                            {/* AVATAR ANCHOR SYSTEM - Highlight self using primary theme color */}
                            <View style={[
                                styles.podiumAvatarWrap,
                                entry.is_me && { borderColor: COLORS.primary, borderStyle: 'solid' }
                            ]}>
                                <AvatarBadge heroClass={resolvedClass} size={sizes[i]} />
                                {entry.is_me && (
                                    <View style={styles.youBadge}>
                                        <Text style={styles.youBadgeText}>ME</Text>
                                    </View>
                                )}
                            </View>

                            {/* USER META TAGS */}
                            <Text style={[styles.podiumName, { color: entry.is_me ? COLORS.primary : COLORS.text }]} numberOfLines={1}>
                                {displayName}
                            </Text>

                            <View style={[styles.podiumXP, { borderColor: COLORS.outlineVariant }]}>
                                <Text style={[styles.podiumXPText, { color }]}>
                                    {(entry.xp_earned || 0).toLocaleString()} XP
                                </Text>
                            </View>

                            {/* RENDER PEDESTAL GRAPHIC COLUMN BLOCK */}
                            <View style={[
                                styles.podiumBlock,
                                { height: heights[i], borderColor: isFirst ? color : COLORS.outlineVariant },
                                isFirst && styles.premiumFirstBlock
                            ]}>
                                <Text style={[styles.podiumRankNum, { color }]}>#{realRank}</Text>
                            </View>
                        </View>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    podiumContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.outlineVariant,
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    podiumWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12
    },
    podiumEntry: {
        flex: 1,
        alignItems: 'center'
    },
    emptyColumn: {
        flex: 1,
    },
    podiumFirst: {
        transform: [{ translateY: -12 }]
    },
    podiumAvatarWrap: {
        borderWidth: 2,
        borderColor: COLORS.outlineVariant,
        padding: 4,
        borderRadius: 99,
        position: 'relative',
        backgroundColor: COLORS.background,
        marginBottom: 8,
    },
    podiumName: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    podiumXP: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        backgroundColor: COLORS.surface2,
        borderRadius: RADIUS.sm,
        marginBottom: 10,
    },
    podiumXPText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    podiumBlock: {
        width: '100%',
        borderWidth: 1,
        backgroundColor: COLORS.surface2,
        alignItems: 'center',
        paddingTop: 12,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
    },
    premiumFirstBlock: {
        backgroundColor: COLORS.surface3 || COLORS.surface2, // Use elevated surface layer if available
    },
    podiumRankNum: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    youBadge: {
        position: 'absolute',
        bottom: -2,
        alignSelf: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: RADIUS.sm,
    },
    youBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: COLORS.text,
    },
})