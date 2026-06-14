// app/_layout.tsx
import { useCallback, useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { HeroProvider } from '@/context/HeroContext'
import BiometricLock from '@/components/BiometricLock'
import { supabase } from '@/lib/supabase'
import './global.css'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  const checkOnboardingStatus = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('heroes')
      .select('is_onboarded')
      .eq('user_id', session.user.id)
      .single()

    if (data?.is_onboarded) {
      router.replace('/(tabs)/home')
    } else {
      // Temporarily bypass onboarding and route directly to main app
      router.replace('/(tabs)/home')
    }
  }, [session, router])

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inTabs = segments[0] === '(tabs)'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    if (session && !inOnboarding && !inTabs) {
      checkOnboardingStatus()
    }
  }, [session, loading, segments, router, checkOnboardingStatus])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BiometricLock>
        <HeroProvider>
          <AuthGate>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AuthGate>
        </HeroProvider>
      </BiometricLock>
    </AuthProvider>
  )
}