import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AvatarBadge from './AvatarBadge'
import { FriendRequest } from './types'

type Props = {
    requests: FriendRequest[]
    onRespond: (id: string, accept: boolean) => void
}

export default function PendingRequests({ requests, onRespond }: Props) {
    if (requests.length === 0) return null

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>INCOMING PLEDGES [{requests.length}]</Text>
            {requests.map(req => (
                <View key={req.id} style={styles.requestCard}>
                    {/* Dynamic class assignment fixed from static warrior mapping */}
                    <AvatarBadge heroClass={req.class || 'warrior'} size={40} />

                    <View style={styles.requestInfo}>
                        <Text style={styles.requestUsername}>{req.username.toUpperCase()}</Text>
                        <Text style={styles.requestHero}>{req.hero_name.toUpperCase()}</Text>
                    </View>

                    {/* Accept Execution Action - Mint/Teal Confirmation */}
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => onRespond(req.id, true)} activeOpacity={0.8}>
                        <Ionicons name="checkmark-sharp" size={18} color="#060B13" />
                    </TouchableOpacity>

                    {/* Decline Execution Action - Muted Crimson/Red Contextual Edge */}
                    <TouchableOpacity style={styles.declineBtn} onPress={() => onRespond(req.id, false)} activeOpacity={0.8}>
                        <Ionicons name="close-sharp" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    section: { gap: 10 },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: 1.5
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
    },
    requestInfo: {
        flex: 1
    },
    requestUsername: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    requestHero: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '700',
        marginTop: 1
    },
    acceptBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#2DD4BF', // Verified execution token
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    declineBtn: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)', // Aligned Crimson/Red layout element bounds
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
})