// components/quests/QuestSkeleton.tsx
import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

export default function QuestSkeleton() {
    const shimmerAnim = useRef(new Animated.Value(0.3)).current

    // Infinite breathing pulsing animation loop
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 0.7,
                    duration: 650,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.3,
                    duration: 650,
                    useNativeDriver: true,
                }),
            ])
        ).start()
    }, [shimmerAnim])

    const animatedStyle = { opacity: shimmerAnim }

    return (
        <View style={styles.container}>
            {/* 1. MYSTERY CARD TOP BANNER SKELETON */}
            <Animated.View style={[styles.mysteryCardSkeleton, animatedStyle]} />

            {/* 2. SECTION SUBHEADER TRACK SLAG */}
            <View style={styles.headerRow}>
                <Animated.View style={[styles.headerTextSkeleton, animatedStyle]} />
                <Animated.View style={[styles.headerBadgeSkeleton, animatedStyle]} />
            </View>

            {/* 3. 3X3 GRID DECK CANVAS BLOCK SKELETONS */}
            <View style={styles.gridContainer}>
                {Array.from({ length: 9 }).map((_, idx) => (
                    <View key={idx} style={styles.gridWrapper}>
                        <Animated.View style={[styles.gridSquareSkeleton, animatedStyle]} />
                    </View>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: 'transparent',
    },

    /* TOP BANNER SKELETON MAPS */
    mysteryCardSkeleton: {
        height: 165,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.02)',
        marginBottom: 24,
    },

    /* SUBSECTION LABEL SKELETON MAPS */
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 2,
    },
    headerTextSkeleton: {
        width: 120,
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
    },
    headerBadgeSkeleton: {
        width: 45,
        height: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
    },

    /* 3X3 GRID COMPONENT TRACK MATRIX */
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: '-1%', // Pulls bounds outward to handle the item gap spaces perfectly
    },
    gridWrapper: {
        width: '31.3%',
        aspectRatio: 1,
        margin: '1%',
    },
    gridSquareSkeleton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.02)',
    },
})