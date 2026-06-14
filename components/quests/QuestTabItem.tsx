// components/quests/QuestTabItem.tsx
import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { C, COLORS } from '@/constants/theme'

type Props = {
  quest: {
    id: string
    title: string
    description?: string
    icon_emoji: string
    xp_reward: number
    gold_reward: number
    progress: number
    target_count: number
    is_completed: boolean
    claimed_at?: string | null
  }
  onClaim?: (id: string) => void
}

export default function QuestTabItem({ quest, onClaim }: Props) {
  const pct = Math.min((quest.progress / quest.target_count) * 100, 100)
  const isFinished = quest.progress >= quest.target_count
  const isClaimed = !!quest.claimed_at

  // Standardize flip states. If already in progress or completed, load it revealed.
  const hasStartedProgress = quest.progress > 0 || isFinished || isClaimed
  const [isFlipped, setIsFlipped] = useState(hasStartedProgress)

  const fadeAnim = useRef(new Animated.Value(1)).current

  const handleRevealCard = () => {
    if (isFlipped) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(true)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })
  }

  const handleClaimReward = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onClaim?.(quest.id)
  }

  return (
    <View style={styles.gridWrapper}>
      {!isFlipped ? (
        /* ==================== CARD FRONT STATE (UNREVEALED MYSTERY) ==================== */
        <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.cardFront}
            onPress={handleRevealCard}
            activeOpacity={0.8}
          >
            <View style={styles.mysteryInner}>
              <Ionicons name="help-circle-outline" size={24} color="#FFD700" style={styles.pulseQuestion} />
              <Text style={styles.mysteryTitle}>MYSTERY</Text>

              {/* Core Reward Preview Skin */}
              <View style={styles.compactRewardBadge}>
                <Text style={styles.compactRewardText}>⚡ {quest.xp_reward}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        /* ==================== CARD BACK STATE (REVEALED ACTIVE QUEST) ==================== */
        <Animated.View
          style={[
            styles.cardBack,
            isClaimed && styles.cardClaimed,
            isFinished && !isClaimed && styles.cardFinishedHighlight,
            { opacity: fadeAnim }
          ]}
        >
          {/* Active Status Header Accent */}
          {isFinished && !isClaimed && (
            <View style={styles.miniReadyBadge}>
              <Text style={styles.miniReadyText}>READY</Text>
            </View>
          )}

          <View style={styles.revealedLayout}>
            {/* Main Visual Core Row */}
            <View style={styles.topRow}>
              <Text style={styles.emojiIcon}>{isClaimed ? '✅' : quest.icon_emoji}</Text>
              <Text style={[styles.title, isClaimed && styles.textMuted]} numberOfLines={1}>
                {quest.title}
              </Text>
            </View>

            {/* Tracking Progress Node */}
            <View style={styles.progressContainer}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${pct}%` as any },
                    isFinished && { backgroundColor: COLORS.secondary }
                  ]}
                />
              </View>
              <Text style={styles.progressLabel} numberOfLines={1}>
                {isClaimed ? 'CLAIMED' : `${quest.progress}/${quest.target_count}`}
              </Text>
            </View>

            {/* Dynamic Claim Trigger CTA Elements */}
            {isFinished && !isClaimed ? (
              <TouchableOpacity
                style={styles.compactClaimBtn}
                onPress={handleClaimReward}
                activeOpacity={0.85}
              >
                <Text style={styles.claimBtnText}>CLAIM</Text>
              </TouchableOpacity>
            ) : isClaimed ? (
              <View style={styles.compactClaimedStatus}>
                <Text style={styles.claimedStatusText}>DONE</Text>
              </View>
            ) : (
              /* Ongoing Quest Rewards Indicator Footer */
              <View style={styles.compactRewardRow}>
                <Text style={styles.miniRewardText}>⚡{quest.xp_reward}</Text>
                <Text style={[styles.miniRewardText, { color: COLORS.gold }]}>💎{quest.gold_reward}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  gridWrapper: {
    width: '31.3%',
    aspectRatio: 1,
    margin: '1%',
  },

  /* SQUARE FRONT SKINS */
  cardFront: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: `${COLORS.gold}26`,
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
  },
  mysteryInner: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${COLORS.gold}33`,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  pulseQuestion: {
    marginBottom: 2,
    opacity: 0.8,
  },
  mysteryTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.dim,
    letterSpacing: 1,
  },
  compactRewardBadge: {
    marginTop: 6,
    backgroundColor: `${COLORS.gold}14`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactRewardText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gold,
  },

  /* REVEALED BACK SQUARE DECK LAYOUTS */
  cardBack: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    position: 'relative',
  },
  cardClaimed: {
    opacity: 0.4,
    backgroundColor: COLORS.background,
    borderColor: COLORS.outline,
  },
  cardFinishedHighlight: {
    borderColor: `${COLORS.secondary}40`,
    backgroundColor: `${COLORS.secondary}05`,
  },
  revealedLayout: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRow: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  emojiIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    width: '100%',
    textAlign: 'center',
  },
  textMuted: {
    color: COLORS.dim,
  },

  /* MINI FLOATING BADGES */
  miniReadyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 10,
  },
  miniReadyText: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.background,
  },

  /* COMPACT SQUARE PROGRESS TRACKS */
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
  },
  track: {
    width: '90%',
    height: 4,
    backgroundColor: COLORS.outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.dim,
  },

  /* SQUARE ACTION INTERACTION ELEMENTS */
  compactRewardRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  miniRewardText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.dim,
  },
  compactClaimBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimBtnText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  compactClaimedStatus: {
    backgroundColor: `${COLORS.secondary}0D`,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}1A`,
    width: '100%',
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimedStatusText: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 9,
  },
})