import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
  LayoutAnimation, Platform, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useHero } from '@/context/HeroContext';
import { supabase } from '@/lib/supabase';
import { ItemData } from '@/types/game';
import { COLORS, C, SPACING, RADIUS } from '@/constants/theme';

if (Platform.OS === 'android') {
  // Use optional chaining to safely check and invoke
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function ShopScreen() {
  const { user } = useAuth();
  const { refresh: refreshHeroContext } = useHero();
  const [items, setItems] = useState<ItemData[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set());
  const [gold, setGold] = useState<number>(0);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => { fetchShopData(); }, []);

  const fetchShopData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: heroRes } = await supabase.from('heroes').select('id, gold').eq('user_id', user.id).single();
    if (heroRes) {
      setGold(heroRes.gold || 0);
      setHeroId(heroRes.id);
      const { data: invRes } = await supabase.from('inventory').select('item_id').eq('hero_id', heroRes.id);
      if (invRes) setOwnedItemIds(new Set(invRes.map(i => i.item_id)));
    }
    const { data: itemsData } = await supabase.from('items').select('*').eq('is_purchasable', true).order('gold_cost', { ascending: true });
    if (itemsData) setItems(itemsData as ItemData[]);
    setLoading(false);
  };

  const handlePurchase = async (item: ItemData) => {
    if (!user || !heroId || gold < item.gold_cost || purchasing) return;

    // 2. Snapshot for potential rollback
    const prevGold = gold;
    const prevOwned = new Set(ownedItemIds);

    // 3. Trigger Animation & Optimistic Update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPurchasing(item.id);
    setGold(prev => prev - item.gold_cost);
    setOwnedItemIds(prev => new Set(prev).add(item.id));

    try {
      const { error: upErr } = await supabase.from('heroes').update({ gold: prevGold - item.gold_cost }).eq('user_id', user.id);
      const { error: insErr } = await supabase.from('inventory').insert({ hero_id: heroId, item_id: item.id });

      if (upErr || insErr) throw new Error("Transaction Failed");

      await refreshHeroContext();

    } catch (err) {
      // 4. Rollback if something goes wrong
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setGold(prevGold);
      setOwnedItemIds(prevOwned);
      Alert.alert('Transaction Failed', 'Please check your connection and try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
          <Text style={styles.headerTitle}>MARKETPLACE</Text>
        </TouchableOpacity>
        <View style={styles.wallet}>
          <Text style={styles.walletText}>{gold} 🪙</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.grid}>
            {items.map(item => {
              const isOwned = ownedItemIds.has(item.id);
              const canAfford = gold >= item.gold_cost;
              return (
                <View key={item.id} style={[styles.card, isOwned && { opacity: 0.7 }]}>
                  <View style={styles.iconBox}><Text style={styles.emoji}>{item.sprite_key}</Text></View>
                  <Text style={styles.itemName}>{item.name.toUpperCase()}</Text>
                  <Text style={styles.itemRarity}>{item.rarity.toUpperCase()}</Text>

                  <TouchableOpacity
                    style={[styles.buyBtn, isOwned && styles.btnOwned, !canAfford && !isOwned && styles.btnDisabled]}
                    disabled={isOwned || !canAfford || purchasing === item.id}
                    onPress={() => handlePurchase(item)}
                  >
                    <Text style={[styles.btnText, (isOwned || !canAfford) && styles.btnTextMuted]}>
                      {isOwned ? 'OWNED' : canAfford ? `${item.gold_cost} 🪙` : 'LOCKED'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.textPrimary },
  wallet: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.secondary },
  walletText: { color: '#FFD700', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  card: { width: '47%', backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, padding: SPACING.sm, alignItems: 'center', gap: SPACING.xs },
  iconBox: { width: 50, height: 50, backgroundColor: C.bgCardAlt, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 24 },
  itemName: { fontSize: 11, fontWeight: '900', color: C.textPrimary, textAlign: 'center' },
  itemRarity: { fontSize: 9, color: C.textTertiary, fontWeight: '800' },
  buyBtn: { width: '100%', paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.xs },
  btnOwned: { backgroundColor: C.bgCardAlt, borderWidth: 1, borderColor: C.border },
  btnDisabled: { backgroundColor: C.bgCardAlt, borderWidth: 1, borderColor: C.border },
  btnText: { color: '#000', fontWeight: '900', fontSize: 10 },
  btnTextMuted: { color: C.textTertiary },
});