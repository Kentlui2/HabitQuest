import React, { useEffect, useRef } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { COLORS, RADIUS } from '@/constants/theme'

type MenuItem = {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    route: string
}

const MENU_ITEMS: MenuItem[] = [
    { icon: 'person-outline', label: 'Profile', route: '/(tabs)/profile' },
    { icon: 'briefcase-outline', label: 'Inventory', route: '/(tabs)/inventory' },
    { icon: 'cart-outline', label: 'Shop', route: '/(tabs)/shop' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
]

type Props = {
    visible: boolean
    onClose: () => void
}

export default function AvatarMenu({ visible, onClose }: Props) {
    const scaleAnim = useRef(new Animated.Value(0)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start()
        }
    }, [visible])

    if (!visible) return null

    const handleNavigate = (route: string) => {
        onClose()
        setTimeout(() => router.push(route as any), 150)
    }

    const handleSignOut = async () => {
        onClose()
        await supabase.auth.signOut()
    }

    return (
        <View style={styles.container}>
            <Pressable style={styles.overlay} onPress={onClose} />

            <Animated.View
                style={[
                    styles.menu,
                    {
                        opacity: opacityAnim,
                        transform: [
                            { scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                            { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
                        ],
                    },
                ]}
            >
                {/* Pointer Arrow */}
                <View style={styles.arrow} />

                {MENU_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.label}
                        style={styles.menuItem}
                        onPress={() => handleNavigate(item.route)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={item.icon} size={18} color={COLORS.dim} />
                        <Text style={styles.menuLabel}>{item.label.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
                    <Text style={[styles.menuLabel, { color: '#FF6B6B' }]}>LOG OUT</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    menu: {
        position: 'absolute',
        top: 70,
        left: 20,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.outline,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 24,
    },
    arrow: {
        position: 'absolute',
        top: -7,
        left: 16,
        width: 14,
        height: 14,
        backgroundColor: COLORS.surface,
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderColor: COLORS.outline,
        transform: [{ rotate: '45deg' }],
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.outline,
        marginVertical: 4,
        marginHorizontal: 16,
    },
})