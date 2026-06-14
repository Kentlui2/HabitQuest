import React from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AvatarBadge from './AvatarBadge'

type SearchResult = { id: string; username: string; hero_name: string; class: string }

type Props = {
    searchQuery: string
    searching: boolean
    searchResult: SearchResult | null
    onChangeQuery: (text: string) => void
    onSearch: () => void
    onRecruit: (id: string) => void
}

export default function RecruitHeroes({ searchQuery, searching, searchResult, onChangeQuery, onSearch, onRecruit }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>RECRUIT HEROES</Text>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="TARGET USERNAME..."
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    value={searchQuery}
                    onChangeText={onChangeQuery}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={onSearch} disabled={searching} activeOpacity={0.8}>
                    {searching ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Ionicons name="search-sharp" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {searchResult && (
                <View style={styles.result}>
                    <AvatarBadge heroClass={searchResult.class} size={40} />
                    <View style={styles.resultInfo}>
                        <Text style={styles.resultUsername}>{searchResult.username.toUpperCase()}</Text>
                        <Text style={styles.resultHero}>{searchResult.hero_name.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity style={styles.recruitBtn} onPress={() => onRecruit(searchResult.id)} activeOpacity={0.8}>
                        <Text style={styles.recruitBtnText}>RECRUIT</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 14,
        marginTop: 10
    },
    title: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.3)',
        marginBottom: 12,
        letterSpacing: 1.5
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    searchBtn: {
        backgroundColor: '#007AFF', // Core Azure Blue navigation action token
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    result: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.25)', // Clean Azure contextual boundary line
        padding: 12,
        borderRadius: 10,
        marginTop: 12,
    },
    resultInfo: {
        flex: 1
    },
    resultUsername: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    resultHero: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '700',
        marginTop: 1
    },
    recruitBtn: {
        backgroundColor: '#2DD4BF', // Verified Teal execution token for successful actions
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    recruitBtnText: {
        color: '#060B13', // High contrast canvas dark-text alignment
        fontWeight: '800',
        fontSize: 11,
        letterSpacing: 0.5
    },
})