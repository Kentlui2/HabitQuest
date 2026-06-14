// components/habits/HabitProgress.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

interface HabitProgressProps {
    doneCount: number
    totalCount: number
    progressPct: number
}

export default function HabitProgress({ doneCount, totalCount, progressPct }: HabitProgressProps) {
    if (totalCount === 0) return null

    // Ensure bounds stay clean between 0% and 100%
    const cleanPct = Math.min(Math.max(progressPct, 0), 100)

    return (
        <View style={styles.container}>
            <View style={styles.metaRow}>
                <Text style={styles.label}>Daily Progression</Text>
                <Text style={styles.value}>
                    {doneCount} / {totalCount} Done
                </Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.fill, { width: `${cleanPct}%` }]} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: SPACING.md,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    value: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.secondary, // Vibrant Teal
    },
    track: {
        height: 6,
        backgroundColor: COLORS.surface, // Blends seamlessly into card backs
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: COLORS.secondary, // Teal progression marker
        borderRadius: RADIUS.sm,
    },
})