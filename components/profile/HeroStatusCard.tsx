import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeroPreview from '@/components/HeroPreview';
import { HeroData } from '@/types/game';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

export const HeroStatusCard = ({ data, totalStats }: { data: HeroData | null; totalStats?: any }) => {
    const stats = [
        { label: 'STR', value: totalStats?.strength ?? data?.strength, color: COLORS.primary },
        { label: 'INT', value: totalStats?.intelligence ?? data?.intelligence, color: COLORS.secondary },
        { label: 'VIT', value: totalStats?.vitality ?? data?.vitality, color: COLORS.primary },
        { label: 'DEX', value: totalStats?.dexterity ?? data?.dexterity, color: COLORS.secondary },
        { label: 'WIS', value: totalStats?.wisdom ?? data?.wisdom, color: COLORS.tertiary },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.previewBox}>
                <HeroPreview hero={data as any} />
                <View style={styles.levelBadge}>
                    <Text style={styles.levelLabel}>LVL</Text>
                    <Text style={styles.levelValue}>{data?.level ?? 1}</Text>
                </View>
            </View>

            <View style={styles.statsPanel}>
                <Text style={styles.panelTitle}>HERO ATTRIBUTES</Text>
                <View style={styles.statsGrid}>
                    {stats.map((s) => (
                        <View key={s.label} style={styles.statItem}>
                            <Text style={styles.statLabel}>{s.label}</Text>
                            <Text style={[styles.statValue, { color: s.color }]}>{s.value ?? 10}</Text>
                            <View style={styles.statUnderline} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: SPACING.md },
    previewBox: {
        height: 240,
        backgroundColor: C.bgCard,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: RADIUS.lg,
        overflow: 'hidden'
    },
    levelBadge: {
        position: 'absolute',
        bottom: SPACING.md,
        right: SPACING.md,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        alignItems: 'center'
    },
    levelLabel: { fontSize: 9, fontWeight: '900', color: C.textTertiary },
    levelValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    statsPanel: {
        backgroundColor: C.bgCard,
        borderWidth: 1,
        borderColor: C.border,
        padding: SPACING.md,
        borderRadius: RADIUS.md
    },
    panelTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: C.textTertiary,
        letterSpacing: 2,
        marginBottom: SPACING.md
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm
    },
    statItem: {
        width: '30%', // Consistent grid sizing
        gap: SPACING.xs
    },
    statLabel: { fontSize: 9, fontWeight: '900', color: C.textTertiary },
    statValue: { fontSize: 18, fontWeight: '900' },
    statUnderline: { height: 2, backgroundColor: C.border },
});