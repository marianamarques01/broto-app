import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import {
    ArrowRight,
    Flame,
    Sprout,
    Target,
    PenLine,
    ChevronRight,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { getAreaConfig } from '@/theme/area-config';
import { colors, fonts } from '@/theme/tokens';
import { FadeInSection, StaggerItem, AnimatedBar, ScaleIn } from '@/components/AnimatedEntry';

const FASE_MSG: Record<string, string> = {
    semente: 'Cada questão faz seu Broto crescer. Comece agora!',
    muda: 'Seu Broto esta brotando! Continue para chegar na proxima fase.',
    planta: 'Que planta linda! Voce esta progredindo muito bem.',
    flor: 'Incrivel — seu Broto esta florindo! Continue assim.',
    especial: 'Lendario! Voce alcancou o nivel especial.',
};

// Fireflies ao redor do Broto (mesma lógica da splash)
const STUDY_FIREFLIES = [
    { x: 14, y: 12, s: 2.4, d: 0.3, t: 4.2, gold: false },
    { x: 78, y: 10, s: 3, d: 1.1, t: 5.1, gold: true },
    { x: 24, y: 32, s: 2, d: 0.7, t: 3.8, gold: false },
    { x: 86, y: 38, s: 2.6, d: 2.0, t: 4.7, gold: false },
    { x: 10, y: 46, s: 2.2, d: 1.6, t: 3.4, gold: true },
    { x: 60, y: 18, s: 2.4, d: 0.9, t: 5.3, gold: false },
    { x: 48, y: 54, s: 2.8, d: 2.7, t: 4.0, gold: true },
];

const FIREFLY_KEYFRAMES = {
    progress: [0, 0.12, 0.45, 0.7, 0.9, 1],
    opacity: [0, 0.9, 0.3, 0.85, 0.15, 0],
    x: [0, 2, 8, -3, 5, 0],
    y: [0, -4, -14, -20, -8, 0],
    scale: [0.6, 1, 0.8, 1.1, 0.7, 0.6],
};

function StudyFirefly({ x, y, s, d, t, gold }: (typeof STUDY_FIREFLIES)[0]) {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        progress.value = withDelay(
            d * 1000,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: t * 1000 }),
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

function FocusCard({ area }: { area: AreaStat }) {
    const cfg = getAreaConfig(area.value);
    const Icon = cfg.AltIcon;
    const areaColor = { solid: cfg.color, bg: cfg.glow, text: cfg.textColor };

    return (
        <Link href="/(tabs)/questions" asChild>
            <Pressable
                className="flex-row items-center gap-3 rounded-xl px-4 py-3.5"
                style={{
                    // um pouco mais claro que os cards escuros padrão
                    backgroundColor: 'rgba(0, 0, 0, 0.10)',
                    borderWidth: 1,
                    borderColor: areaColor.solid + '15',
                }}
            >
                <View
                    className="h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: areaColor.solid + '20' }}
                >
                    <Icon size={16} color={areaColor.text} />
                </View>
                <View className="flex-1">
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: fonts.sansSemiBold,
                            color: colors.text.primary,
                        }}
                    >
                        {area.label}
                    </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                        }}
                    >
                        {area.totalAnswered > 0
                            ? `${area.accuracyPct}% acerto · ${area.totalAnswered} questoes`
                            : 'Nenhuma questao ainda'}
                    </Text>
                </View>
                <ChevronRight size={16} color={colors.text.muted} />
            </Pressable>
        </Link>
    );
}

export default function StudyScreen() {
    const { pet, loading: loadingPet, refresh: refreshPet } = usePet();
    const { progress, loading: loadingProgress, refresh: refreshProgress } = useProgress();
    const [refreshing, setRefreshing] = useState(false);

    const fase = pet?.fase ?? 'semente';
    const nivel = pet?.nivel ?? 1;
    const xp = pet?.xp ?? 0;
    const xpProgress = xp % 100;
    const streak = pet?.streak ?? 0;
    const questoesHoje = pet?.questoesHoje ?? 0;
    const acertosHoje = pet?.acertosHoje ?? 0;

    const areasParaFocar = useMemo(
        () => (progress?.areas ?? [])
            .filter(a => a.totalAnswered > 0)
            .sort((a, b) => a.accuracyPct - b.accuracyPct)
            .slice(0, 2),
        [progress?.areas],
    );

    const areasNaoIniciadas = useMemo(
        () => (progress?.areas ?? [])
            .filter(a => a.totalAnswered === 0)
            .slice(0, 2),
        [progress?.areas],
    );

    const mostrarFoco = !loadingProgress && areasParaFocar.length > 0;
    const mostrarIniciar =
        !loadingProgress &&
        areasParaFocar.length === 0 &&
        areasNaoIniciadas.length > 0;

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshPet();
        refreshProgress();
        const t = setTimeout(() => setRefreshing(false), 800);
        return () => clearTimeout(t);
    }, [refreshPet, refreshProgress]);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#02140D' }}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.green[500]}
                        colors={[colors.green[500]]}
                        progressBackgroundColor="#031A11"
                    />
                }
            >
                {/* Hero */}
                <LinearGradient
                    colors={['#0D5B33', '#10261B', '#02140D']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
                >
                    {/* Header row */}
                    <FadeInSection delay={0}><View className="flex-row items-center gap-2 mb-6">
                        <Sprout size={18} color={colors.green[500]} />
                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            Seu Broto
                        </Text>
                    </View></FadeInSection>

                    {/* Broto avatar + fireflies */}
                    <ScaleIn delay={100}><View style={{ alignItems: 'center', position: 'relative' }}>
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                            }}
                        >
                            {STUDY_FIREFLIES.map((f, i) => (
                                <StudyFirefly key={i} {...f} />
                            ))}
                        </View>
                        <View
                            className="h-28 w-28 items-center justify-center rounded-3xl mb-4"
                            style={{
                                backgroundColor: colors.green.glow,
                                borderWidth: 1,
                                borderColor: colors.border.strong,
                            }}
                        >
                            <Text style={{ fontSize: 56 }}>
                                {loadingPet ? '...' : FASE_EMOJI[fase]}
                            </Text>
                        </View>

                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            {loadingPet ? '...' : FASE_LABEL[fase]}
                        </Text>
                        <View
                            className="mt-1.5 rounded-full px-3 py-1"
                            style={{
                                backgroundColor: colors.gold.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(251,191,36,0.15)',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: fonts.sansBold,
                                    color: colors.gold[300],
                                }}
                            >
                                Nivel {nivel}
                            </Text>
                        </View>

                        {/* XP bar */}
                        <View className="mt-4 w-full" style={{ maxWidth: 260 }}>
                            <AnimatedBar
                                progress={loadingPet ? 0 : xpProgress}
                                color="#DFCC00"
                                bgColor="rgba(0,0,0,0.3)"
                                height={10}
                                delay={500}
                            />
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                    textAlign: 'center',
                                    marginTop: 4,
                                }}
                            >
                                {loadingPet ? '...' : `${xpProgress}/100 XP`}
                            </Text>
                        </View>

                        {!loadingPet && (
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: fonts.sans,
                                    color: colors.text.secondary,
                                    textAlign: 'center',
                                    marginTop: 10,
                                    lineHeight: 20,
                                    maxWidth: 280,
                                }}
                            >
                                {FASE_MSG[fase]}
                            </Text>
                        )}
                    </View></ScaleIn>
                </LinearGradient>

                <View style={{ paddingHorizontal: 20, gap: 20, paddingBottom: 32 }}>
                    {/* Stats */}
                    <FadeInSection delay={200}><View className="flex-row gap-3">
                        {[
                            {
                                icon: Flame,
                                value: loadingPet ? '-' : streak,
                                label: 'streak',
                                iconColor: colors.gold[400],
                                bgColor: colors.gold.glow,
                            },
                            {
                                icon: PenLine,
                                value: loadingPet ? '-' : questoesHoje,
                                label: 'hoje',
                                iconColor: colors.green[500],
                                bgColor: colors.green.glow,
                            },
                            {
                                icon: Target,
                                value: loadingPet
                                    ? '-'
                                    : questoesHoje > 0
                                      ? `${Math.round((acertosHoje / questoesHoje) * 100)}%`
                                      : '—',
                                label: 'acerto',
                                iconColor: colors.green[500],
                                bgColor: colors.green.glow,
                            },
                        ].map(({ icon: Icon, value, label, iconColor, bgColor }) => (
                            <View
                                key={label}
                                className="flex-1 items-center p-3"
                                style={{
                                    borderRadius: 16,
                                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <View
                                    className="h-7 w-7 items-center justify-center rounded-lg mb-1"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <Icon size={14} color={iconColor} />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: fonts.sansMedium,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {value}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: fonts.sansMedium,
                                        color: colors.text.muted,
                                        marginTop: 2,
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {label}
                                </Text>
                            </View>
                        ))}
                    </View></FadeInSection>

                    {/* CTA - alinhado ao botão da home */}
                    <FadeInSection delay={280}><Link href="/(tabs)/questions" asChild>
                        <Pressable
                            style={{
                                width: '100%',
                                alignSelf: 'stretch',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 20,
                                    paddingVertical: 14,
                                    paddingHorizontal: 20,
                                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(248, 250, 252, 0.16)',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: fonts.sansMedium,
                                        color: '#FFFFFF',
                                        letterSpacing: 0.8,
                                        marginLeft: 8,
                                    }}
                                >
                                    ESTUDAR PARA CRESCER
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: fonts.sansMedium,
                                        color: '#FFFFFF',
                                        letterSpacing: 0.8,
                                        marginLeft: 8,
                                    }}
                                />
                                <View style={{ marginLeft: 8 }}>
                                    <ArrowRight size={18} color="#FACC15" />
                                </View>
                            </View>
                        </Pressable>
                    </Link></FadeInSection>

                    {/* Focus areas */}
                    {(mostrarFoco || mostrarIniciar) && (
                        <FadeInSection delay={360}><View>
                            <View className="flex-row items-center gap-2 mb-3">
                                <View
                                    style={{
                                        width: 3,
                                        height: 14,
                                        borderRadius: 1.5,
                                        backgroundColor: '#DFCC00',
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: fonts.sansMedium,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {mostrarFoco ? 'Onde focar agora' : 'Por onde começar?'}
                                </Text>
                            </View>
                            <View className="gap-2">
                                {(mostrarFoco ? areasParaFocar : areasNaoIniciadas).map((a, i) => (
                                    <StaggerItem key={a.value} index={i} baseDelay={420} stagger={60}>
                                        <FocusCard area={a} />
                                    </StaggerItem>
                                ))}
                            </View>
                        </View></FadeInSection>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
