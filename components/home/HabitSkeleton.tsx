// components/home/HabitSkeleton.tsx
import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import { COLORS } from '@/constants/theme'

function SkeletonRow({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.6,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }, delay)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <Animated.View
      style={{
        opacity: anim,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 52,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.outlineVariant,
      }}
    >
      {/* Circle placeholder */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: COLORS.surface2,
          marginRight: 16,
        }}
      />
      {/* Text placeholders */}
      <View style={{ flex: 1, gap: 6 }}>
        <View
          style={{
            width: '60%',
            height: 10,
            backgroundColor: COLORS.surface2,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            width: '30%',
            height: 8,
            backgroundColor: COLORS.surface2,
            borderRadius: 4,
          }}
        />
      </View>
      {/* Right placeholder */}
      <View
        style={{
          width: 24,
          height: 10,
          backgroundColor: COLORS.surface2,
          borderRadius: 4,
          marginLeft: 16,
        }}
      />
    </Animated.View>
  )
}

export default function HabitSkeleton() {
  return (
    <View>
      <SkeletonRow delay={0} />
      <SkeletonRow delay={120} />
      <SkeletonRow delay={240} />
    </View>
  )
}