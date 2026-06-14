// components/habits/AddHabitSheet.tsx
import React, { useState } from 'react'
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'
import { STATS, DIFFICULTIES, rollQuestRewards } from '@/constants/habits'

interface AddHabitSheetProps {
    visible: boolean
    onClose: () => void
    onSave: (form: any) => void
}

const DURATIONS = ['7', '14', '30', 'Infinite'] as const

export default function AddHabitSheet({ visible, onClose, onSave }: AddHabitSheetProps) {
    const [title, setTitle] = useState('')
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
    const [statType, setStatType] = useState<string>(STATS?.[0]?.key ?? 'strength')
    const [duration, setDuration] = useState('30')
    const [showError, setShowError] = useState(false)

    const resetForm = () => {
        setTitle('')
        setDifficulty('easy')
        setStatType(STATS?.[0]?.key ?? 'strength')
        setDuration('30')
        setShowError(false)
    }

    const handleSave = () => {
        if (!title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            setShowError(true)
            return
        }

        const rewards = rollQuestRewards(difficulty) || {}
        const finalXp = rewards.xpGained ?? 15
        const finalGold = rewards.goldGained ?? 5
        const durationDays = duration === 'Infinite' ? null : parseInt(duration, 10)
        let endDate = null
        if (durationDays) {
            const date = new Date()
            date.setDate(date.getDate() + durationDays)
            endDate = date.toISOString()
        }

        onSave({
            title: title.trim(),
            difficulty,
            stat_type: statType,
            xp_reward: finalXp,
            gold_reward: finalGold,
            duration_days: durationDays,
            end_date: endDate,
            is_archived: false,
            icon_emoji: getStatEmoji(statType),
            frequency: 'daily',
        })

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        resetForm()
        onClose()
    }

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.overlay}>
                    <Pressable style={styles.backdrop} onPress={onClose} />
                    <View style={styles.sheetContainer}>
                        <View style={styles.dragHandle} />

                        <View style={styles.headerRow}>
                            <Text style={styles.sheetTitle}>CREATE NEW HABIT</Text>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={20} color={COLORS.text ?? '#FFF'} />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <Text style={styles.sectionLabel}>HABIT TITLE</Text>
                            <TextInput
                                style={[styles.textInput, showError && styles.textInputError]}
                                placeholder="e.g., Morning run..."
                                placeholderTextColor={COLORS.dim ?? '#64748B'}
                                value={title}
                                onChangeText={(t) => { setTitle(t); if (showError) setShowError(false); }}
                            />

                            <Text style={styles.sectionLabel}>DIFFICULTY</Text>
                            <View style={styles.pillGrid}>
                                {DIFFICULTIES.map((d) => (
                                    <Pressable key={d.key} onPress={() => setDifficulty(d.key as any)} style={[styles.selectorPill, difficulty === d.key && { borderColor: d.color, backgroundColor: `${d.color}15` }]}>
                                        <Text style={[styles.pillText, difficulty === d.key && { color: d.color }]}>{d.label.toUpperCase()}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.sectionLabel}>DURATION</Text>
                            <View style={styles.pillGrid}>
                                {DURATIONS.map((dur) => (
                                    <Pressable key={dur} onPress={() => setDuration(dur)} style={[styles.selectorPill, duration === dur && styles.selectorPillActive]}>
                                        <Text style={[styles.pillText, duration === dur && styles.pillTextActive]}>{dur === 'Infinite' ? 'FOREVER' : `${dur}D`}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.sectionLabel}>BOUND STAT</Text>
                            <View style={styles.statGrid}>
                                {STATS.map((s) => (
                                    <Pressable key={s.key} onPress={() => setStatType(s.key)} style={[styles.statCard, statType === s.key && styles.statCardActive]}>
                                        <Text style={styles.statIcon}>{s.icon}</Text>
                                        <Text style={[styles.statLabel, statType === s.key && styles.statLabelActive]}>{s.label}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Pressable onPress={handleSave} style={[styles.submitButton, !title.trim() && { opacity: 0.5 }]}>
                                <Text style={styles.submitText}>SAVE HABIT</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

// Helper kept outside for clean imports
function getStatEmoji(statKey: string): string {
    const map: any = { strength: '💪', intelligence: '📚', vitality: '🧘', dexterity: '⚡', wisdom: '🌿' }
    return map[statKey] ?? '⚡'
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3, 6, 11, 0.85)' },
    sheetContainer: {
        backgroundColor: '#0C1629', // Deep navy to match image_94e4c5.png
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        maxHeight: '90%',
    },
    dragHandle: { width: 40, height: 4, backgroundColor: '#223454', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
    sheetTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#162338', alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1.2, marginBottom: 12 },
    textInput: { backgroundColor: '#121B2E', borderRadius: 12, height: 52, paddingHorizontal: 16, color: '#FFF', borderWidth: 1, borderColor: '#1E293B', marginBottom: 24, fontWeight: '600' },
    textInputError: { borderColor: '#EF4444' },
    pillGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    selectorPill: { flex: 1, paddingVertical: 12, backgroundColor: '#121B2E', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
    selectorPillActive: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: '#00E5FF' },
    pillText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
    pillTextActive: { color: '#00E5FF' },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
    statCard: { width: '47%', height: 48, backgroundColor: '#121B2E', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#1E293B', gap: 8 },
    statCardActive: { backgroundColor: 'rgba(0, 163, 255, 0.1)', borderColor: '#00A3FF' },
    statIcon: { fontSize: 16 },
    statLabel: { fontSize: 11, fontWeight: '800', color: '#64748B' },
    statLabelActive: { color: '#FFF' },
    submitButton: { height: 56, backgroundColor: COLORS.secondary ?? '#00E5FF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
})