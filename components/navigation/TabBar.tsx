// components/navigation/TabBar.tsx

import React from 'react'
import {
    View,
    StyleSheet,
    Text,
    Platform,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'

type TabIconProps = {
    activeName: keyof typeof Ionicons.glyphMap
    inactiveName: keyof typeof Ionicons.glyphMap
    focused: boolean
    label: string
}

export function TabIcon({
    activeName,
    inactiveName,
    focused,
    label,
}: TabIconProps) {
    return (
        <View style={styles.wrapper}>
            {focused ? (
                <View style={styles.activePill}>
                    <Ionicons
                        name={activeName}
                        size={18}
                        color="#FFFFFF"
                    />

                    <Text
                        numberOfLines={1}
                        style={styles.activeText}
                    >
                        {label}
                    </Text>
                </View>
            ) : (
                <Ionicons
                    name={inactiveName}
                    size={22}
                    color="rgba(255,255,255,0.45)"
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        minWidth: 82,
        height: 38,

        paddingHorizontal: 14,

        borderRadius: 19,

        backgroundColor: '#007AFF',
    },

    activeText: {
        color: '#FFFFFF',

        marginLeft: 6,

        fontSize: 12,
        fontWeight: '700',

        includeFontPadding: false,

        fontFamily:
            Platform.OS === 'ios'
                ? 'System'
                : 'sans-serif-medium',
    },
})