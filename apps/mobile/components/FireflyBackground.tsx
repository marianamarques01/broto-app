import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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

/* ── Types ──────────────────────────────────────────────── */

export interface FireflyDot {
    /** Horizontal position in % (0-100) */
    x: number;
    /** Vertical position in % (0-100) */
    y: number;
    /** Diameter in px */
    s: number;
    /** Initial delay in seconds */
    d: number;
    /** Duration of one cycle in seconds */
    t: number;
    /** true = gold (#fbbf24), false = green (#4ade80) */
    gold: boolean;
}

export interface FireflyBackgroundProps {
    /** Number of fireflies when using auto-generated layout (ignored when `dots` is provided) */
    count?: number;
    /** Override the two colors: [green, gold]. Defaults to ['#4ade80', '#fbbf24'] */
    colors?: [string, string];
    /** Provide an explicit array of firefly descriptors (overrides `count`) */
    dots?: FireflyDot[];
    /** Changing this value restarts all animations (useful for screen re-focus) */
    runKey?: number;
    /** Container opacity (default 1) */
    opacity?: number;
}

/* ── Keyframes (shared across every firefly) ────────────── */

const FIREFLY_KEYFRAMES = {
    progress: [0, 0.12, 0.45, 0.7, 0.9, 1],
    opacity: [0, 0.9, 0.3, 0.85, 0.15, 0],
    x: [0, 2, 8, -3, 5, 0],
    y: [0, -4, -14, -20, -8, 0],
    scale: [0.6, 1, 0.8, 1.1, 0.7, 0.6],
} as const;

/* ── Default firefly layouts ────────────────────────────── */

const DEFAULT_DOTS_10: FireflyDot[] = [
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

const DEFAULT_DOTS_7: FireflyDot[] = [
    { x: 14, y: 12, s: 2.4, d: 0.3, t: 4.2, gold: false },
    { x: 78, y: 10, s: 3, d: 1.1, t: 5.1, gold: true },
    { x: 24, y: 32, s: 2, d: 0.7, t: 3.8, gold: false },
    { x: 86, y: 38, s: 2.6, d: 2.0, t: 4.7, gold: false },
    { x: 10, y: 46, s: 2.2, d: 1.6, t: 3.4, gold: true },
    { x: 60, y: 18, s: 2.4, d: 0.9, t: 5.3, gold: false },
    { x: 48, y: 54, s: 2.8, d: 2.7, t: 4.0, gold: true },
];

function getDefaultDots(count: number): FireflyDot[] {
    if (count <= 7) return DEFAULT_DOTS_7.slice(0, count);
    return DEFAULT_DOTS_10.slice(0, count);
}

/* ── Single animated dot ────────────────────────────────── */

function Firefly({
    dot,
    greenColor,
    goldColor,
    runKey,
}: {
    dot: FireflyDot;
    greenColor: string;
    goldColor: string;
    runKey: number;
}) {
    const { x, y, s, d, t, gold } = dot;
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
    }, [d, t, runKey]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.opacity),
        transform: [
            { translateX: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.x) },
            { translateY: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.y) },
            { scale: interpolate(progress.value, FIREFLY_KEYFRAMES.progress, FIREFLY_KEYFRAMES.scale) },
        ],
    }));

    const color = gold ? goldColor : greenColor;

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
                    backgroundColor: color,
                    boxShadow: `0px 0px ${s * 3}px ${color}80`,
                    elevation: 4,
                },
                animStyle,
            ]}
        />
    );
}

/* ── Public component ───────────────────────────────────── */

export default function FireflyBackground({
    count = 10,
    colors: colorsProp,
    dots: dotsProp,
    runKey = 0,
    opacity = 1,
}: FireflyBackgroundProps) {
    const [greenColor, goldColor] = colorsProp ?? ['#4ade80', '#fbbf24'];

    const dots = useMemo(
        () => dotsProp ?? getDefaultDots(count),
        [dotsProp, count],
    );

    return (
        <View pointerEvents="none" style={[styles.container, { opacity }]}>
            {dots.map((dot, i) => (
                <Firefly
                    key={`${dot.x}-${dot.y}-${i}`}
                    dot={dot}
                    greenColor={greenColor}
                    goldColor={goldColor}
                    runKey={runKey}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
});
