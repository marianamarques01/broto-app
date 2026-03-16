import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useFonts } from 'expo-font';
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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/use-auth';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';
import { CentralGlowSvg } from '@/components/HeroGlowSvg';
import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import '@/global.css';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

SplashScreen.preventAutoHideAsync();

/* ── Firefly (igual a tela de login) ─────────── */

const SPLASH_FIREFLIES = [
    { x: 12, y: 18, s: 2.5, d: 0, t: 4.2, gold: false },
    { x: 78, y: 12, s: 3.5, d: 1.4, t: 5.1, gold: true },
    { x: 32, y: 62, s: 2, d: 0.6, t: 3.8, gold: false },
    { x: 88, y: 48, s: 3, d: 2.3, t: 4.7, gold: false },
    { x: 22, y: 42, s: 2, d: 1.9, t: 3.2, gold: true },
    { x: 62, y: 28, s: 2.5, d: 0.9, t: 5.5, gold: false },
    { x: 48, y: 72, s: 3, d: 3.1, t: 4.0, gold: true },
    { x: 92, y: 35, s: 2, d: 1.6, t: 3.6, gold: false },
    { x: 55, y: 55, s: 2.5, d: 2.8, t: 4.4, gold: false },
    { x: 8, y: 58, s: 3, d: 0.3, t: 5.0, gold: true },
];

const FIREFLY_KEYFRAMES = {
    progress: [0, 0.12, 0.45, 0.7, 0.9, 1],
    opacity: [0, 0.9, 0.3, 0.85, 0.15, 0],
    x: [0, 2, 8, -3, 5, 0],
    y: [0, -4, -14, -20, -8, 0],
    scale: [0.6, 1, 0.8, 1.1, 0.7, 0.6],
};

function SplashFirefly({ x, y, s, d, t, gold }: (typeof SPLASH_FIREFLIES)[0]) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withDelay(
            d * 1000,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: t * 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 0 }),
                ),
                -1,
            ),
        );
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.opacity),
        transform: [
            { translateX: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.x) },
            { translateY: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.y) },
            { scale: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.scale) },
        ],
    }));
    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: s,
                    height: s,
                    borderRadius: s / 2,
                    backgroundColor: gold ? '#fbbf24' : '#4ade80',
                    shadowColor: gold ? '#fbbf24' : '#4ade80',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: s * 3,
                    elevation: 4,
                },
                style,
            ]}
        />
    );
}

/* ── Wordmark em gradiente ── */

function SplashGradientWordmark() {
    return (
        <View style={splashStyles.wordmarkWrap}>
            <Svg width={180} height={56} viewBox="0 0 180 56">
                <Defs>
                    <SvgLinearGradient id="splashWordmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.green[300]} />
                        <Stop offset="40%" stopColor={colors.green[500]} />
                        <Stop offset="100%" stopColor={colors.gold[300]} />
                    </SvgLinearGradient>
                </Defs>
                <SvgText
                    x="90"
                    y={fontSize['5xl']}
                    textAnchor="middle"
                    fill="url(#splashWordmarkGrad)"
                    fontSize={fontSize['5xl']}
                    fontWeight="600"
                    fontFamily={fonts.logo}
                    letterSpacing={-0.5}
                >
                    broto
                </SvgText>
            </Svg>
        </View>
    );
}

/* ── Animated Splash ─ */

function AnimatedSplash({ visible }: { visible: boolean }) {
    const floatY = useSharedValue(0);
    const glowScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.4);
    const contentOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        contentOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));

        floatY.value = withDelay(
            400,
            withRepeat(
                withSequence(
                    withTiming(-8, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
            ),
        );

        glowScale.value = withDelay(
            200,
            withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
            ),
        );
        glowOpacity.value = withDelay(
            200,
            withRepeat(
                withSequence(
                    withTiming(0.55, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.35, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
            ),
        );
    }, []);

    useEffect(() => {
        if (!visible) {
            containerOpacity.value = withTiming(0, { duration: 400 });
        }
    }, [visible]);

    const emojiStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        pointerEvents: containerOpacity.value === 0 ? 'none' as const : 'auto' as const,
    }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
            <LinearGradient
                colors={[colors.bg.deep, colors.bg.void]}
                style={splashStyles.container}
            >
                <View style={splashStyles.firefliesContainer} pointerEvents="none">
                    {SPLASH_FIREFLIES.map((f, i) => (
                        <SplashFirefly key={i} {...f} />
                    ))}
                </View>

                <View style={splashStyles.center}>
                    <Animated.View style={[splashStyles.glowPulseWrap, glowStyle]}>
                        <CentralGlowSvg subtle />
                    </Animated.View>

                    <Animated.View style={[emojiStyle, splashStyles.emojiContainer]}>
                        <View style={splashStyles.emojiBox}>
                            <Text style={splashStyles.emojiText}>{'\u{1F331}'}</Text>
                        </View>
                    </Animated.View>

                    <Animated.View style={contentStyle}>
                        <SplashGradientWordmark />
                        <Text style={splashStyles.tagline}>ESTUDE & FLORESCA</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const splashStyles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    firefliesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowPulseWrap: {
        position: 'absolute',
        width: 160,
        height: 160,
        marginLeft: -80,
        marginTop: -80,
        left: '50%',
        top: '50%',
    },
    emojiContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sectionGap,
    },
    emojiBox: {
        width: 112,
        height: 112,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.green.glow,
        borderWidth: 1,
        borderColor: colors.border.strong,
    },
    emojiText: {
        fontSize: fontSize['6xl'],
    },
    wordmarkWrap: {
        marginTop: spacing.wordmarkMarginTop,
        alignItems: 'center',
    },
    tagline: {
        marginTop: spacing.taglineMarginTop,
        fontSize: fontSize.sm,
        fontWeight: '500',
        fontFamily: fonts.sansMedium,
        letterSpacing: 2,
        color: colors.text.muted,
        textAlign: 'center',
    },
});

/* ── Root Layout ──────────────────────────────────────── */

export default function RootLayout() {
    const { status } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [splashVisible, setSplashVisible] = useState(true);

    const [fontsLoaded] = useFonts({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_600SemiBold,
        DMSans_700Bold,
        Fraunces_600SemiBold,
        Fraunces_700Bold,
        Fraunces_900Black,
        Outfit_600SemiBold,
    });

    // Hide native splash immediately — we show our animated one instead
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    // When auth and fonts resolve, wait a beat then dismiss animated splash
    useEffect(() => {
        if (status !== 'loading' && fontsLoaded) {
            const timer = setTimeout(() => setSplashVisible(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [status, fontsLoaded]);

    // Navigate once splash is gone
    useEffect(() => {
        if (status === 'loading' || splashVisible) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (status === 'unauthenticated' && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (status === 'authenticated' && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [status, segments, router, splashVisible]);

    return (
        <>
            <Head>
                <title>{'broto \u2014 estude & flores\u00e7a'}</title>
            </Head>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" />
            </Stack>
            <AnimatedSplash visible={splashVisible} />
        </>
    );
}
