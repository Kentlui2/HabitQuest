// components/guild/UnalliedView.tsx
import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type UnalliedViewProps = {
    onGuildCreated: () => void
}

type AvailableGuild = {
    id: string
    name: string
    tag: string
    emblem: string
    member_count?: number
}

export default function UnalliedView({ onGuildCreated }: UnalliedViewProps) {
    const { user } = useAuth()
    
    // UI Mode Toggle: 'landing' | 'create' | 'browse'
    const [viewMode, setViewMode] = useState<'landing' | 'create' | 'browse'>('landing')
    
    // Creation States
    const [guildName, setGuildName] = useState('')
    const [guildTag, setGuildTag] = useState('')
    const [guildEmblem, setGuildEmblem] = useState('⚔️')
    const [submitting, setSubmitting] = useState(false)

    // Browsing States
    const [availableGuilds, setAvailableGuilds] = useState<AvailableGuild[]>([])
    const [loadingGuilds, setLoadingGuilds] = useState(false)

    // Fetch open alliances when browsing mode is activated
    useEffect(() => {
        if (viewMode === 'browse') {
            fetchAvailableGuilds()
        }
    }, [viewMode])

    const fetchAvailableGuilds = async () => {
        setLoadingGuilds(true)
        try {
            // Adjust the selection depending on your exact schema layout
            const { data, error } = await supabase
                .from('guilds')
                .select('id, name, tag, emblem')
                .limit(20)

            if (error) throw error
            setAvailableGuilds(data || [])
        } catch (err: any) {
            Alert.alert('Error fetching guilds', err.message)
        } finally {
            setLoadingGuilds(false)
        }
    }

    const handleCreateGuild = async () => {
        if (!guildName.trim() || !guildTag.trim()) {
            Alert.alert('Required Fields', 'Please fill in both the Alliance Name and Guild Tag.')
            return
        }
        if (guildTag.length > 4) {
            Alert.alert('Tag Too Long', 'Guild Tags must be 4 characters or less.')
            return
        }
        
        setSubmitting(true)
        try {
            // 1. Insert new row into your Master Guilds Registry Table
            const { data: newGuild, error: guildError } = await supabase
                .from('guilds')
                .insert({
                    name: guildName.trim(),
                    tag: guildTag.trim().toUpperCase(),
                    emblem: guildEmblem,
                })
                .select()
                .single()

            if (guildError) throw guildError

            if (newGuild && user) {
                // 2. Update current profile/hero to make them the 'leader'
                const { data: updatedHero, error: heroError, count } = await supabase
                    .from('heroes')
                    .update({ 
                        guild_id: newGuild.id,
                        guild_role: 'leader'
                    })
                    .eq('user_id', user.id)
                    .select() // <-- Add this to see what returns

                    if (heroError) {
                        Alert.alert('Database Error', heroError.message)
                        throw heroError
                    }

                    // Check if any row was actually modified
                    if (!updatedHero || updatedHero.length === 0) {
                        Alert.alert(
                            'Hero Row Missing', 
                            `We couldn't find a character row in the 'heroes' table for your user ID (${user.id}). Make sure your character is created first!`
                        )
                        setSubmitting(false)
                        return
                    }

        Alert.alert('Success!', `The alliance [${newGuild.tag}] has been established.`)
        onGuildCreated() 
    }
        } catch (err: any) {
            Alert.alert('Failed to establish Guild', err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleJoinGuild = async (guildId: string, tag: string) => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('heroes')
                .update({ 
                    guild_id: guildId,
                    guild_role: 'member'
                })
                .eq('user_id', user.id)

            if (error) throw error

            Alert.alert('Joined Alliance', `You are now a certified member of [${tag}]!`)
            onGuildCreated()
        } catch (err: any) {
            Alert.alert('Error joining alliance', err.message)
        }
    }

    // --- SUB-PANEL ROUTING RENDER BRANCHES ---

    if (viewMode === 'create') {
        return (
            <View style={styles.innerRoot}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('landing')}>
                    <Ionicons name="arrow-back" size={16} color="#007AFF" />
                    <Text style={styles.backBtnText}>BACK</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeading}>FOUND AN ALLIANCE</Text>
                <Text style={styles.sectionDesc}>Assemble your squad, complete tasks together, and scale up the server ranks.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>ALLIANCE NAME</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g., Code Crusaders"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={guildName}
                        onChangeText={setGuildName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>GUILD TAG (MAX 4 CHARS)</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g., CRUD"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        autoCapitalize="characters"
                        maxLength={4}
                        value={guildTag}
                        onChangeText={setGuildTag}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.primaryActionBtn, { marginTop: 12 }]} 
                    onPress={handleCreateGuild}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.primaryActionBtnText}>EXECUTE CHARTER</Text>
                    )}
                </TouchableOpacity>
            </View>
        )
    }

    if (viewMode === 'browse') {
        return (
            <View style={styles.innerRoot}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('landing')}>
                    <Ionicons name="arrow-back" size={16} color="#007AFF" />
                    <Text style={styles.backBtnText}>BACK</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeading}>AVAILABLE ALLIANCES</Text>
                <Text style={styles.sectionDesc}>Pledge allegiance to an active syndicate executing daily tasks on the track.</Text>

                {loadingGuilds ? (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList 
                        data={availableGuilds}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <Text style={styles.emptyListText}>No active guilds found in this realm registry yet.</Text>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.guildRowCard}>
                                <View style={styles.guildRowLeft}>
                                    <Text style={styles.guildEmblem}>{item.emblem}</Text>
                                    <View>
                                        <Text style={styles.guildRowTitle}>[{item.tag}] {item.name}</Text>
                                        <Text style={styles.guildRowMeta}>PUBLIC JOIN TIER</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.joinBtn}
                                    onPress={() => handleJoinGuild(item.id, item.tag)}
                                >
                                    <Text style={styles.joinBtnText}>PLEDGE</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </View>
        )
    }

    // DEFAULT LANDING PLATFORM HUB
    return (
        <View style={[styles.innerRoot, styles.center]}>
            <View style={styles.iconEmblemShell}>
                <Ionicons name="shield-half-sharp" size={48} color="#007AFF" />
            </View>
            
            <Text style={styles.mainTitle}>UNALLIED HERO</Text>
            <Text style={styles.mainDesc}>
                You aren't associated with a faction. Join a collaborative guild squad to take down massive objective targets and unlock shared reward pools.
            </Text>

            <View style={styles.actionCluster}>
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setViewMode('browse')}>
                    <Ionicons name="search-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionBtnText}>BROWSE SYNDICATES</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setViewMode('create')}>
                    <Ionicons name="add-sharp" size={18} color="#007AFF" style={{ marginRight: 4 }} />
                    <Text style={styles.secondaryActionBtnText}>CHARTER NEW GUILD</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    innerRoot: { flex: 1, backgroundColor: '#060B13', paddingHorizontal: 24, paddingTop: 20 },
    center: { justifyContent: 'center', alignItems: 'center', flex: 0.85 },
    
    iconEmblemShell: { width: 90, height: 90, borderRadius: 24, backgroundColor: 'rgba(0, 122, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(0, 122, 255, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    mainTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 8 },
    mainDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 16 },
    
    actionCluster: { width: '100%', gap: 12 },
    primaryActionBtn: { height: 48, backgroundColor: '#007AFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    
    secondaryActionBtn: { height: 48, backgroundColor: 'rgba(0, 122, 255, 0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 122, 255, 0.15)' },
    secondaryActionBtnText: { color: '#007AFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    // Form Navigation Items
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, alignSelf: 'flex-start', gap: 4 },
    backBtnText: { fontSize: 11, fontWeight: '800', color: '#007AFF', letterSpacing: 0.5 },
    sectionHeading: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
    sectionDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, marginBottom: 24 },
    
    formGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8 },
    input: { height: 48, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

    // Browsing Lists Layouts
    listContainer: { gap: 10, paddingTop: 12 },
    guildRowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 14 },
    guildRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    guildEmblem: { fontSize: 22 },
    guildRowTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
    guildRowMeta: { fontSize: 9, fontWeight: '700', color: '#2DD4BF', marginTop: 2, letterSpacing: 0.5 },
    joinBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
    joinBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    emptyListText: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 12, marginTop: 40, paddingHorizontal: 20 },
})