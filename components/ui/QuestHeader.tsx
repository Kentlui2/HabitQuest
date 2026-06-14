import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { COLORS, SPACING } from '@/constants/theme'

type Props = {
  gold?: number
  onAvatarPress?: () => void
}

export default function QuestHeader({ gold = 0, onAvatarPress }: Props) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const username = user?.user_metadata?.username
  const cls = user?.user_metadata?.class

  const getGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return `MORNING, ${cls}`
    if (hours < 17) return `AFTERNOON, ${cls}`
    return `EVENING, ${cls}`
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.row}>
        {/* User Badge */}
        <TouchableOpacity style={styles.left} onPress={onAvatarPress} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.secondary} />
          </View>
          <View style={styles.greetingBox}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
        </TouchableOpacity>

        {/* Currency Widget */}
        <View style={styles.goldWidget}>
          <Ionicons name="ellipse" size={10} color={COLORS.secondary ?? '#00E5FF'} />
          <Text style={styles.goldText}>{gold.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBox: { gap: 2 },
  greeting: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.dim,
    letterSpacing: 1.2,
  },
  username: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  goldWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  goldText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
})