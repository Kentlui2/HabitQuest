// app/(auth)/login.tsx
import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Animated, StyleSheet
} from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { makeRedirectUri } from 'expo-auth-session'
import { COLORS, SPACING, RADIUS } from '@/constants/theme'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordRef = useRef<TextInput>(null)
  const mainButtonScale = useRef(new Animated.Value(1)).current
  const googleButtonScale = useRef(new Animated.Value(1)).current

  const [_req, _res, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'habitquest' }),
  })

  const animatePress = (scale: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
  }

  const animateRelease = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Missing fields', 'Fill in everything.')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Login failed', error.message)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>HabitQuest</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="hero@email.com"
              placeholderTextColor={COLORS.dim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.dim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <Animated.View style={{ transform: [{ scale: mainButtonScale }] }}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleLogin}
              onPressIn={() => animatePress(mainButtonScale)}
              onPressOut={() => animateRelease(mainButtonScale)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>ENTER THE REALM</Text>}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.dividerText}>OR</Text><View style={styles.line} />
          </View>

          <Animated.View style={{ transform: [{ scale: googleButtonScale }] }}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => promptAsync()}
              onPressIn={() => animatePress(googleButtonScale)}
              onPressOut={() => animateRelease(googleButtonScale)}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.text} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryBtnText}>Google</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to the Quest? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity><Text style={styles.linkText}>Create Account</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  titleContainer: { alignItems: 'center' }, // New container to manage title alignment
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center', // Centers the text
    marginBottom: 32,    // Adds space below the title
  },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.outlineVariant, padding: 14, fontSize: 16, color: COLORS.text },
  passwordContainer: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.outlineVariant, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed borderBottomWidth and borderBottomColor
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.outlineVariant },
  dividerText: { marginHorizontal: 16, color: COLORS.dim, fontWeight: '700' },
  secondaryBtn: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  secondaryBtnText: { color: COLORS.text, fontWeight: '700', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.dim },
  linkText: { color: COLORS.primary, fontWeight: '800', textDecorationLine: 'underline' }
})