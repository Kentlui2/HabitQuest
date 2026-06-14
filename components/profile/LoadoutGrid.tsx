import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemData } from '@/types/game';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

export const LoadoutGrid = ({ items }: { items: Record<string, ItemData | null> }) => {
    const slots = [
        { id: 'weapon', label: 'WEAPON', icon: 'flash-sharp' },
        { id: 'armor', label: 'ARMOR', icon: 'shield-sharp' },
        { id: 'helmet', label: 'HARDWARE', icon: 'hardware-chip-sharp' },
        { id: 'accessory', label: 'RELIC', icon: 'infinite-sharp' },
    ] as const;

    return (
        <View style={styles.container}>
            <Text style={styles.moduleTitle}>HERO LOADOUT</Text>
            <View style={styles.grid}>
                {slots.map(s => {
                    const item = items[s.id];
                    const isEquipped = !!item;
                    const borderColor = isEquipped ? COLORS.secondary : C.border;
                    const textColor = isEquipped ? C.textPrimary : C.textTertiary;
                    const iconColor = isEquipped ? COLORS.secondary : C.textTertiary;

                    return (
                        <View key={s.id} style={[styles.slot, { borderColor }]}>
                            {isEquipped ? (
                                // Show item emoji when equipped
                                <Text style={styles.itemEmoji}>{item!.sprite_key}</Text>
                            ) : (
                                <Ionicons name={s.icon as any} size={20} color={iconColor} />
                            )}
                            <Text style={[styles.slotLabel, { color: textColor }]} numberOfLines={1}>
                                {isEquipped ? item!.name.toUpperCase() : s.label}
                            </Text>
                            {isEquipped && <View style={styles.activeIndicator} />}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: SPACING.sm },
    moduleTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: C.textTertiary,
        letterSpacing: 2
    },
    grid: {
        flexDirection: 'row',
        gap: SPACING.sm
    },
    slot: {
        flex: 1,
        height: 70,
        backgroundColor: C.bgCard,
        borderWidth: 1,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs
    },
    slotLabel: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    itemEmoji: {
        fontSize: 22,
    },
    activeIndicator: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.secondary // Neon Cyan dot for "Equipped"
    },
});