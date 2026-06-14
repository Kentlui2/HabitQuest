// components/ui/SectionHeader.tsx

import { View, Text, TouchableOpacity } from 'react-native'

type Props = {
    title: string
    actionText?: string
    onPress?: () => void
}

export default function SectionHeader({
    title,
    actionText,
    onPress,
}: Props) {
    return (
        <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">
                {title}
            </Text>

            {actionText && (
                <TouchableOpacity onPress={onPress}>
                    <Text className="text-[#8B5CF6] font-semibold">
                        {actionText}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    )
}