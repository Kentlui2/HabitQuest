import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '@/types/game';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

export const AchievementList = ({ data }: { data: Achievement[] }) => (
    <View style={styles.container}>
        <Text style={styles.moduleTitle}>HEROIC FEATS</Text>
        <View style={styles.list}>
            {data.map((a) => (
                <View key={a.key} style={styles.item}>
                    <View style={styles.iconBox}>
                        <Text style={styles.emoji}>{a.icon_emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{a.title.toUpperCase()}</Text>
                        <Text style={styles.desc}>{a.description}</Text>
                    </View>
                    <Ionicons name="shield-checkmark-sharp" size={16} color={COLORS.secondary} />
                </View>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { gap: SPACING.sm },
    moduleTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: C.textTertiary,
        letterSpacing: 2
    },
    list: { gap: SPACING.sm },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: C.bgCard,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: RADIUS.md, // Softened corners
        padding: SPACING.sm
    },
    iconBox: {
        width: 44,
        height: 44,
        backgroundColor: C.bgCardAlt, // Use surface2 for contrast
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emoji: { fontSize: 18 },
    title: {
        fontSize: 12,
        fontWeight: '900',
        color: C.textPrimary
    },
    desc: {
        fontSize: 10,
        color: C.textSecondary,
        fontWeight: '700',
        marginTop: 2
    },
});