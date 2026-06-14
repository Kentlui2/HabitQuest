// app/(auth)/verify.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { COLORS, RADIUS } from '@/constants/theme';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();

    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const inputs = useRef<Array<TextInput | null>>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        setTimeout(() => inputs.current[0]?.focus(), 500);
    }, []);

    const triggerHaptic = (type: 'light' | 'heavy' | 'error') => {
        if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (type === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleVerify = async (otp: string) => {
        setLoading(true);
        setError(null);

        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email || '',
            token: otp,
            type: 'signup',
        });

        if (verifyError) {
            triggerHaptic('error');
            setError('Invalid or expired code. Please try again.');
            setLoading(false);
            return;
        }

        setSuccess(true);
        triggerHaptic('heavy');
        setTimeout(() => router.replace('/(tabs)/home'), 800);
    };

    const handleChange = useCallback((text: string, index: number) => {
        const digits = text.replace(/[^0-9]/g, '');
        const newCode = [...code];

        if (digits.length > 1) {
            digits.split('').forEach((d, i) => {
                if (index + i < CODE_LENGTH) newCode[index + i] = d;
            });
            setCode(newCode);
            const nextIdx = Math.min(index + digits.length - 1, CODE_LENGTH - 1);
            inputs.current[nextIdx]?.focus();
            triggerHaptic('light');
        } else {
            newCode[index] = digits;
            setCode(newCode);
            if (digits && index < CODE_LENGTH - 1) {
                inputs.current[index + 1]?.focus();
                triggerHaptic('light');
            }
        }

        if (newCode.every(d => d !== '')) handleVerify(newCode.join(''));
    }, [code]);

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        // ✅ flex: 1 ensures it fills the screen
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ✅ ScrollView also needs background so it doesn't bleed black */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Verification</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>

                    <View style={styles.otpContainer}>
                        {code.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={(ref) => { inputs.current[i] = ref; }}
                                style={[
                                    styles.input,
                                    focusedIndex === i && styles.inputFocused,
                                    !!digit && styles.inputFilled,
                                ]}
                                value={digit}
                                onChangeText={(t) => handleChange(t, i)}
                                onKeyPress={(e) => handleKeyPress(e, i)}
                                onFocus={() => setFocusedIndex(i)}
                                onBlur={() => setFocusedIndex(-1)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {/* ✅ Show error message if code is wrong */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            success && styles.buttonSuccess,
                            code.includes('') && styles.buttonDisabled,
                        ]}
                        disabled={loading || code.includes('')}
                        onPress={() => handleVerify(code.join(''))}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>{success ? '✓ Verified!' : 'Verify'}</Text>
                        }
                    </TouchableOpacity>

                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // ✅ root + scroll both carry the background color
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    // ✅ Animated.View needs full width and its own background
    inner: {
        width: '100%',
        backgroundColor: COLORS.background,
    },
    backButton: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.dim,
        marginBottom: 40,
        lineHeight: 24,
    },
    emailHighlight: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    input: {
        width: 48,
        height: 64,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.surface2,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    inputFocused: {
        borderColor: COLORS.primary,
    },
    inputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonSuccess: {
        backgroundColor: COLORS.success,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});