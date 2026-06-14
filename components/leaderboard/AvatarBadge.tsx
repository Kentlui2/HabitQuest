import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/theme'

const CLASS_COLOR: Record<string, string> = {
    warrior: COLORS.danger,     // Crimson/Red
    mage: COLORS.primary,       // Deep Blue / Electric Sky
    rogue: COLORS.secondary,   // Neon Cyan / Emerald Green
    paladin: COLORS.warning || '#FBBF24', // Amber/Yellow token with clean fallback
}

const CLASS_EMOJI: Record<string, string> = {
    warrior: '⚔️',
    mage: '🔮',
    rogue: '🗡️',
    paladin: '🛡️',
}

const RANK_COLORS = ['#FFD700', '#E2E8F0', '#CD7F32'] // High-fidelity gold, silver, bronze tokens matching Podium
const RANK_CROWNS = ['👑', '🥈', '🥉']

type Props = {
    heroClass: string
    size?: number
    rank?: number
}

export default function AvatarBadge({ heroClass, size = 48, rank }: Props) {
    const coreColor = CLASS_COLOR[heroClass] || COLORS.primary

    return (
        <View style={[styles.avatarBadge, {
            width: size,
            height: size,
            backgroundColor: COLORS.surface2, // Solid theme surface instead of unreliable string modifications
            borderColor: coreColor,
        }]}>
            <Text style={{ fontSize: size * 0.45 }}>
                {CLASS_EMOJI[heroClass] || '⚔️'}
            </Text>

            {rank && rank <= 3 && (
                <View style={[styles.crownBadge, { backgroundColor: RANK_COLORS[rank - 1] }]}>
                    <Text style={{ fontSize: 10 }}>{RANK_CROWNS[rank - 1]}</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    avatarBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 99,
    },
    crownBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.background, // Sinks naturally into the background core canvas layer
    },
})