import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HeroData, ItemData, Achievement } from '@/types/game';

export function useProfileData(userId: string | undefined) {
    const [heroData, setHeroData] = useState<HeroData | null>(null);
    const [equippedItems, setEquippedItems] = useState<Record<string, ItemData | null>>({
        weapon: null, armor: null, helmet: null, accessory: null,
    });
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        try {
            // 1. Fetch Hero
            const { data: hero } = await supabase.from('heroes').select('*').eq('user_id', userId).single();
            if (hero) setHeroData(hero);

            // 2. Fetch Equipment
            const slots = ['weapon', 'armor', 'helmet', 'accessory'] as const;
            const slotKeys = {
                weapon: hero?.equipped_weapon,
                armor: hero?.equipped_armor,
                helmet: hero?.equipped_helmet,
                accessory: hero?.equipped_accessory
            };

            const equipped: Record<string, ItemData | null> = { weapon: null, armor: null, helmet: null, accessory: null };

            await Promise.all(slots.map(async (slot) => {
                const invId = slotKeys[slot];
                if (!invId) return;
                const { data: inv } = await supabase.from('inventory').select('items(*)').eq('id', invId).single();
                if (inv?.items) equipped[slot] = inv.items as any;
            }));
            setEquippedItems(equipped);

            // 3. Fetch Achievements
            const { data: ach } = await supabase.from('user_achievements')
                .select('unlocked_at, achievements(key, title, description, icon_emoji)')
                .eq('user_id', userId)
                .order('unlocked_at', { ascending: false }).limit(6);

            if (ach) {
                setAchievements(ach.map((d: any) => ({ ...d.achievements, unlocked_at: d.unlocked_at })));
            }
        } catch (err) {
            console.error("Profile Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { heroData, equippedItems, achievements, loading, refresh: fetchData };
}