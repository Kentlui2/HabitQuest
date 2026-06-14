// app/settings.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { C, SPACING, RADIUS, COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
    const { signOut } = useAuth();

    const handleLogout = async () => {
        Alert.alert("Log Out", "Are you sure you want to leave?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: "destructive", onPress: async () => await signOut() }
        ]);
    };

    return (
        <SafeAreaView style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
                    <Text style={styles.headerTitle}>SETTINGS</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionHeader}>ACCOUNT</Text>

                <TouchableOpacity style={styles.item} onPress={handleLogout}>
                    <View style={styles.itemLeft}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                        <Text style={[styles.itemText, { color: COLORS.danger }]}>Log Out</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.sectionHeader}>PREFERENCES</Text>

                <View style={styles.item}>
                    <Text style={styles.itemText}>Push Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
                </View>

                <View style={styles.item}>
                    <Text style={styles.itemText}>Theme</Text>
                    <Text style={styles.itemValue}>Dark Mode</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    headerTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },

    content: { padding: SPACING.md },
    sectionHeader: { fontSize: 12, fontWeight: '800', color: C.textTertiary, marginTop: SPACING.lg, marginBottom: SPACING.sm, letterSpacing: 1 },

    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.bgCard,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.xs
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    itemText: { fontSize: 16, color: C.textPrimary, fontWeight: '600' },
    itemValue: { fontSize: 14, color: C.textSecondary },
});