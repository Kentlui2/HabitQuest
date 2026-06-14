// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'habitquest-auth-token', // unique key prevents stale token conflicts
  },
})

// Auto-clear stale session on invalid refresh token
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    await AsyncStorage.removeItem('habitquest-auth-token')
  }

  // Token reuse error — wipe session and force fresh login
  if (event === 'TOKEN_REFRESHED' && !session) {
    await AsyncStorage.removeItem('habitquest-auth-token')
    await supabase.auth.signOut()
  }
})