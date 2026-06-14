import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics'; // Added Haptics
import { useAuth } from '@/context/AuthContext';
import { useHero } from '@/context/HeroContext'; // Ensure this context provides 'refresh'
import HeroPreview from '@/components/HeroPreview';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ItemData, HeroData } from '@/types/game';

const CATEGORIES: ('weapon' | 'armor' | 'helmet' | 'accessory')[] = ['weapon', 'armor', 'helmet', 'accessory'];

export default function InventoryScreen() {
  const { user } = useAuth();
  const { hero: previewHero, refresh } = useHero(); // Destructure 'refresh'
  const [activeCategory, setActiveCategory] = useState<'weapon' | 'armor' | 'helmet' | 'accessory'>('weapon');
  const [inventoryItems, setInventoryItems] = useState<{ inventoryId: string; item: ItemData }[]>([]);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ inventoryId: string; item: ItemData } | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-fetch every time this screen comes into focus (e.g. after buying from shop)
  useFocusEffect(useCallback(() => { fetchInventory(); }, [user]));

  const fetchInventory = async () => {
    if (!user) return;
    setLoading(true);
    const { data: heroRes } = await supabase.from('heroes').select('*').eq('user_id', user.id).single();
    if (heroRes) {
      setHeroData(heroRes);
      const { data: invRes } = await supabase.from('inventory').select('id, items(*)').eq('hero_id', heroRes.id);
      if (invRes) {
        const mapped = invRes.map(row => ({ inventoryId: row.id, item: row.items as any as ItemData }));
        setInventoryItems(mapped);
      }
    }
    setLoading(false);
  };

  const handleEquipToggle = async () => {
    if (!user || !selectedItem || !heroData) return;

    const slotField = `equipped_${selectedItem.item.slot}` as keyof HeroData;
    const isEquipped = heroData[slotField] === selectedItem.inventoryId;
    const newValue = isEquipped ? null : selectedItem.inventoryId;

    const { error } = await supabase.from('heroes').update({ [slotField]: newValue }).eq('user_id', user.id);

    if (!error) {
      // 1. Local UI Update
      setHeroData({ ...heroData, [slotField]: newValue });

      // 2. Trigger Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 3. Global Context Refresh
      if (refresh) await refresh();
    } else {
      Alert.alert('Error', 'Unable to update equipment');
    }
  };

  const filteredItems = inventoryItems.filter(i => i.item?.slot === activeCategory);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
          <Text style={styles.headerTitle}>ARMORY</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroBox}>
            <HeroPreview hero={heroData as any || previewHero} />
          </View>

          <View style={styles.inspectCard}>
            {selectedItem ? (
              <View style={styles.cardContent}>
                <View style={styles.inspectHeader}>
                  <Text style={styles.itemEmoji}>{selectedItem.item.sprite_key}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{selectedItem.item.name.toUpperCase()}</Text>
                    <Text style={styles.itemRarity}>{selectedItem.item.rarity.toUpperCase()} · {selectedItem.item.slot.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity style={styles.equipBtn} onPress={handleEquipToggle}>
                    <Text style={styles.equipText}>
                      {heroData?.[`equipped_${selectedItem.item.slot}` as keyof HeroData] === selectedItem.inventoryId ? 'UNEQUIP' : 'EQUIP'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statRow}>
                  {(['strength', 'intelligence', 'vitality', 'dexterity', 'wisdom'] as const)
                    .filter(stat => (selectedItem.item[stat] ?? 0) > 0)
                    .map(stat => (
                      <View key={stat} style={styles.statPill}>
                        <Text style={styles.statText}>+{selectedItem.item[stat]} {stat.slice(0, 3).toUpperCase()}</Text>
                      </View>
                    ))
                  }
                  {(['strength', 'intelligence', 'vitality', 'dexterity', 'wisdom'] as const)
                    .every(stat => (selectedItem.item[stat] ?? 0) === 0) && (
                    <Text style={styles.noStatsText}>No stat bonuses</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.emptyPrompt}>SELECT AN ARTIFACT</Text>
            )}
          </View>

          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]} onPress={() => setActiveCategory(cat)}>
                <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.grid}>
            {filteredItems.map(inv => {
              const isSelected = selectedItem?.inventoryId === inv.inventoryId;
              const isEquipped = heroData?.[`equipped_${inv.item.slot}` as keyof HeroData] === inv.inventoryId;
              return (
                <TouchableOpacity key={inv.inventoryId} style={[styles.gridItem, isSelected && styles.gridActive]} onPress={() => setSelectedItem(inv)}>
                  <Text style={styles.emoji}>{inv.item.sprite_key}</Text>
                  {isEquipped && <View style={styles.equippedIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  header: { paddingVertical: SPACING.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary, letterSpacing: 1 },
  heroBox: { height: 200, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  inspectCard: { minHeight: 110, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', padding: SPACING.sm },
  cardContent: { width: '100%', gap: SPACING.xs },
  inspectHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, width: '100%' },
  itemEmoji: { fontSize: 28 },
  itemName: { fontSize: 13, fontWeight: '900', color: C.textPrimary },
  itemRarity: { fontSize: 10, color: COLORS.secondary },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  statPill: { backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  noStatsText: { fontSize: 10, color: C.textTertiary, fontStyle: 'italic' },
  equipBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm },
  equipText: { fontSize: 10, fontWeight: '900', color: '#000' },
  emptyPrompt: { fontSize: 10, color: C.textTertiary, fontWeight: '900', letterSpacing: 1 },
  categoryRow: { flexDirection: 'row', gap: SPACING.xs },
  catBtn: { flex: 1, paddingVertical: SPACING.sm, backgroundColor: C.bgCard, borderRadius: RADIUS.sm, alignItems: 'center' },
  catBtnActive: { backgroundColor: C.bgCardAlt, borderColor: COLORS.primary, borderWidth: 1 },
  catText: { fontSize: 9, fontWeight: '900', color: C.textTertiary },
  catTextActive: { color: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  gridItem: { width: '30%', aspectRatio: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  gridActive: { borderColor: COLORS.primary },
  emoji: { fontSize: 24 },
  equippedIndicator: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, backgroundColor: COLORS.secondary, borderRadius: 4 },
});