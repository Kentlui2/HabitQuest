import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function BiometricLock({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth()
  const [lockState, setLockState] = useState<'checking' | 'locked' | 'unlocked'>('checking')
  const [error, setError] = useState<string | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  }, [])

  const authenticate = useCallback(async () => {
    setError(null)

    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    if (!hasHardware || !isEnrolled) {
      setLockState('unlocked')
      return
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Secure Terminal',
      cancelLabel: 'Sign out',
      disableDeviceFallback: false,
    })

    if (result.success) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setLockState('unlocked')
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setError(result.error === 'user_cancel' ? 'Access cancelled' : 'Authentication failed')
      setLockState('locked')
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setLockState('unlocked')
      return
    }
    authenticate()
  }, [session, authenticate])

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()

  if (lockState === 'unlocked' || lockState === 'checking') {
    return <>{lockState === 'checking' ? null : children}</>
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <View style={styles.content}>

        {/* Header - Sci-Fi Style */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-half" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.logoTitle}>SYSTEM LOCKED</Text>
          <Text style={styles.logoSub}>HabitQuest | Secure Node</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <Text style={styles.instructions}>
            Verification required to access secure data.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.btnPrimary, { transform: [{ scale: scaleAnim }] }]}>
              <Ionicons name="finger-print" size={20} color={COLORS.background} />
              <Text style={styles.btnText}>Authenticate</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={signOut} style={styles.footer}>
          <Text style={styles.footerLink}>Force Sign Out</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg, gap: SPACING.md },

  header: { alignItems: 'center', gap: SPACING.sm },
  logoBadge: {
    width: 72,
    height: 72,
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline
  },
  logoTitle: { fontSize: 24, fontWeight: '800', color: C.textPrimary, letterSpacing: 2 },
  logoSub: { fontSize: 12, color: C.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.outline,
    gap: SPACING.md
  },
  instructions: { fontSize: 16, color: C.textPrimary, textAlign: 'center', lineHeight: 22 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm
  },
  errorText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },

  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md
  },
  btnText: { color: COLORS.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  footer: { alignItems: 'center', marginTop: SPACING.md },
  footerLink: { color: C.textSecondary, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
})