import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { HeroData } from '@/types/game'

export const DEFAULT_HERO: HeroData = {
  id: '',
  user_id: '',
  hero_name: 'Hero',
  class: 'warrior',
  level: 1,
  xp: 0,
  xp_to_next: 100,
  gold: 0,
  strength: 10,
  intelligence: 10,
  vitality: 10,
  dexterity: 10,
  wisdom: 10,
  gender: 'male',
  skin_tone: 'medium',
  hair_style: 'spiky',
  hair_color: 'black',
  eye_color: 'brown',
  pet_id: 'fox',
  realm_key: 'forest',
  platform_key: 'grass',
  equipped_weapon: null,
  equipped_armor: null,
  equipped_helmet: null,
  equipped_accessory: null,
  current_streak: 0,
  longest_streak: 0,
  streak_shields: 0,
}

type HeroContextType = {
  hero: HeroData
  setHero: (hero: HeroData) => void
  updateHero: (patch: Partial<HeroData>) => void
  refresh: () => Promise<void>
}

const HeroContext = createContext<HeroContextType>({
  hero: DEFAULT_HERO,
  setHero: () => { },
  updateHero: () => { },
  refresh: async () => { },
})

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [hero, setHero] = useState<HeroData>(DEFAULT_HERO)

  // Fetch hero data from Supabase
  const refresh = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data && !error) {
      setHero(data as HeroData)
    }
  }

  // Initial load
  useEffect(() => {
    if (user) refresh()
  }, [user])

  const updateHero = (patch: Partial<HeroData>) =>
    setHero(prev => ({ ...prev, ...patch }))

  return (
    <HeroContext.Provider value={{ hero, setHero, updateHero, refresh }}>
      {children}
    </HeroContext.Provider>
  )
}

export const useHero = () => useContext(HeroContext)