import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Alert, StatusBar, SafeAreaView, RefreshControl, Animated
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import Recruitment from '@/components/guild/Recruitment'
import UnalliedView from '@/components/guild/UnalliedView'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'
import * as Haptics from 'expo-haptics'

type GuildData = {
    id: string; name: string; tag: string
    emblem: string; weekly_xp: number
}
type RosterMember = {
    id: string; username: string; name: string
    class: string; level: number; xp_earned: number; role: string
}
type ActivityLog = { id: string; message: string; time: string }

export default function GuildScreen() {
    const { user } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState<'Roster' | 'Activity'>('Roster')
    const [guild, setGuild] = useState<GuildData | null>(null)
    const [roster, setRoster] = useState<RosterMember[]>([])
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [recruitModalVisible, setRecruitModalVisible] = useState(false)
    const [isLeader, setIsLeader] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [searchResult, setSearchResult] = useState<any | null>(null)

    const pulseAnim = useRef(new Animated.Value(0.3)).current

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
                ])
            ).start()
        }
    }, [loading])

    const fetchGuildData = useCallback(async (isRefreshing = false) => {
        if (!user?.id) {
            setLoading(false)
            setRefreshing(false)
            return
        }
        if (!isRefreshing) setLoading(true)

        try {
            const { data: heroData, error: heroErr } = await supabase
                .from('heroes')
                .select('guild_id, guild_role')
                .eq('user_id', user.id)
                .single()

            if (heroErr) throw heroErr
            if (!heroData?.guild_id) {
                setGuild(null)
                return
            }

            setIsLeader(heroData.guild_role === 'leader')

            const { data: guildData, error: guildErr } = await supabase
                .from('guilds')
                .select('*')
                .eq('id', heroData.guild_id)
                .single()

            if (guildErr) throw guildErr

            const { data: memberData, error: memberErr } = await supabase
                .from('heroes')
                .select('user_id, name, class, level, guild_role, weekly_xp')
                .eq('guild_id', heroData.guild_id)

            if (memberErr) throw memberErr

            let aggregateXP = 0
            const parsedRoster: RosterMember[] = (memberData || []).map(m => {
                aggregateXP += m.weekly_xp || 0
                return {
                    id: m.user_id,
                    username: 'PLAYER',
                    name: m.name || 'Hero',
                    class: m.class || 'warrior',
                    level: m.level || 1,
                    role: m.guild_role || 'member',
                    xp_earned: m.weekly_xp || 0,
                }
            }).sort((a, b) => b.xp_earned - a.xp_earned)

            setGuild({
                id: guildData.id,
                name: guildData.name,
                tag: guildData.tag,
                emblem: guildData.emblem || '🏴‍☠️',
                weekly_xp: aggregateXP,
            })
            setRoster(parsedRoster)
            setLogs(prev => prev.length > 0 ? prev : [
                { id: 'base-1', message: `⚔️ Guild online. Team XP: ${aggregateXP}`, time: 'Online' },
                { id: 'base-2', message: '🔮 Guild chat channel established.', time: 'Secure' },
            ])
        } catch (e) {
            console.error('fetchGuildData error:', e)
            setGuild(null)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [user?.id])

    useEffect(() => {
        if (user?.id) fetchGuildData()
        else setLoading(false)
    }, [user?.id, fetchGuildData])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchGuildData(true)
    }

    const handleLeaveGuild = () => {
        if (isLeader) {
            Alert.alert('Action Restricted', 'Guild leaders cannot leave without passing leadership to another member or disbanding.', [{ text: 'OK' }])
            return
        }
        Alert.alert('Leave Guild', `Are you sure you want to leave ${guild?.name.toUpperCase()}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave', style: 'destructive',
                onPress: async () => {
                    try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                        const { error } = await supabase.from('heroes').update({ guild_id: null, guild_role: null }).eq('user_id', user?.id)
                        if (error) throw error
                        fetchGuildData()
                    } catch (e: any) { Alert.alert('Error', e.message) }
                }
            }
        ])
    }

    const handleKickPlayer = async (targetUserId: string, heroName: string) => {
        Alert.alert('Kick Member', `Remove ${heroName.toUpperCase()} from the guild?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Kick', style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('heroes').update({ guild_id: null, guild_role: null }).eq('user_id', targetUserId)
                        if (error) throw error
                        fetchGuildData()
                    } catch (e: any) { Alert.alert('Error', e.message) }
                },
            },
        ])
    }

    const handleSearchPlayer = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        setSearchResult(null)
        try {
            const { data, error } = await supabase
                .from('heroes')
                .select('user_id, name, class, level, guild_id')
                .eq('name', searchQuery.trim())
                .maybeSingle()

            if (error) throw error

            if (data) {
                setSearchResult({
                    id: data.user_id,
                    name: data.name,
                    class: data.class,
                    level: data.level,
                    is_allied: !!data.guild_id,
                })
            } else {
                setSearchResult(null)
            }
        } catch (e: any) {
            console.error('Search error:', e)
            Alert.alert('Search Error', e.message)
        } finally {
            setSearching(false)
        }
    }

    const handleRecruitPlayer = async (targetUserId: string) => {
        if (!guild) return
        try {
            const { error } = await supabase
                .from('heroes')
                .update({ guild_id: guild.id, guild_role: 'member', weekly_xp: 0 })
                .eq('user_id', targetUserId)

            if (error) throw error

            Alert.alert('Recruitment Successful', 'The hero has been added to your guild.')
            setRecruitModalVisible(false)
            fetchGuildData()
        } catch (e: any) {
            Alert.alert('Recruitment Failed', e.message)
        }
    }

    const renderSkeleton = () => {
        return (
            <View style={styles.scrollContent}>
                <View style={[styles.card, styles.raidCardShadow]}>
                    <Animated.View style={[styles.skeletonText, { width: 120, opacity: pulseAnim, marginBottom: 12 }]} />
                    <Animated.View style={[styles.progressTrack, { opacity: pulseAnim }]} />
                </View>

                <Animated.View style={[styles.skeletonText, { width: 100, opacity: pulseAnim, marginBottom: 12, marginTop: 6 }]} />
                <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: 20 }}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                            <Animated.View style={[styles.skeletonCircle, { opacity: pulseAnim }]} />
                            <Animated.View style={[styles.skeletonText, { width: 35, height: 8, opacity: pulseAnim }]} />
                        </View>
                    ))}
                </View>

                <Animated.View style={[styles.skeletonText, { width: 80, opacity: pulseAnim, marginBottom: 12 }]} />
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={[styles.lobbyRow, { opacity: 0.6 }]}>
                        <Animated.View style={[styles.skeletonText, { width: '40%', opacity: pulseAnim }]} />
                        <Animated.View style={[styles.skeletonText, { width: 60, height: 18, borderRadius: RADIUS.sm, opacity: pulseAnim }]} />
                    </View>
                ))}
            </View>
        )
    }

    if (!loading && !guild) {
        return <UnalliedView onGuildCreated={fetchGuildData} />
    }

    const RAID_TARGET = 25000
    const progressPct = guild ? Math.min((guild.weekly_xp / RAID_TARGET) * 100, 100) : 0

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safe}>

                {/* HEAD BAR */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.emblemContainer}><Text style={styles.emblemIcon}>{guild?.emblem}</Text></View>
                        <View style={styles.titleColumn}>
                            <Text style={styles.guildTitle} numberOfLines={1}>{guild?.name.toUpperCase()}</Text>
                            <Text style={styles.guildTagSub}>[{guild?.tag?.toUpperCase() || 'TAG'}]</Text>
                        </View>
                    </View>
                    <View style={styles.actionCluster}>
                        <TouchableOpacity style={styles.iconBtnRightSpacing} onPress={() => router.push('/(tabs)/leaderboard')}>
                            <Ionicons name="trophy-sharp" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        {isLeader && (
                            <TouchableOpacity style={styles.iconBtn} onPress={() => setRecruitModalVisible(true)}>
                                <Ionicons name="person-add-sharp" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* NAVIGATION TABS */}
                <View style={styles.tabBarContainer}>
                    <View style={styles.tabBar}>
                        {(['Roster', 'Activity'] as const).map(tab => (
                            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab === 'Roster' ? 'ROSTER' : 'ACTIVITY LOG'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* RUNTIME SCROLL FEED */}
                {loading ? (
                    renderSkeleton()
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
                    >
                        {/* GUILD PROGRESS CARD */}
                        <View style={[styles.card, styles.raidCardShadow]}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.labelCluster}>
                                    <Ionicons name="shield-checkmark" size={12} color={COLORS.secondary} />
                                    <Text style={styles.cardLabel}>WEEKLY GUILD EXP TARGET</Text>
                                </View>
                                <Text style={styles.xpText}>{guild?.weekly_xp.toLocaleString()} <Text style={styles.xpTargetText}>/ {RAID_TARGET.toLocaleString()} XP</Text></Text>
                            </View>
                            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPct}%` as any }]} /></View>
                        </View>

                        {activeTab === 'Roster' ? (
                            <View style={{ marginTop: 4 }}>

                                {/* HORIZONTAL ONLINE NOW STATUS DECK */}
                                <Text style={styles.vibeSectionTitle}>ONLINE NOW</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lobbyPresenceRow} contentContainerStyle={{ gap: 14 }}>
                                    {roster.map((member, idx) => (
                                        <View key={member.id} style={styles.lobbyPresenceAvatar}>
                                            <View style={[styles.lobbyLiveIndicator, idx % 2 === 0 && styles.lobbyLiveOnline]} />
                                            <View style={styles.avatarCircle}>
                                                <Text style={styles.lobbyAvatarText}>{member.name.substring(0, 2).toUpperCase()}</Text>
                                            </View>
                                            <Text style={styles.lobbyAvatarLabel} numberOfLines={1}>
                                                {member.role === 'leader' ? '👑 ' : ''}{member.name.toUpperCase()}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* MEMBER ROSTER */}
                                <Text style={styles.vibeSectionTitle}>MEMBERS</Text>
                                <View style={{ paddingBottom: 10 }}>
                                    {roster.map((member) => {
                                        const isMe = member.id === user?.id
                                        return (
                                            <View key={member.id} style={[styles.lobbyRow, isMe && styles.lobbyMyRowAmbient]}>
                                                <View style={styles.lobbyRowLeft}>
                                                    <Ionicons name="radio-button-on-sharp" size={10} color={isMe ? COLORS.primary : COLORS.secondary} style={{ marginRight: 8 }} />
                                                    <Text style={[styles.lobbyRowName, isMe && styles.lobbyMyText]} numberOfLines={1}>
                                                        {member.role === 'leader' ? '👑 ' : ''}{member.name.toUpperCase()}
                                                    </Text>
                                                </View>

                                                <View style={styles.lobbyRightCluster}>
                                                    <View style={styles.lobbySpecs}>
                                                        <Text style={styles.lobbySpecsText}>{member.class.toUpperCase()} • LVL {member.level}</Text>
                                                    </View>
                                                    {isLeader && !isMe && (
                                                        <TouchableOpacity onPress={() => handleKickPlayer(member.id, member.name)} style={styles.lobbyExileBtn}>
                                                            <Ionicons name="close-circle-outline" size={14} color={COLORS.danger} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        )
                                    })}
                                </View>

                                {/* LEAVE GUILD */}
                                <TouchableOpacity style={styles.leaveGuildButton} onPress={handleLeaveGuild}>
                                    <Ionicons name="log-out-outline" size={14} color={COLORS.danger} />
                                    <Text style={styles.leaveGuildText}>LEAVE GUILD</Text>
                                </TouchableOpacity>

                            </View>
                        ) : (
                            <View style={styles.card}>
                                <Text style={styles.cardLabel}>GUILD HISTORY RECAP</Text>
                                <View style={styles.logList}>
                                    {logs.map(log => (
                                        <View key={log.id} style={styles.logRow}>
                                            <Text style={styles.logText} numberOfLines={1}>{log.message}</Text>
                                            <Text style={styles.logTime}>{log.time}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* MODALS RECRUITMENT */}
                <Modal visible={recruitModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>RECRUIT HERO</Text>
                                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setRecruitModalVisible(false)}>
                                    <Ionicons name="close-sharp" size={18} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalDivider} />
                            <Recruitment
                                searchQuery={searchQuery}
                                searching={searching}
                                searchResult={searchResult}
                                onChangeQuery={setSearchQuery}
                                onSearch={handleSearchPlayer}
                                onRecruit={handleRecruitPlayer}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    safe: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: 120 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 14, paddingBottom: 6 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    emblemContainer: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline, justifyContent: 'center', alignItems: 'center' },
    emblemIcon: { fontSize: 20 },
    titleColumn: { flex: 1 },
    guildTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
    guildTagSub: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5, marginTop: 2 },
    actionCluster: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline, alignItems: 'center', justifyContent: 'center' },
    iconBtnRightSpacing: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },

    tabBarContainer: { paddingHorizontal: SPACING.lg, marginTop: 12, marginBottom: 12 },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 4, borderColor: COLORS.outlineVariant, borderWidth: 1 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
    activeTab: { backgroundColor: COLORS.surface2 },
    tabText: { fontSize: 10, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.5 },
    activeTabText: { color: COLORS.primary },

    card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outline, borderRadius: RADIUS.xl, padding: 14, marginBottom: 12 },
    raidCardShadow: { borderColor: COLORS.outline, backgroundColor: COLORS.surface },
    labelCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardLabel: { fontSize: 9, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.5 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    xpText: { fontSize: 12, fontWeight: '900', color: COLORS.text },
    xpTargetText: { color: COLORS.dim, fontSize: 10 },
    progressTrack: { height: 5, backgroundColor: COLORS.surface2, borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.secondary },

    vibeSectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },

    lobbyPresenceRow: { marginBottom: 20, paddingVertical: 2 },
    lobbyPresenceAvatar: { width: 52, alignItems: 'center', gap: 6 },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.outline, justifyContent: 'center', alignItems: 'center' },
    lobbyAvatarText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
    lobbyLiveIndicator: { position: 'absolute', top: 1, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.dim, zIndex: 2, borderWidth: 1, borderColor: COLORS.background },
    lobbyLiveOnline: { backgroundColor: COLORS.secondary },
    lobbyAvatarLabel: { fontSize: 8, fontWeight: '800', color: COLORS.muted, width: '100%', textAlign: 'center' },

    lobbyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outlineVariant, paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.lg, marginBottom: 6 },
    lobbyMyRowAmbient: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
    lobbyRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    lobbyRowName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
    lobbyMyText: { color: COLORS.primary },
    lobbyRightCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    lobbySpecs: { backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.outline, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
    lobbySpecsText: { fontSize: 9, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.3 },
    lobbyExileBtn: { padding: 2 },

    leaveGuildButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.01)', borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.lg, paddingVertical: 13, marginTop: 20, marginBottom: 10 },
    leaveGuildText: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 0.5 },

    logList: { gap: 6, marginTop: 10 },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.outlineVariant, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.md },
    logText: { fontSize: 11, fontWeight: '600', color: COLORS.muted, flex: 1, paddingRight: 10 },
    logTime: { fontSize: 9, fontWeight: '700', color: COLORS.dim },

    skeletonText: { height: 12, backgroundColor: COLORS.surface2, borderRadius: 6 },
    skeletonCircle: { width: 44, height: 44, backgroundColor: COLORS.surface2, borderRadius: 22 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(6,11,19,0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.outline, padding: 24, minHeight: 420 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 12, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
    closeModalBtn: { width: 28, height: 28, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center' },
    modalDivider: { height: 1, backgroundColor: COLORS.outlineVariant, marginVertical: 14 },
})