import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import AvatarBadge from './AvatarBadge'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

interface RankRowProps {
    rank: number
    heroName: string
    heroClass: string
    level: number
    xp: number
    username: string
    isCurrentUser?: boolean
}

export default function RankRow({
    rank,
    heroName,
    heroClass,
    level,
    xp,
    username,
    isCurrentUser = false
}: RankRowProps) {

    // Safely parse name data string for layout presentation
    const displayHeroName = (heroName || 'Unknown Adventurer').toUpperCase()
    const displayPlayerMeta = username === 'SQUAD'
        ? heroClass.toUpperCase()
        : `${username.toUpperCase()} · LVL ${level}`

    return (
        <View style={[
            styles.rowContainer,
            isCurrentUser && styles.currentUserRow
        ]}>
            {/* RANK POSITION NUMBER */}
            <Text style={[
                styles.rankText,
                isCurrentUser && styles.currentUserText
            ]}>
                #{rank || '-'}
            </Text>

            {/* CLASS COMPONENT AVATAR INSULATION */}
            <View style={styles.avatarContainer}>
                <AvatarBadge heroClass={heroClass || 'warrior'} size={34} />
            </View>

            {/* CORE META LABELS */}
            <View style={styles.mainInfo}>
                <Text style={styles.nameText} numberOfLines={1}>
                    {displayHeroName}
                </Text>
                <Text style={styles.subText} numberOfLines={1}>
                    {displayPlayerMeta}
                </Text>
            </View>

            {/* HIGH FIDELITY XP VALUE */}
            <Text style={styles.xpText}>
                {(xp || 0).toLocaleString()} XP
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 4,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.outlineVariant,
    },
    currentUserRow: {
        backgroundColor: COLORS.surface3 || COLORS.surface2,
        borderColor: COLORS.primary, // Electric Sky Blue accent framework boundary
    },
    rankText: {
        fontSize: 13,
        fontWeight: '900',
        color: COLORS.dim,
        width: 34,
    },
    currentUserText: {
        color: COLORS.primary,
    },
    avatarContainer: {
        marginRight: 12,
    },
    mainInfo: {
        flex: 1,
        gap: 1,
    },
    nameText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.text,
    },
    subText: {
        fontSize: 10,
        color: COLORS.dim,
        fontWeight: '600',
    },
    xpText: {
        fontSize: 13,
        fontWeight: '900',
        color: COLORS.secondary, // Clean execution using Neon Cyan token
    },
})