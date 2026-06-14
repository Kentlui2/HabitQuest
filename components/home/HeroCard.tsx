// components/home/HeroCard.tsx
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import HeroPreview from '@/components/HeroPreview'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useHero, DEFAULT_HERO } from '@/context/HeroContext'
import { processMissedDays } from '@/lib/streak'
import { COLORS, RADIUS, SPACING } from '@/constants/theme'

type HeroData = {
  level: number
  xp: number
  xp_to_next: number
  hero_name: string
  class: string
  skin_tone: string
  hair_style: string
  hair_color: string
  eye_color: string
  gender: string
  pet_id: string
  realm_key: string
  platform_key: string
}

export default function HeroCard({ hero: heroProp, refreshTick }: { hero?: any, refreshTick?: number }) {
  const { user } = useAuth()
  const { updateHero } = useHero()
  const [hero, setHero] = useState<HeroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    if (heroProp) {
      setHero(heroProp)
      setLoading(false)
      updateHero(mapHeroToConfig(heroProp))
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
      return
    }
    if (user) fetchHero()
  }, [heroProp, refreshTick, user])

  const fetchHero = async () => {
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('heroes').select('*').eq('user_id', user.id).single()
    if (!data) { setLoading(false); return }
    const updated = await processMissedDays(user.id, data)
    setHero(updated)
    setLoading(false)
    updateHero(mapHeroToConfig(data))
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }

  const mapHeroToConfig = (data: any): any => ({
    hero_name: data.hero_name,
    gender: data.gender,
    skin_tone: data.skin_tone,
    hair_style: data.hair_style,
    hair_color: data.hair_color,
    eye_color: data.eye_color,
    class: data.class,
    pet_id: data.pet_id,
    realm_key: data.realm_key,
    platform_key: data.platform_key,
  })

  if (loading || !hero) return <View style={styles.skeleton} />

  const xpPct = hero ? Math.min(hero.xp / hero.xp_to_next, 1) : 0
  const heroConfig: any = mapHeroToConfig(hero)
  const className = hero.class ? hero.class.toUpperCase() : 'NO CLASS'

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <View style={styles.previewContainer}>
          <HeroPreview hero={heroConfig} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {hero.level}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.heroName}>{hero.hero_name}</Text>
            <Text style={styles.heroClass}>{className}</Text>
          </View>

          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>EXPERIENCE</Text>
              <Text style={styles.xpNumbers}>{hero.xp} / {hero.xp_to_next} XP</Text>
            </View>
            <View style={styles.xpBarOuter}>
              <View style={[styles.xpBarFill, { width: `${Math.round(xpPct * 100)}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  previewContainer: {
    height: 180,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  levelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  contentContainer: { padding: 20 },
  infoRow: { marginBottom: 16 },
  heroName: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  heroClass: { fontSize: 10, fontWeight: '800', color: COLORS.dim, letterSpacing: 2.5, marginTop: 4 },
  xpSection: { marginTop: 4 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontSize: 9, fontWeight: '900', color: COLORS.dim, letterSpacing: 1.2 },
  xpNumbers: { fontSize: 9, fontWeight: '800', color: COLORS.secondary },
  xpBarOuter: { height: 8, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 4 },
  skeleton: { height: 280, backgroundColor: COLORS.surface, borderRadius: 24, marginHorizontal: 20 },
})