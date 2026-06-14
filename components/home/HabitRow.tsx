// components/home/HabitRow.tsx
import React, { useRef, useState } from 'react'
import { TouchableOpacity, View, Text, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING } from '@/constants/theme'
import XpPopAnimation from '@/components/habits/XpPopAnimation'

type Props = {
  title: string
  xp: number
  gold?: number
  difficultyColor?: string
  completed: boolean
  onPress: () => void
}

export default function HabitRow({
  title,
  xp,
  gold = 0,
  difficultyColor = COLORS.dim,
  completed,
  onPress,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const [showPop, setShowPop] = useState(false)

  const handlePress = () => {
    if (completed || showPop) return

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start()

    setShowPop(true)
    setTimeout(() => { onPress() }, 50)
  }

  return (
    <Animated.View style={[styles.root, { transform: [{ scale: scaleAnim }] }]}>
      <XpPopAnimation
        xp={xp}
        gold={gold}
        visible={showPop}
        onFinish={() => setShowPop(false)}
      />

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.btn, completed && styles.btnDone]}
      >
        {/* Tech-Style Checkbox */}
        <View style={[styles.circle, completed && styles.circleDone]}>
          {completed && <Ionicons name="checkmark" size={14} color={COLORS.background} />}
        </View>

        {/* Quest Info */}
        <View style={styles.info}>
          <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.diffContainer}>
            <View style={[styles.diffDot, { backgroundColor: difficultyColor }]} />
            <Text style={styles.diffText}>DIFFICULTY</Text>
          </View>
        </View>

        {/* XP Reward (Accent Color) */}
        <View style={styles.right}>
          {completed ? (
            <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
          ) : (
            <Text style={styles.xpLabel}>+{xp} XP</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant, // Subtle separator
    backgroundColor: 'transparent',
  },
  btnDone: { opacity: 0.6 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 6, // More squared/tech-look
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  circleDone: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  info: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text, // Off-white for better readability
    letterSpacing: 0.2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.dim,
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diffText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.dim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  right: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary, // Neon accent
    letterSpacing: 0.5,
  },
})