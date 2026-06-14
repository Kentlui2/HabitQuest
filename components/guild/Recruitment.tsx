import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

type SearchResultUser = {
    id: string
    name: string
    class: string
    level: number
    is_allied: boolean
}

type RecruitHeroesProps = {
    searchQuery: string
    searching: boolean
    searchResult: SearchResultUser | null
    onChangeQuery: (text: string) => void
    onSearch: () => void
    onRecruit: (heroId: string) => void
}

export default function RecruitHeroes({
    searchQuery,
    searching,
    searchResult,
    onChangeQuery,
    onSearch,
    onRecruit
}: RecruitHeroesProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.inputLabel}>SEARCH SQUADLESS PLAYERS</Text>

            {/* SEARCH INPUT BAR */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter exact hero name..."
                    placeholderTextColor={COLORS.dim}
                    autoCorrect={false}
                    autoCapitalize="none"
                    value={searchQuery}
                    onChangeText={onChangeQuery}
                    returnKeyType="search"
                    onSubmitEditing={onSearch}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
                    <Ionicons name="search-sharp" size={18} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* RESULTS RENDERING SLOT */}
            <View style={styles.resultContainer}>
                {searching ? (
                    <View style={styles.stateWrapper}>
                        <ActivityIndicator size="small" color={COLORS.secondary} />
                        <Text style={styles.stateText}>Scouting the realm rosters...</Text>
                    </View>
                ) : searchResult ? (
                    <View style={styles.heroCard}>
                        <View style={styles.heroLeft}>
                            <View style={styles.avatarShell}>
                                <Text style={styles.avatarText}>
                                    {searchResult.class === 'mage' ? '🔮' : searchResult.class === 'rogue' ? '🗡️' : '⚔️'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.heroName}>{searchResult.name.toUpperCase()}</Text>
                                <Text style={styles.heroMeta}>
                                    LEVEL {searchResult.level} • {searchResult.class.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {searchResult.is_allied ? (
                            <View style={styles.badgeAllied}>
                                <Text style={styles.badgeText}>ALREADY ALLIED</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.recruitBtn}
                                onPress={() => onRecruit(searchResult.id)}
                            >
                                <Text style={styles.recruitBtnText}>INVITE</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : searchQuery ? (
                    <View style={styles.stateWrapper}>
                        <Ionicons name="help-circle-outline" size={24} color={COLORS.dim} />
                        <Text style={styles.stateText}>No standalone hero found with that signature.</Text>
                    </View>
                ) : (
                    <View style={styles.stateWrapper}>
                        <Ionicons name="sparkles-outline" size={24} color={COLORS.dim} />
                        <Text style={styles.stateText}>Input an active character name to dispatch a summon.</Text>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { marginTop: SPACING.sm },
    inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.8, marginBottom: SPACING.sm },

    searchRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 20 },
    input: { flex: 1, height: 46, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.md, paddingHorizontal: 16, color: COLORS.text, fontSize: 13, fontWeight: '600' },
    searchBtn: { width: 46, height: 46, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },

    resultContainer: { minHeight: 100, justifyContent: 'center' },
    stateWrapper: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    stateText: { fontSize: 11, fontWeight: '600', color: COLORS.muted, textAlign: 'center' },

    heroCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline, padding: 12, borderRadius: RADIUS.lg },
    heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarShell: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
    avatarText: { fontSize: 16 },
    heroName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
    heroMeta: { fontSize: 9, fontWeight: '700', color: COLORS.dim, marginTop: 2 },

    recruitBtn: { backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.md },
    recruitBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },

    badgeAllied: { backgroundColor: COLORS.surface2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.outlineVariant },
    badgeText: { color: COLORS.dim, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }
})