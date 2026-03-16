import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/use-auth';
import { colors, fonts } from '@/theme/tokens';
import {
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Raleway_900Black,
} from '@expo-google-fonts/raleway';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

function AnimatedSplash({ visible }: { visible: boolean }) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (!visible) {
            opacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        pointerEvents: opacity.value === 0 ? ('none' as const) : ('auto' as const),
    }));

    return (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splashBg, containerStyle]}>
            <View style={styles.splashCenter}>
                <Text style={styles.splashEmoji}>🌱</Text>
                <Text style={styles.splashTitle}>broto</Text>
                <Text style={styles.splashTagline}>ESTUDE & FLORESCA</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    splashBg: {
        backgroundColor: colors.bg.void,
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashCenter: {
        alignItems: 'center',
    },
    splashEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    splashTitle: {
        fontSize: 32,
        fontFamily: fonts.displaySemiBold,
        color: colors.text.primary,
        marginBottom: 8,
    },
    splashTagline: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.text.muted,
        letterSpacing: 2,
    },
});

export default function RootLayout() {
    const { status } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [splashVisible, setSplashVisible] = useState(true);

    const [fontsLoaded] = useFonts({
        Raleway_400Regular,
        Raleway_500Medium,
        Raleway_600SemiBold,
        Raleway_700Bold,
        Raleway_800ExtraBold,
        Raleway_900Black,
    });

    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        if (status !== 'loading' && fontsLoaded) {
            const timer = setTimeout(() => setSplashVisible(false), 800);
            return () => clearTimeout(timer);
        }
    }, [status, fontsLoaded]);

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
                <title>{'broto — estude & floresça'}</title>
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
