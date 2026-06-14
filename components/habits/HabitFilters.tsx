// components/habits/HabitFilters.tsx
import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { FILTERS } from '@/constants/habits'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'

interface HabitFiltersProps {
    activeFilter: string
    onFilterChange: (filter: string) => void
}

export default function HabitFilters({ activeFilter, onFilterChange }: HabitFiltersProps) {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {FILTERS.map((f) => {
                    const isActive = activeFilter === f
                    return (
                        <Pressable
                            key={f}
                            onPress={() => onFilterChange(f)}
                            style={({ pressed }) => [
                                styles.pill,
                                isActive && styles.pillActive,
                                pressed && styles.pillPressed
                            ]}
                        >
                            <Text style={[styles.text, isActive && styles.textActive]}>{f}</Text>
                        </Pressable>
                    )
                })}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    scroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surface, // Matches base card surface elevation
    },
    pillActive: {
        backgroundColor: 'rgba(255, 77, 0, 0.12)', // Subtle inner fill of Blaze Orange
    },
    pillPressed: {
        transform: [{ scale: 0.95 }],
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dim,
    },
    textActive: {
        color: COLORS.primary,
        fontWeight: '800',
    },
})