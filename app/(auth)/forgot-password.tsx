// app/(auth)/forgot-password.tsx
import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Animated, StyleSheet
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { COLORS, RADIUS } from '@/constants/theme'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current
  const backButtonScale = useRef(new Animated.Value(1)).current

  const animatePress = (scale: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
  }

  const animateRelease = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  const handleReset = async () => {
    if (!email) {
      return Alert.alert('Enter your email', 'We need your email to send the reset link.')
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'habitQuest://reset-password',
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={[styles.iconBadge, sent && styles.iconBadgeSuccess]}>
            <Ionicons
              name={sent ? 'mail-open' : 'key'}
              size={36}
              color={sent ? COLORS.success : COLORS.primary}
            />
          </View>
          <Text style={styles.title}>{sent ? 'Check Your Inbox' : 'Reset Password'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? `A recovery link has been sent to ${email}`
              : 'Enter your email to receive a reset link'}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {!sent ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="hero@email.com"
                    placeholderTextColor={COLORS.dim}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleReset}
                  onPressIn={() => animatePress(buttonScale)}
                  onPressOut={() => animateRelease(buttonScale)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={32} color="#fff" />
              </View>
              <Text style={styles.successText}>Check your inbox and follow the link to reset your password.</Text>

              <Animated.View style={{ transform: [{ scale: backButtonScale }], width: '100%' }}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.replace('/(auth)/login')}
                  onPressIn={() => animatePress(backButtonScale)}
                  onPressOut={() => animateRelease(backButtonScale)}
                >
                  <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Footer Link */}
        {!sent && (
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}
            style={styles.footerLink}
          >
            <Ionicons name="arrow-back" size={14} color={COLORS.dim} style={{ marginRight: 6 }} />
            <Text style={styles.footerLinkText}>Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  iconBadge: { width: 80, height: 80, borderRadius: RADIUS.xl, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8 },
  iconBadgeSuccess: { shadowColor: COLORS.success },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 16, textAlign: 'center' },
  subtitle: { color: COLORS.dim, fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
  inputRow: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.outlineVariant, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
    // borderBottomWidth and borderBottomColor removed
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  successContainer: { alignItems: 'center' },
  checkCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successText: { color: COLORS.text, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  secondaryBtn: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  secondaryBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerLinkText: { color: COLORS.dim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }
})