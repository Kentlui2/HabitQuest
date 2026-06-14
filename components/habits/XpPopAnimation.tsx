// components/habits/XpPopAnimation.tsx
import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View, Dimensions } from 'react-native'
import { COLORS } from '@/constants/theme'

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = Math.random() * Math.PI * 2
  const velocity = Math.random() * 80 + 40
  return {
    id: i,
    x: Math.cos(angle) * velocity,
    y: Math.sin(angle) * velocity - 20,
    size: Math.random() * 6 + 4,
    color: [COLORS.secondary, COLORS.primary, COLORS.tertiary, '#FFFFFF', COLORS.danger][i % 5],
    duration: 800 + Math.random() * 400,
    rotation: Math.random() * 360,
  }
})

type ParticleProps = {
  x: number; y: number; size: number; color: string; duration: number; rotation: number; visible: boolean
}

function ConfettiParticle({ x, y, size, color, duration, rotation, visible }: ParticleProps) {
  const animX = useRef(new Animated.Value(0)).current
  const animY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return
    animX.setValue(0)
    animY.setValue(0)
    opacity.setValue(0)

    Animated.parallel([
      Animated.timing(animX, { toValue: x, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(animY, { toValue: y, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: duration - 200, delay: 150, useNativeDriver: true }),
      ]),
    ]).start()
  }, [visible])

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateX: animX }, { translateY: animY }],
        },
      ]}
    />
  )
}

type Props = { xp: number; gold: number; visible: boolean; onFinish: () => void }

export default function XpPopAnimation({ xp, gold, visible, onFinish }: Props) {
  const pillScale = useRef(new Animated.Value(0)).current
  const pillY = useRef(new Animated.Value(0)).current
  const pillOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return
    pillScale.setValue(0)
    pillY.setValue(0)
    pillOpacity.setValue(1)

    Animated.sequence([
      Animated.spring(pillScale, { toValue: 1, tension: 320, friction: 12, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(pillY, { toValue: -140, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(pillOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => onFinish())
  }, [visible])

  if (!visible) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {PARTICLES.map((p) => <ConfettiParticle key={p.id} {...p} visible={visible} />)}
      <Animated.View style={[styles.pill, { opacity: pillOpacity, transform: [{ scale: pillScale }, { translateY: pillY }] }]}>
        <View style={styles.section}>
          <Text style={styles.xpValue}>+{xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.goldValue}>+{gold}</Text>
          <Text style={styles.goldLabel}>GOLD</Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  particle: { position: 'absolute', top: '50%', left: '50%' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2, // Elevated structural backing
    borderWidth: 2,
    borderColor: COLORS.secondary, // Wrapped in pure Vibrant Teal
    borderRadius: 24,
    padding: 4,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  section: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  xpValue: { fontSize: 22, fontWeight: '900', color: COLORS.secondary },
  xpLabel: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, letterSpacing: 1.5 },
  divider: { width: 1, height: 32, backgroundColor: COLORS.outlineVariant },
  goldValue: { fontSize: 22, fontWeight: '900', color: COLORS.tertiary },
  goldLabel: { fontSize: 10, fontWeight: '800', color: COLORS.tertiary, letterSpacing: 1.5 },
})