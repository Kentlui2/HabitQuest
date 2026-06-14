// @/types/game.ts

export interface HeroData {
    id: string;
    user_id: string;
    hero_name: string;
    class: string;
    level: number;
    xp: number;
    xp_to_next: number;
    gold: number;
    strength: number;
    intelligence: number;
    vitality: number;
    dexterity: number;
    wisdom: number;
    gender: string;
    skin_tone: string;
    hair_style: string;
    hair_color: string;
    eye_color: string;
    pet_id: string;
    realm_key: string;
    platform_key: string;
    equipped_weapon: string | null;
    equipped_armor: string | null;
    equipped_helmet: string | null;
    equipped_accessory: string | null;
    // Streak Logic Fields
    current_streak: number;
    longest_streak: number;
    streak_shields: number;
    last_streak_update?: string;
}

export interface ItemData {
    id: string;
    name: string;
    rarity: string;
    slot: 'weapon' | 'armor' | 'helmet' | 'accessory';
    sprite_key: string;
    strength: number;
    vitality: number;
    dexterity: number;
    intelligence: number;
    wisdom: number;
    drop_weight: number;
    is_purchasable: boolean;
    gold_cost: number;
}

export interface Achievement {
    key: string;
    title: string;
    description: string;
    icon_emoji: string;
    unlocked_at: string;
}