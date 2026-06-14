// components/ui/ProgressBar.tsx

import { View, Text } from 'react-native'
import { COLORS } from '@/constants/theme'

type Props = {
    value: number
    max: number
    color?: string
    showLabel?: boolean
}

export default function ProgressBar({
    value,
    max,
    color = COLORS.primary,
    showLabel = true,
}: Props) {
    const percentage = Math.min((value / max) * 100, 100)

    return (
        <View>
            {showLabel && (
                <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-zinc-400">
                        Progress
                    </Text>

                    <Text
                        className="text-sm font-semibold"
                        style={{ color }}
                    >
                        {Math.round(percentage)}%
                    </Text>
                </View>
            )}

            <View className="h-3 bg-[#0B0F1A] rounded-full overflow-hidden">
                <View
                    className="h-full rounded-full"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                    }}
                />
            </View>
        </View>
    )
}