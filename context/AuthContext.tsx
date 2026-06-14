// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth state changes
    // NOTE: event and _event were mixed up — fixed to use `event` consistently
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip TOKEN_REFRESHED — prevents duplicate refresh token consumption in Expo dev
      if (event === 'TOKEN_REFRESHED') return

      setSession(session)
      setLoading(false)

      // Redirect to login on sign out
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    router.replace('/(auth)/login')
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)