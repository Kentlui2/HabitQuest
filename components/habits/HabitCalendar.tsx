// components/habits/HabitCalendar.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

interface HabitCalendarProps {
    userId: string
    selectedDate: string
    onSelectDate: (date: string) => void
}

type DayStatus = 'done' | 'partial' | 'none' | 'future'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function HabitCalendar({ userId, selectedDate, onSelectDate }: HabitCalendarProps) {
    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [dayMap, setDayMap] = useState<Record<string, DayStatus>>({})
    const [loading, setLoading] = useState(false)

    const fetchMonthData = useCallback(async () => {
        setLoading(true)
        const firstDay = toDateStr(viewYear, viewMonth, 1)
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const lastDay = toDateStr(viewYear, viewMonth, daysInMonth)

        // 1. Fetch the logs for the month
        const { data: logs } = await supabase
            .from('habit_logs')
            .select('log_date, habit_id')
            .eq('user_id', userId)
            .gte('log_date', firstDay)
            .lte('log_date', lastDay)

        // 2. Fetch all habits, but now we grab created_at (start date) and end_date
        const { data: habitsData } = await supabase
            .from('habits')
            .select('id, created_at, end_date')
            .eq('user_id', userId)
            .eq('is_archived', false)

        const map: Record<string, DayStatus> = {}

        if (habitsData && habitsData.length > 0) {
            // Group completed logs by date for fast lookup
            const logsByDate: Record<string, Set<string>> = {}
            if (logs) {
                for (const log of logs) {
                    if (!logsByDate[log.log_date]) logsByDate[log.log_date] = new Set()
                    logsByDate[log.log_date].add(log.habit_id)
                }
            }

            // 3. Evaluate each day in the month dynamically
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = toDateStr(viewYear, viewMonth, d)

                // Count how many habits are active ON THIS SPECIFIC DAY
                let activeHabitsForDay = 0

                for (const habit of habitsData) {
                    // Normalize dates to YYYY-MM-DD for accurate comparison
                    const habitStart = habit.created_at ? habit.created_at.split('T')[0] : '2000-01-01'
                    const habitEnd = habit.end_date ? habit.end_date.split('T')[0] : null

                    // A habit is active if the current calendar date is >= its start date
                    // AND it has no end date OR the calendar date is <= its end date
                    if (dateStr >= habitStart && (!habitEnd || dateStr <= habitEnd)) {
                        activeHabitsForDay++
                    }
                }

                // If there are no active habits on this day, we default to 'none'
                if (activeHabitsForDay === 0) {
                    map[dateStr] = 'none'
                } else {
                    // Compare logs completed vs habits active for this day
                    const completedCount = logsByDate[dateStr]?.size || 0
                    const ratio = completedCount / activeHabitsForDay
                    map[dateStr] = ratio >= 1 ? 'done' : ratio > 0 ? 'partial' : 'none'
                }
            }
        }

        setDayMap(map)
        setLoading(false)
    }, [userId, viewYear, viewMonth])

    useEffect(() => { fetchMonthData() }, [fetchMonthData])

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

    const goToPrev = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    const goToNext = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const cells: Array<{ day: number | null; dateStr: string | null }> = []
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, dateStr: null })
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, dateStr: toDateStr(viewYear, viewMonth, d) })
    }

    return (
        <View style={styles.container}>
            {/* Header: month nav + legend inline */}
            <View style={styles.header}>
                <Pressable onPress={goToPrev} hitSlop={10} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={14} color={COLORS.dim} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                    {/* Legend inline — no extra row */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
                            <Text style={styles.legendText}>Done</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                            <Text style={styles.legendText}>Partial</Text>
                        </View>
                    </View>
                </View>

                <Pressable onPress={goToNext} hitSlop={10} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.dim} />
                </Pressable>
            </View>

            {/* Day-of-week labels */}
            <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((l, i) => (
                    <Text key={i} style={styles.dayLabel}>{l}</Text>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : (
                <View style={styles.grid}>
                    {cells.map((cell, idx) => {
                        if (!cell.day || !cell.dateStr) {
                            return <View key={`e-${idx}`} style={styles.cell} />
                        }

                        const isSelected = cell.dateStr === selectedDate
                        const isToday = cell.dateStr === todayStr
                        const isFuture = cell.dateStr > todayStr
                        const status: DayStatus = isFuture ? 'future' : (dayMap[cell.dateStr] ?? 'none')

                        const dotColor =
                            isSelected ? 'rgba(255,255,255,0.8)' :
                                status === 'done' ? COLORS.secondary :
                                    status === 'partial' ? '#FF9800' :
                                        'transparent'

                        return (
                            <Pressable
                                key={cell.dateStr}
                                style={[
                                    styles.cell,
                                    isSelected && styles.cellSelected,
                                    isToday && !isSelected && styles.cellToday,
                                ]}
                                onPress={() => onSelectDate(cell.dateStr!)}
                            >
                                <Text style={[
                                    styles.cellNum,
                                    isSelected && styles.cellNumSelected,
                                    isToday && !isSelected && styles.cellNumToday,
                                    isFuture && styles.cellNumFuture,
                                ]}>
                                    {cell.day}
                                </Text>
                                {/* Dot only for days with data */}
                                {!isFuture && status !== 'none' && (
                                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
                                )}
                            </Pressable>
                        )
                    })}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.outline,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    navBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    monthLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 0.2,
    },
    legend: {
        flexDirection: 'row',
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    legendDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.dim,
    },
    dayLabelsRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    dayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.dim,
        letterSpacing: 0.3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: `${100 / 7}%`,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        gap: 2,
    },
    cellSelected: {
        backgroundColor: COLORS.primary,
    },
    cellToday: {
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    cellNum: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    cellNumSelected: {
        color: '#fff',
        fontWeight: '800',
    },
    cellNumToday: {
        color: COLORS.secondary,
        fontWeight: '800',
    },
    cellNumFuture: {
        color: 'rgba(255,255,255,0.2)',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
})