import { forwardRef } from 'react';
import {
    Platform,
    Pressable,
    Text,
    ActivityIndicator,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import type { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '@/theme/tokens';

export const BROTO_CTA_GRADIENT = [...colors.cta.gradient] as [string, string];
export const BROTO_CTA_RADIUS = colors.cta.radius;

/**
 * Raio em pílula: no Android o `expo-linear-gradient` costuma falhar a máscara com valores
 * muito altos (ex.: 999). Um teto (~100) mantém cápsula nos CTAs típicos e clipa o gradiente.
 */
export function ctaBorderRadius(): number {
    return Platform.OS === 'android' ? 100 : BROTO_CTA_RADIUS;
}

export type BrotoCtaButtonProps = {
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    disabled?: boolean;
    loading?: boolean;
    title: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Menos padding — fluxos com vários CTAs em sequência */
    compact?: boolean;
};

export const BrotoCtaButton = forwardRef<View, BrotoCtaButtonProps>(function BrotoCtaButton(
    {
        onPress,
        onPressIn,
        onPressOut,
        disabled,
        loading,
        title,
        leftIcon,
        rightIcon,
        style,
        compact,
    },
    ref,
) {
    const isDisabled = disabled || loading;
    const padV = compact ? 12 : 16;
    const padH = compact ? 16 : 20;
    const fontSize = compact ? 13 : 14;
    const r = ctaBorderRadius();

    return (
        <Pressable
            ref={ref}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={isDisabled}
            style={({ pressed }) => [
                {
                    alignSelf: 'stretch',
                    width: '100%',
                    borderRadius: r,
                    overflow: 'hidden',
                    opacity: pressed ? 0.92 : isDisabled ? 0.55 : 1,
                    ...(Platform.OS === 'ios'
                        ? {
                              boxShadow: '0px 6px 28px rgba(56, 112, 61, 0.38)',
                          }
                        : { elevation: 6 }),
                },
                style,
            ]}
        >
            <LinearGradient
                colors={BROTO_CTA_GRADIENT}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                    borderRadius: r,
                    overflow: 'hidden',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: compact ? 6 : 8,
                    paddingVertical: padV,
                    paddingHorizontal: padH,
                }}
            >
                {loading ? (
                    <ActivityIndicator color={colors.cta.text} />
                ) : (
                    <>
                        {leftIcon}
                        <Text
                            style={{
                                fontSize,
                                fontWeight: '700',
                                fontFamily: fonts.logo,
                                color: colors.cta.text,
                                letterSpacing: compact ? 0.35 : 0.5,
                                textAlign: 'center',
                            }}
                        >
                            {title}
                        </Text>
                        {rightIcon}
                    </>
                )}
            </LinearGradient>
        </Pressable>
    );
});
