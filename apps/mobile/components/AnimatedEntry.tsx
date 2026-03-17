/**
 * Reusable animated entry wrappers for staggered content reveals.
 * Uses manual useSharedValue animations — reliable on real iOS/Android devices.
 */
import { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    Easing,
} from 'react-native-reanimated';

/** Fade in + slide up — for section content */
export function FadeInSection({
    children,
    delay = 0,
    duration = 400,
}: {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(14);

    useEffect(() => {
        const easing = Easing.out(Easing.quad);
        opacity.value = withDelay(delay, withTiming(1, { duration, easing }));
        translateY.value = withDelay(delay, withTiming(0, { duration, easing }));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[style, { width: '100%', alignSelf: 'stretch' }]}>
            {children}
        </Animated.View>
    );
}

/** Fade in — for headers */
export function FadeInHeader({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }));
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return <Animated.View style={style}>{children}</Animated.View>;
}

/** Staggered list item — each child fades in with increasing delay */
export function StaggerItem({
    children,
    index,
    baseDelay = 100,
    stagger = 60,
}: {
    children: React.ReactNode;
    index: number;
    baseDelay?: number;
    stagger?: number;
}) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(12);
    const delay = baseDelay + index * stagger;

    useEffect(() => {
        const easing = Easing.out(Easing.quad);
        opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing }));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
}

/** Animated progress bar that fills on mount */
export function AnimatedBar({
    progress,
    color,
    bgColor,
    height = 10,
    delay = 200,
    borderRadius = 999,
}: {
    progress: number; // 0-100
    color: string;
    bgColor: string;
    height?: number;
    delay?: number;
    borderRadius?: number;
}) {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withDelay(
            delay,
            withTiming(Math.min(Math.max(progress, 0), 100), {
                duration: 700,
                easing: Easing.out(Easing.cubic),
            }),
        );
    }, [progress, delay]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
        height,
        borderRadius,
        backgroundColor: color,
    }));

    return (
        <Animated.View
            style={{
                height,
                borderRadius,
                backgroundColor: bgColor,
                overflow: 'hidden',
            }}
        >
            <Animated.View style={barStyle} />
        </Animated.View>
    );
}

/** Scale-in for icons or small elements */
export function ScaleIn({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 160 }));
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }, [delay]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
}

/** Pressable with scale feedback */
export { Animated };
