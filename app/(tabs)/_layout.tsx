// app/(tabs)/_layout.tsx
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Platform, Pressable } from 'react-native'
import { Tabs, router, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import QuestHeader from '@/components/ui/QuestHeader'
import AvatarMenu from '@/components/ui/AvatarMenu'
import { TabIcon } from '@/components/navigation/TabBar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useHero } from '@/context/HeroContext'

const TABBAR_HEIGHT = 64

// ── Shared event emitter for FAB → habits sheet ───────────
type Listener = () => void
const listeners: Listener[] = []

export const habitSheetEvents = {
    emit: () => listeners.forEach(fn => fn()),
    subscribe: (fn: Listener) => {
        listeners.push(fn)
        return () => {
            const i = listeners.indexOf(fn)
            if (i > -1) listeners.splice(i, 1)
        }
    },
}

// ── Header ────────────────────────────────────────────────
function HeaderWithDrawer({ gold }: { gold: number }) {
    const [drawerVisible, setDrawerVisible] = useState(false)
    return (
        <>
            <QuestHeader gold={gold} onAvatarPress={() => setDrawerVisible(true)} />
            <AvatarMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </>
    )
}

// ── Tab config ────────────────────────────────────────────
function getTabConfig(name: string) {
    switch (name) {
        case 'home':
            return { active: 'home' as const, inactive: 'home-outline' as const, label: 'Home' }
        case 'habits':
            return { active: 'flash' as const, inactive: 'flash-outline' as const, label: 'Habits' }
        case 'quests':
            return { active: 'compass' as const, inactive: 'compass-outline' as const, label: 'Quests' }
        case 'guild':
            return { active: 'shield' as const, inactive: 'shield-outline' as const, label: 'Guild' }
        default:
            return { active: 'square' as const, inactive: 'square-outline' as const, label: '' }
    }
}

const HIDDEN_ROUTES = ['add', 'profile', 'shop', 'inventory', 'leaderboard', 'settings']

// ── Layout ────────────────────────────────────────────────
export default function TabsLayout() {
    const pathname = usePathname()
    const { user } = useAuth()
    const { hero } = useHero()
    const gold = hero?.gold ?? 0

    const handleFABPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        if (pathname.includes('habits')) {
            habitSheetEvents.emit()
            return
        }

        router.push('/(tabs)/habits')
        setTimeout(() => habitSheetEvents.emit(), 300)
    }

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    header: () => <HeaderWithDrawer gold={gold} />,
                    sceneStyle: { backgroundColor: '#060B13' },
                    tabBarStyle: { display: 'none' },
                }}
                tabBar={({ state, navigation }) => (
                    <View style={styles.floatingContainer} pointerEvents="box-none">
                        <View style={styles.track}>
                            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.tabsRow}>
                                {state.routes.map((route, index) => {
                                    if (HIDDEN_ROUTES.includes(route.name)) return null
                                    const focused = state.index === index
                                    const config = getTabConfig(route.name)
                                    return (
                                        <Pressable
                                            key={route.key}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                                navigation.navigate(route.name)
                                            }}
                                            style={styles.tabButton}
                                        >
                                            <TabIcon
                                                activeName={config.active}
                                                inactiveName={config.inactive}
                                                focused={focused}
                                                label={config.label}
                                            />
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                        <View style={styles.fabShell}>
                            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                            <Pressable
                                onPress={handleFABPress}
                                style={({ pressed }) => [
                                    styles.fabButton,
                                    pressed && { transform: [{ scale: 0.94 }], opacity: 0.8 },
                                ]}
                            >
                                <Ionicons name="add" size={28} color="#FFFFFF" />
                            </Pressable>
                        </View>
                    </View>
                )}
            >
                <Tabs.Screen name="home" />
                <Tabs.Screen name="habits" options={{ headerShown: false }} />
                <Tabs.Screen name="quests" options={{ headerShown: false }} />
                <Tabs.Screen name="guild" options={{ headerShown: false }} />
                <Tabs.Screen name="add" options={{ headerShown: false }} />
                <Tabs.Screen name="profile" options={{ headerShown: false }} />
                <Tabs.Screen name="shop" options={{ headerShown: false }} />
                <Tabs.Screen name="inventory" options={{ headerShown: false }} />
                <Tabs.Screen name="leaderboard" options={{ href: null, headerShown: false }} />
                <Tabs.Screen name="settings" options={{ headerShown: false }} />
            </Tabs>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#060B13',
    },
    floatingContainer: {
        position: 'absolute',
        left: 14, right: 14,
        bottom: Platform.OS === 'ios' ? 34 : 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    track: {
        flex: 1,
        height: TABBAR_HEIGHT,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(10,15,25,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    tabsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingHorizontal: 8,
    },
    tabButton: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabShell: {
        width: TABBAR_HEIGHT,
        height: TABBAR_HEIGHT,
        marginLeft: 12,
        borderRadius: TABBAR_HEIGHT / 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(10,15,25,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        // add these:
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabButton: {
        // remove flex: 1, use explicit size so it sits on top of BlurView
        width: TABBAR_HEIGHT,
        height: TABBAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        // make sure it renders above the BlurView
        zIndex: 1,
    },
})