// components/ui/LevelUpModal.tsx
import React, { useEffect, useRef } from 'react'
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native'

const { width: SW } = Dimensions.get('window')

type Props = {
  visible: boolean
  level: number
  heroClass: string
  onClose: () => void
}

const CLASS_COLOR: Record<string, string> = {
  warrior: '#EF4444', mage: '#60A5FA',
  rogue: '#22C55E', paladin: '#F59E0B',
}
const CLASS_EMOJI: Record<string, string> = {
  warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️',
}

export default function LevelUpModal({ visible, level, heroClass, onClose }: Props) {
  const scaleAnim   = useRef(new Animated.Value(0.6)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const glowAnim    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.6)
      opacityAnim.setValue(0)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 80, friction: 7, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 250, useNativeDriver: true,
        }),
      ]).start()

      // Pulsing glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [visible])

  const color = CLASS_COLOR[heroClass] || '#8B5CF6'
  const emoji = CLASS_EMOJI[heroClass] || '⭐'
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] })

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Glow ring */}
          <Animated.View style={[styles.glowRing, { borderColor: color, opacity: glowOpacity }]} />

          {/* Class emoji */}
          <Text style={styles.bigEmoji}>{emoji}</Text>

          {/* Labels */}
          <View style={[styles.levelUpBadge, { backgroundColor: color + '20', borderColor: color + '44' }]}>
            <Text style={[styles.levelUpBadgeText, { color }]}>LEVEL UP!</Text>
          </View>

          <Text style={[styles.levelNumber, { color }]}>Level {level}</Text>
          <Text style={styles.message}>Your hero grows stronger!{'\n'}Keep building those habits.</Text>

          {/* Stat bumps hint */}
          <View style={styles.statHint}>
            <Text style={styles.statHintText}>⚡ XP cap increased  •  🛡️ New shield earned</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: color }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Continue Adventure ✨</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: SW - 48,
    backgroundColor: '#151A24',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    inset: -2, top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 34,
    borderWidth: 2,
  },
  bigEmoji: { fontSize: 64, marginBottom: 4 },
  levelUpBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  levelUpBadgeText: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  levelNumber: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  message: {
    fontSize: 14, color: '#94A3B8', textAlign: 'center',
    lineHeight: 22, fontWeight: '500',
  },
  statHint: {
    backgroundColor: '#1B2230',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, marginTop: 4,
  },
  statHintText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  btn: {
    width: '100%', paddingVertical: 16,
    borderRadius: 18, alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
