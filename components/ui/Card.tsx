// components/ui/AppCard.tsx

import { View } from 'react-native'

type Props = {
    children: React.ReactNode
    className?: string
}

export default function AppCard({
    children,
    className = '',
}: Props) {
    return (
        <View
            className={`
        bg-[#151A24]
        rounded-3xl
        p-4
        mx-4
        ${className}
      `}
        >
            {children}
        </View>
    )
}