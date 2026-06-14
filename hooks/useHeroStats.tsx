// hooks/useHeroStats.ts
import { useMemo } from 'react';
import { HeroData, ItemData } from '@/types/game';

export function useHeroStats(hero: HeroData | null, equipped: Record<string, ItemData | null>) {
    return useMemo(() => {
        if (!hero) return { strength: 0, vitality: 0, dexterity: 0, intelligence: 0, wisdom: 0 };

        // Simply sum the base hero stats + any equipped item stats
        const total = {
            strength: hero.strength,
            vitality: hero.vitality,
            dexterity: hero.dexterity,
            intelligence: hero.intelligence,
            wisdom: hero.wisdom,
        };

        // Loop through equipped items and add their stats
        Object.values(equipped).forEach((item) => {
            if (item) {
                total.strength += (item.strength || 0);
                total.vitality += (item.vitality || 0);
                total.dexterity += (item.dexterity || 0);
                total.intelligence += (item.intelligence || 0);
                total.wisdom += (item.wisdom || 0);
            }
        });

        return total;
    }, [hero, equipped]);
}