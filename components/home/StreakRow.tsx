// components/home/StreakRow.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'

type Props = {
    currentStreak: number
    longestStreak: number
    shields: number
}

export default function StreakRow({ currentStreak, longestStreak, shields }: Props) {
    return (
        <View style={styles.root}>
            {/* Current Streak */}
            <View style={styles.stat}>
                <View style={styles.statRow}>
                    <Ionicons name="flame" size={16} color={COLORS.secondary} />
                    <Text style={styles.value}>{currentStreak}</Text>
                </View>
                <Text style={styles.label}>STREAK</Text>
            </View>

            <View style={styles.divider} />

            {/* Longest Streak */}
            <View style={styles.stat}>
                <View style={styles.statRow}>
                    <Ionicons name="trophy" size={16} color={COLORS.secondary} />
                    <Text style={styles.value}>{longestStreak}</Text>
                </View>
                <Text style={styles.label}>RECORD</Text>
            </View>

            <View style={styles.divider} />

            {/* Shields */}
            <View style={styles.stat}>
                <View style={styles.statRow}>
                    <Ionicons
                        name={shields > 0 ? "shield-checkmark" : "shield-outline"}
                        size={16}
                        color={shields > 0 ? COLORS.secondary : COLORS.dim}
                    />
                    <Text style={[styles.value, shields === 0 && styles.valueDim]}>
                        {shields}
                    </Text>
                </View>
                <Text style={styles.label}>SHIELDS</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: COLORS.surface, // Deep Navy
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.outline, // Subtle depth border
        alignItems: 'center',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    value: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.text, // Crisp White
    },
    valueDim: {
        color: COLORS.dim,
    },
    label: {
        fontSize: 9,
        fontWeight: '900',
        color: COLORS.dim, // Muted Slate
        letterSpacing: 1.5,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.outline, // Matches border
    },
})