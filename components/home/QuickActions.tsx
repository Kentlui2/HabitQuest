// components/home/QuickActions.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { C } from '@/constants/theme'

type Action = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  route: string
}

const ACTIONS: Action[] = [
  { label: 'HABITS', icon: 'flash-sharp', color: C.orange, route: '/(tabs)/habits' },
  { label: 'QUESTS', icon: 'journal-sharp', color: '#FBBF24', route: '/(tabs)/quests' },
  { label: 'RANKING', icon: 'trophy-sharp', color: '#2DD4BF', route: '/(tabs)/leaderboard' },
  { label: 'ARMORY', icon: 'shield-sharp', color: '#ad897e', route: '/(tabs)/inventory' },
]

export default function QuickActions() {
  return (
    <View style={styles.root}>
      {ACTIONS.map(action => (
        <TouchableOpacity
          key={action.label}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.8}
          style={styles.btn}
        >
          <Ionicons name={action.icon} size={20} color={action.color} />
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  btn: {
    flex: 1,
    backgroundColor: '#152031',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: '#000',
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ad897e',
    letterSpacing: 1.5,
  },
})

