import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSize } from '@/theme/tokens';
import { BROTO_CTA_GRADIENT, ctaBorderRadius } from '@/components/BrotoCtaButton';

/**
 * Botão principal de envio nas telas de login/cadastro — gradiente + shimmer.
 */
export function BrotoCtaShimmerButton({
    onPress,
    loading,
    label,
}: {
    onPress: () => void;
    loading: boolean;
    label: string;
}) {
    const [isPressed, setIsPressed] = useState(false);
    const shimmerX = useSharedValue(-1);

    useEffect(() => {
        shimmerX.value = withDelay(
            800,
            withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
                    withDelay(2500, withTiming(-1, { duration: 0 })),
                ),
                -1,
            ),
        );
    }, [shimmerX]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerX.value * 200 }],
        opacity: interpolate(
            shimmerX.value,
            [-1, -0.3, 0, 0.3, 1, 1.5],
            [0, 0.6, 0.8, 0.6, 0, 0],
        ),
    }));

    const r = ctaBorderRadius();

    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[
                styles.submitBtn,
                { borderRadius: r },
                Platform.OS === 'android' ? { elevation: 6 } : null,
                Platform.OS === 'ios'
                    ? {
                          boxShadow: '0px 6px 28px rgba(56, 112, 61, 0.4)',
                      }
                    : null,
                isPressed && styles.submitBtnPressed,
                loading && styles.submitBtnDisabled,
            ]}
        >
            <LinearGradient
                colors={BROTO_CTA_GRADIENT}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.submitGradient, { borderRadius: r, overflow: 'hidden' }]}
            >
                <Animated.View
                    style={[styles.shimmerOverlay, shimmerStyle, { pointerEvents: 'none' }]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
                {loading ? (
                    <ActivityIndicator color={colors.cta.text} />
                ) : (
                    <Text style={styles.submitText}>{label}</Text>
                )}
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    submitBtn: {
        overflow: 'hidden',
    },
    submitBtnPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.98 }],
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitGradient: {
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shimmerOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 80,
    },
    submitText: {
        fontSize: fontSize.base,
        fontWeight: '700',
        fontFamily: fonts.logo,
        color: colors.cta.text,
        letterSpacing: 0.5,
    },
});
