export type LeaderboardEntry = {
    user_id: string
    username: string
    hero_name: string
    class: string
    level: number
    xp_earned: number
    current_streak?: number
    rank: number
    is_me?: boolean
}

export type FriendRequest = {
    id: string
    requester_id: string
    username: string
    hero_name: string
    status: string
    class?: string
}