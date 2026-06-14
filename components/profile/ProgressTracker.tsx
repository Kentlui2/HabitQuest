import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

export const ProgressTracker = ({ xp, total }: { xp: number; total: number }) => {
    // Math.min ensures the bar never overflows the container
    const pct = total > 0 ? Math.min((xp / total) * 100, 100) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>LEVEL PROGRESS</Text>
                <Text style={styles.xpValue}>{xp} / {total} XP</Text>
            </View>
            <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${pct}%` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: SPACING.xs },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    xpLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: C.textTertiary,
        letterSpacing: 1
    },
    xpValue: {
        fontSize: 12,
        fontWeight: '900',
        color: C.textPrimary
    },
    xpTrack: {
        height: 8,
        backgroundColor: C.bgCardAlt,
        borderRadius: RADIUS.sm,
        overflow: 'hidden' // Ensures the fill respects the rounded corners
    },
    xpFill: {
        height: '100%',
        backgroundColor: COLORS.secondary, // Neon Cyan
        borderRadius: RADIUS.sm
    },
});