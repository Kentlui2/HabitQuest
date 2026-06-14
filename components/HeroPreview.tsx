// components/HeroPreview.tsx
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native'
import { HeroData } from '@/types/game'

const { width: SW } = Dimensions.get('window')
const PREVIEW_H = SW * 0.55

// ── Asset Registries ──────────────────────────────────────
const BODY_SPRITES: Record<string, any> = {
  light: require('@/assets/sprites/1.png'), // Replace with your actual paths
  /* tan: require('@/assets/sprites/body_tan.png'),
   dark: require('@/assets/sprites/body_dark.png'),*/
}

const EYE_SPRITES: Record<string, any> = {
  // blue: require('@/assets/sprites/eyes_blue.png'),
  //green: require('@/assets/sprites/eyes_green.png'),
  brown: require('@/assets/sprites/5.png'),
}

const HAIR_SPRITES: Record<string, any> = {
  short_brown: require('@/assets/sprites/4.png'),
  // long_blonde: require('@/assets/sprites/hair_long_blonde.png'),
}

const CLASS_SPRITES: Record<string, any> = {
  warrior: require('@/assets/sprites/2.png'),
  /*mage: require('@/assets/sprites/class_mage.png'),
  rogue: require('@/assets/sprites/class_rogue.png'),
  paladin: require('@/assets/sprites/class_paladin.png'),*/
}

const PET_SPRITES: Record<string, any> = {
  slime: require('@/assets/sprites/3.png'),
  /* wolf: require('@/assets/sprites/pet_wolf.png'),
   bird: require('@/assets/sprites/pet_bird.png'),*/
}

const BG_SPRITES: Record<string, any> = {
  forest: require('@/assets/sprites/forest_bg.png'),
}

// ── Logic ─────────────────────────────────────────────────
const CLASS_COLOR: Record<string, string> = {
  warrior: '#C0392B', mage: '#4A90D9', rogue: '#27AE60', paladin: '#F5A623',
}
const CLASS_EMOJI: Record<string, string> = {
  warrior: '⚔️', mage: '🔮', rogue: '🗡️', paladin: '🛡️',
}

const getSprite = (category: string, key: string) => {
  switch (category) {
    case 'bg': return require('@/assets/sprites/forest_bg.png')
    // Fallback to 'light' (exists in BODY_SPRITES)
    case 'body': return BODY_SPRITES[key] || BODY_SPRITES['light']
    // Fallback to 'brown' (exists in EYE_SPRITES)
    case 'eyes': return EYE_SPRITES[key] || EYE_SPRITES['brown']
    // Fallback to 'short_brown' (exists in HAIR_SPRITES)
    case 'hair': return HAIR_SPRITES[key] || HAIR_SPRITES['short_brown']
    // Fallback to 'warrior' (exists in CLASS_SPRITES)
    case 'class': return CLASS_SPRITES[key] || CLASS_SPRITES['warrior']
    // Fallback to 'slime' (exists in PET_SPRITES)
    case 'pet': return PET_SPRITES[key] || PET_SPRITES['slime']
    default: return null
  }
}

type Props = { hero: HeroData }

export default function HeroPreview({ hero }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start()

    Animated.spring(scaleAnim, {
      toValue: 1, tension: 100, friction: 8, useNativeDriver: true,
    }).start()
  }, [])

  const classColor = CLASS_COLOR[hero.class] || '#999'

  return (
    <View style={[styles.container, { height: PREVIEW_H }]}>
      <Image source={getSprite('bg', hero.realm_key)} style={styles.bgLayer} resizeMode="cover" />

      <Animated.View style={[styles.heroContainer, {
        transform: [{ translateY: floatAnim }, { scale: scaleAnim }],
      }]}>
        <Image source={getSprite('pet', hero.pet_id)} style={styles.petLayer} resizeMode="contain" />

        <Image source={getSprite('body', hero.skin_tone)} style={styles.heroLayer} resizeMode="contain" />
        <Image source={getSprite('eyes', hero.eye_color)} style={styles.heroLayer} resizeMode="contain" />
        <Image source={getSprite('hair', hero.hair_style)} style={styles.heroLayer} resizeMode="contain" />
        <Image source={getSprite('class', hero.class)} style={styles.heroLayer} resizeMode="contain" />

        <View style={[styles.classBadge, { backgroundColor: classColor }]}>
          <Text style={styles.classBadgeText}>{CLASS_EMOJI[hero.class]}</Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#081425' // Fallback bg
  },
  bgLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  heroLayer: {
    position: 'absolute',
    width: '110%',  // Slightly larger than container to look good against BG
    height: '110%',
    bottom: -15, // Tweak bottom offset depending on how the sprite is cropped
  },
  petLayer: {
    position: 'absolute',
    width: '35%',
    height: '35%',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  classBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 20,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  classBadgeText: { fontSize: 16 },
})
