// app/(onboarding)/index.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions,
  Alert, ActivityIndicator, FlatList, Animated, StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useHero } from '@/context/HeroContext';
import HeroPreview from '@/components/HeroPreview';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

const SKIN_TONES = [
  { key: 'light', label: 'Light' },
  { key: 'fair', label: 'Fair' },
  { key: 'medium', label: 'Medium' },
  { key: 'olive', label: 'Olive' },
  { key: 'dark', label: 'Dark' },
  { key: 'deep', label: 'Deep' }
];

const EYE_COLORS = [
  { key: 'brown', label: 'Brown' },
  { key: 'blue', label: 'Blue' },
  { key: 'green', label: 'Green' },
  { key: 'purple', label: 'Purple' },
  { key: 'red', label: 'Red' },
  { key: 'teal', label: 'Teal' }
];

const HAIR_STYLES = [
  { key: 'spiky', label: 'Spiky' },
  { key: 'wavy', label: 'Wavy' },
  { key: 'long', label: 'Long' },
  { key: 'ponytail', label: 'Ponytail' },
  { key: 'bun', label: 'Bun' },
  { key: 'afro', label: 'Afro' },
  { key: 'braids', label: 'Braids' },
  { key: 'mohawk', label: 'Mohawk' }
];

const CLASSES = [
  { key: 'warrior', label: 'Warrior', desc: 'Melee combat specialist' },
  { key: 'mage', label: 'Mage', desc: 'Arcane spellcaster' },
  { key: 'rogue', label: 'Rogue', desc: 'Stealth and shadow hunter' },
  { key: 'paladin', label: 'Paladin', desc: 'Holy shield defender' }
];

const PETS = [
  { key: 'fox', label: 'Fox' },
  { key: 'wolf', label: 'Wolf' },
  { key: 'owl', label: 'Owl' },
  { key: 'cat', label: 'Cat' },
  { key: 'dragon', label: 'Dragon' },
  { key: 'slime', label: 'Slime' }
];

const STEPS = [
  { key: 'name', label: 'Hero Name' },
  { key: 'class', label: 'Class Type' },
  { key: 'skin_tone', label: 'Skin Tone' },
  { key: 'hair_style', label: 'Hair Style' },
  { key: 'eye_color', label: 'Eye Color' },
  { key: 'pet_id', label: 'Pet Companion' }
];

export default function CharacterCreator() {
  const { user } = useAuth();
  const { hero, updateHero, refresh } = useHero();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const listRef = useRef<FlatList>(null);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const goTo = (s: number) => {
    triggerHaptic('light');
    setStep(s);
    listRef.current?.scrollToIndex({ index: s, animated: true });
  };

  const handleFinish = async () => {
    triggerHaptic('heavy');
    if (!hero.hero_name.trim()) {
      Alert.alert('System Error', 'Unit ID (Name) is required.');
      goTo(0);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('heroes')
        .upsert({
          user_id: user?.id,
          name: hero.hero_name.trim(),
          class: hero.class,
          skin_tone: hero.skin_tone,
          hair_style: hero.hair_style,
          hair_color: hero.hair_color,
          eye_color: hero.eye_color,
          pet_id: hero.pet_id,
          realm_key: hero.realm_key,
          platform_key: hero.platform_key,
          is_onboarded: true,
          level: 1,
          gold: 0,
          xp: 0,
          weekly_xp: 0,
        });

      if (error) throw error;

      // Update user metadata or profile if needed
      await supabase
        .from('profiles')
        .update({ is_onboarded: true })
        .eq('id', user?.id);

      await refresh();
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Could not initialize hero.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>IDENTIFY YOUR HERO</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Hero Name..."
              placeholderTextColor={COLORS.dim}
              value={hero.hero_name}
              onChangeText={(t) => updateHero({ hero_name: t })}
              maxLength={20}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>SELECT YOUR CLASS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
              {CLASSES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.optionCard, hero.class === c.key && styles.optionCardActive]}
                  onPress={() => { triggerHaptic('light'); updateHero({ class: c.key as any }); }}
                >
                  <Text style={styles.optionEmoji}>
                    {c.key === 'warrior' ? '⚔️' : c.key === 'mage' ? '🔮' : c.key === 'rogue' ? '🗡️' : '🛡️'}
                  </Text>
                  <Text style={styles.optionLabel}>{c.label.toUpperCase()}</Text>
                  <Text style={styles.optionDesc}>{c.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>CHOOSE SKIN TONE</Text>
            <View style={styles.grid}>
              {SKIN_TONES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.gridItem, hero.skin_tone === s.key && styles.gridItemActive]}
                  onPress={() => { triggerHaptic('light'); updateHero({ skin_tone: s.key as any }); }}
                >
                  <Text style={styles.gridItemText}>{s.label.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>CHOOSE HAIR STYLE</Text>
            <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {HAIR_STYLES.map((h) => (
                <TouchableOpacity
                  key={h.key}
                  style={[styles.gridItem, hero.hair_style === h.key && styles.gridItemActive]}
                  onPress={() => { triggerHaptic('light'); updateHero({ hair_style: h.key as any }); }}
                >
                  <Text style={styles.gridItemText}>{h.label.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>CHOOSE EYE COLOR</Text>
            <View style={styles.grid}>
              {EYE_COLORS.map((e) => (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.gridItem, hero.eye_color === e.key && styles.gridItemActive]}
                  onPress={() => { triggerHaptic('light'); updateHero({ eye_color: e.key as any }); }}
                >
                  <Text style={styles.gridItemText}>{e.label.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>CHOOSE COMPANION</Text>
            <View style={styles.grid}>
              {PETS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.gridItem, hero.pet_id === p.key && styles.gridItemActive]}
                  onPress={() => { triggerHaptic('light'); updateHero({ pet_id: p.key as any }); }}
                >
                  <Text style={styles.gridItemText}>{p.label.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* ═══ HEADER PREVIEW ═══ */}
      <View style={styles.previewContainer}>
        <HeroPreview hero={hero} />

        {/* Progress Tape */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: `${((step + 1) / 6) * 100}%` }]} />
        </View>
      </View>

      {/* ═══ COMMAND TERMINAL (BOTTOM SHEET) ═══ */}
      <View style={styles.terminal}>
        {saving ? (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.savingText}>INITIALIZING HERO DATA...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={STEPS}
            scrollEnabled={false}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ index }) => (
              <View style={{ width: SW }}>
                {renderStepContent(index)}
              </View>
            )}
            keyExtractor={(item) => item.key}
          />
        )}

        {/* ═══ NAVIGATION ═══ */}
        {!saving && (
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0}
              style={[styles.navBtn, { opacity: step === 0 ? 0.3 : 1 }]}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.stepIndicator}>{step + 1} / {STEPS.length}</Text>

            <TouchableOpacity
              onPress={step === STEPS.length - 1 ? handleFinish : () => goTo(Math.min(STEPS.length - 1, step + 1))}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>
                {step === STEPS.length - 1 ? 'INITIALIZE' : 'NEXT PHASE'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  previewContainer: { height: SH * 0.45, position: 'relative' },
  progressBarBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#1A1A2E' },
  progressBar: { height: '100%', backgroundColor: COLORS.primary },

  terminal: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 30, 0.95)', // Glass effect
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: SPACING.md,
  },

  stepContent: {
    width: SW,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 12,
  },

  stepTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#121B2E',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: '#FFF',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    fontWeight: '600',
    fontSize: 16,
  },

  optionsScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 24,
  },

  optionCard: {
    width: 140,
    height: 140,
    backgroundColor: '#121B2E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
  },

  optionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },

  optionLabel: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },

  optionDesc: {
    color: COLORS.dim,
    fontSize: 9,
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  gridItem: {
    width: '30%',
    backgroundColor: '#121B2E',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gridItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
  },

  gridItemText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
  },

  savingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  savingText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  navBtn: {
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  actionBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  stepIndicator: { fontFamily: 'monospace', color: COLORS.dim, fontSize: 12 }
});