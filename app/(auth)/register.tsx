// app/(auth)/register.tsx
import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Animated, StyleSheet,
  TextInput as RNTextInput,
  ViewStyle
} from 'react-native'
import { Link, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { COLORS, RADIUS } from '@/constants/theme'

// ── Password strength helper ──────────────────────────────
const getPasswordStrength = (pw: string) => {
  if (pw.length === 0) return { label: '', color: 'transparent', width: '0%' }
  if (pw.length < 6) return { label: 'Weak', color: COLORS.danger, width: '25%' }
  if (pw.length < 8) return { label: 'Okay', color: COLORS.warning, width: '50%' }
  if (pw.length < 10 || !/[!@#$%^&*]/.test(pw)) return { label: 'Good', color: COLORS.warning, width: '75%' }
  return { label: 'Strong', color: COLORS.success, width: '100%' }
}

export default function RegisterScreen() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailRef = useRef<RNTextInput>(null)
  const passwordRef = useRef<RNTextInput>(null)
  const confirmRef = useRef<RNTextInput>(null)
  const buttonScale = useRef(new Animated.Value(1)).current

  const animatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start()
  }

  const animateRelease = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()
  }

  const handleRegister = async () => {
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match')

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    })
    setLoading(false)
    if (error) {
      Alert.alert('Registration failed', error.message)
    } else {
      router.push({ pathname: '/(auth)/verify', params: { email } })
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={styles.card}>
          <InputGroup label="Username" placeholder="Ken the Great" value={username} onChangeText={setUsername} returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
          <InputGroup ref={emailRef} label="Email" placeholder="hero@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput ref={passwordRef} style={styles.inputFlex} placeholder="8+ characters" placeholderTextColor={COLORS.dim} value={password} onChangeText={setPassword} secureTextEntry={!showPass} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.primary} /></TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBg}>
                  <View style={[styles.strengthFill, { width: passwordStrength.width, backgroundColor: passwordStrength.color } as ViewStyle]} />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
              </View>
            )}
          </View>

          <InputGroup ref={confirmRef} label="Confirm Password" placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={handleRegister} />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} onPressIn={animatePress} onPressOut={animateRelease} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>BEGIN YOUR QUEST</Text>}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already a hero? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.linkText}>Sign In</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const InputGroup = React.forwardRef(({ label, ...props }: any, ref) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput ref={ref} {...props} style={styles.inputFlex} placeholderTextColor={COLORS.dim} />
    </View>
  </View>
))

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  titleContainer: { alignItems: 'center' },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 32
  },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
  inputRow: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.outlineVariant, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  strengthContainer: { marginTop: 6, marginLeft: 4 },
  strengthBg: { height: 4, width: '100%', backgroundColor: COLORS.outlineVariant, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16, // Corrected from 800
    fontWeight: '800',
    letterSpacing: 2
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.dim },
  linkText: { color: COLORS.primary, fontWeight: '800', textDecorationLine: 'underline' }
})