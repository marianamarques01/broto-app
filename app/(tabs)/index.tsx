import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import {
    Flame,
    Lock,
    CheckCircle2,
    Sparkles,
    BookOpen,
    Calculator,
    FlaskConical,
    Globe2,
    Zap,
    Star,
    ChevronRight,
    Lightbulb,
    Target,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { useProgress } from '@/hooks/use-progress';
import { HeaderAuth } from '@/components/HeaderAuth';
import { BrotoLogo } from '@/components/BrotoLogo';
import { colors, fonts } from '@/theme/tokens';
import { AnimatedBar, FadeInSection } from '@/components/AnimatedEntry';

// ─── Area config ──────────────────────────────────────────────────────────────
const AREA_CONFIG: Record<
    string,
    { label: string; short: string; color: string; glow: string; Icon: any }
> = {
    linguagens: {
        label: 'Linguagens',
        short: 'LCT',
        color: colors.blue[500],
        glow: colors.blue.glow,
        Icon: BookOpen,
    },
    'ciencias-humanas': {
        label: 'Ciências Humanas',
        short: 'HUM',
        color: colors.amber[500],
        glow: colors.amber.glow,
        Icon: Globe2,
    },
    'ciencias-natureza': {
        label: 'Ciências da Natureza',
        short: 'NAT',
        color: colors.green[500],
        glow: colors.green.glow,
        Icon: FlaskConical,
    },
    matematica: {
        label: 'Matemática',
        short: 'MAT',
        color: colors.violet[500],
        glow: colors.violet.glow,
        Icon: Calculator,
    },
};

const DEFAULT_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'];

// ─── Fireflies (small glowing dots floating in the card) ─────────────────────
const CARD_FIREFLIES = [
    { x: 8, y: 18, s: 2.5, delay: 0, dur: 3.8, gold: false },
    { x: 85, y: 25, s: 3, delay: 1.2, dur: 4.5, gold: true },
    { x: 72, y: 68, s: 2, delay: 0.5, dur: 3.2, gold: false },
    { x: 25, y: 80, s: 3, delay: 2.0, dur: 5.0, gold: true },
    { x: 92, y: 52, s: 2.5, delay: 1.8, dur: 4.0, gold: false },
    { x: 50, y: 10, s: 2, delay: 0.8, dur: 3.5, gold: true },
];

function Firefly({ x, y, s, delay: d, dur, gold }: (typeof CARD_FIREFLIES)[0]) {
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Fade in/out
        opacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: d * 1000 }),
                withTiming(1, { duration: (dur / 2) * 1000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: (dur / 2) * 1000, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
        );
        // Drift horizontally — more visible movement
        translateX.value = withRepeat(
            withSequence(
                withTiming(12, { duration: dur * 1000, easing: Easing.inOut(Easing.sin) }),
                withTiming(-12, { duration: dur * 1000, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
        );
        // Drift vertically (slower, offset)
        translateY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: (dur + 1) * 1000, easing: Easing.inOut(Easing.sin) }),
                withTiming(8, { duration: (dur + 1) * 1000, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
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
                    shadowOpacity: 0.7,
                    shadowRadius: s * 3,
                },
                style,
            ]}
        />
    );
}

// ─── Mission card ─────────────────────────────────────────────────────────────
interface Mission {
    title: string;
    subtitle: string;
    xp: number;
    areaKey: string;
    done: boolean;
    locked: boolean;
}

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
    const router = useRouter();
    const area = AREA_CONFIG[mission.areaKey] ?? AREA_CONFIG.matematica;
    const { Icon } = area;
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(12);

    useEffect(() => {
        const delay = 280 + index * 80;
        const easing = Easing.out(Easing.quad);
        opacity.value = withDelay(delay, withTiming(1, { duration: 380, easing }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 380, easing }));
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={animStyle}>
            <Pressable
                onPress={() => router.push('/(tabs)/questions')}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: mission.done
                        ? 'rgba(16,185,129,0.22)'
                        : mission.locked
                          ? colors.border.subtle
                          : colors.border.default,
                    backgroundColor: mission.done
                        ? 'rgba(16,185,129,0.06)'
                        : colors.bg.card,
                    opacity: mission.locked ? 0.72 : pressed ? 0.85 : 1,
                })}
            >
                {/* Area icon */}
                <View
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: mission.locked
                            ? colors.bg.elevated
                            : area.glow,
                        borderWidth: 1,
                        borderColor: mission.locked
                            ? colors.border.subtle
                            : `${area.color}33`,
                    }}
                >
                    {mission.locked ? (
                        <Lock size={18} color={colors.text.muted} />
                    ) : mission.done ? (
                        <CheckCircle2 size={18} color={colors.green[500]} />
                    ) : (
                        <Icon size={18} color={area.color} />
                    )}
                </View>

                {/* Content — minWidth 0 + flex 1 para não cortar texto no device */}
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                    <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={{
                            fontSize: 14,
                            fontFamily: fonts.sansSemiBold,
                            color: mission.locked ? colors.text.muted : colors.text.primary,
                            textDecorationLine: mission.done ? 'line-through' : 'none',
                        }}
                    >
                        {mission.title}
                    </Text>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontSize: 12,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            marginTop: 2,
                        }}
                    >
                        {mission.locked ? 'Complete a missão anterior' : mission.subtitle}
                    </Text>
                </View>

                {!mission.done && !mission.locked && (
                    <ChevronRight size={16} color={colors.text.muted} />
                )}
            </Pressable>
        </Animated.View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { pet, loading } = usePet();
    const { progress } = useProgress();

    const xp = pet?.xp ?? 0;
    const xpInLevel = xp % 100;
    const nivel = pet?.nivel ?? 1;
    const fase = pet?.fase ?? 'semente';
    const streak = pet?.streak ?? 0;
    const questoesHoje = pet?.questoesHoje ?? 0;
    const acertosHoje = pet?.acertosHoje ?? 0;
    const humor = pet?.humor ?? 50;
    const accuracyPct =
        questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : 0;

    // Derive missions from progress (worst areas first)
    const sortedAreas = progress?.areas
        ? [...progress.areas]
              .filter((a) => a.totalAnswered >= 1)
              .sort((a, b) => a.accuracyPct - b.accuracyPct)
              .map((a) => a.value)
        : [];
    const missionAreas = [
        sortedAreas[0] ?? DEFAULT_AREAS[0],
        sortedAreas[1] ?? DEFAULT_AREAS[1],
        sortedAreas[2] ?? DEFAULT_AREAS[2],
    ];

    const areaLabel = (key: string) =>
        AREA_CONFIG[key]?.label ?? 'Questões';

    const missions: Mission[] = [
        {
            title: `3 questões de ${areaLabel(missionAreas[0])}`,
            subtitle: 'Área com maior oportunidade',
            xp: 30,
            areaKey: missionAreas[0],
            done: questoesHoje >= 3,
            locked: false,
        },
        {
            title: `2 questões de ${areaLabel(missionAreas[1])}`,
            subtitle: 'Continue progredindo',
            xp: 20,
            areaKey: missionAreas[1],
            done: questoesHoje >= 5,
            locked: questoesHoje < 3,
        },
        {
            title: 'Atingir 70% de acerto',
            subtitle: `Acerto atual: ${questoesHoje > 0 ? accuracyPct + '%' : '—'}`,
            xp: 50,
            areaKey: missionAreas[2],
            done: questoesHoje >= 5 && accuracyPct >= 70,
            locked: questoesHoje < 5,
        },
    ];

    const doneMissions = missions.filter((m) => m.done).length;

    // Daily tip by day-of-week
    const TIPS = [
        'Leia cada alternativa com calma — o distrator principal parece certo à primeira vista.',
        'Em textos de Linguagens, o contexto sempre supera o significado isolado das palavras.',
        'Em Matemática, eliminar alternativas absurdas salva tempo quando travar.',
        'Revise os tópicos em que você erra 2+ vezes — são os que mais caem na prova.',
        'Faça pelo menos 3 questões por dia para manter seu Broto saudável e crescendo.',
        'Use a regra de três sempre que possível — ela resolve ~40% das questões de Natureza.',
        'Nos textos do ENEM, a resposta certa geralmente NÃO julga personagens — interprete.',
    ];
    const tip = TIPS[new Date().getDay()];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.void }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                    paddingTop: 8,
                    backgroundColor: colors.bg.deep,
                }}
            >
                <BrotoLogo size="header" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {streak > 0 && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                backgroundColor: colors.gold.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(251,191,36,0.18)',
                            }}
                        >
                            <Flame size={12} color={colors.gold[400]} />
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: fonts.sansBold,
                                    color: colors.gold[300],
                                }}
                            >
                                {streak}
                            </Text>
                        </View>
                    )}
                    <HeaderAuth />
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: 70 + insets.bottom + 16,
                    gap: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Saudação acima do card do broto ── */}
                <FadeInSection delay={0}>
                    <View style={{ marginBottom: -8 }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: fonts.sans,
                                color: colors.text.secondary,
                            }}
                        >
                            Bem-vindo de volta
                        </Text>
                        <Text
                            style={{
                                fontSize: 22,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                                marginTop: 2,
                            }}
                        >
                            Bora estudar? 🌱
                        </Text>
                    </View>
                </FadeInSection>

                {/* ── Pet hero card ── */}
                <FadeInSection delay={0}>
                    <View
                        style={{
                            borderRadius: 28,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: 'rgba(16, 185, 129, 0.38)',
                        }}
                    >
                        {/* Camada de fundo em todo o quadro (não corta embaixo) */}
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                            pointerEvents="none"
                        >
                            <LinearGradient
                                colors={[colors.green[800], '#0b1f16', '#0f211a']}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0.2, y: 0 }}
                                end={{ x: 0.8, y: 1 }}
                                style={{ flex: 1 }}
                            />
                            {/* Degradê amarelo leve (igual ao desktop) — cobre todo o quadro */}
                            <LinearGradient
                                colors={[colors.gold.glow, 'rgba(251, 191, 36, 0.04)', 'transparent']}
                                locations={[0, 0.45, 1]}
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                            />
                        </View>
                        <View style={{ padding: 24, paddingBottom: 20 }}>
                            {/* Fireflies */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                {CARD_FIREFLIES.map((f, i) => (
                                    <Firefly key={i} {...f} />
                                ))}
                            </View>

                            {/* Pet + info */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 20,
                                }}
                            >
                                {/* Glow + emoji */}
                                <View
                                    style={{ alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <View
                                        style={{
                                            width: 90,
                                            height: 90,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 74,
                                                height: 74,
                                                borderRadius: 20,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                borderWidth: 1,
                                                borderColor: 'rgba(16, 185, 129, 0.55)',
                                                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                                zIndex: 1,
                                            }}
                                        >
                                            <LinearGradient
                                                colors={[
                                                    'rgba(52, 211, 153, 0.35)',
                                                    'rgba(16, 185, 129, 0.08)',
                                                    'transparent',
                                                ]}
                                                locations={[0, 0.4, 1]}
                                                start={{ x: 0.5, y: 0 }}
                                                end={{ x: 0.5, y: 1 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                }}
                                                pointerEvents="none"
                                            />
                                            <Text style={{ fontSize: 44 }}>
                                                {FASE_EMOJI[fase]}
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Level badge */}
                                    <Animated.View
                                        style={{
                                            marginTop: -18,
                                            zIndex: 2,
                                            borderRadius: 999,
                                            paddingHorizontal: 10,
                                            paddingVertical: 3,
                                            backgroundColor: colors.gold.glow,
                                            borderWidth: 1,
                                            borderColor: 'rgba(251,191,36,0.22)',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                fontFamily: fonts.sansBold,
                                                color: colors.gold[300],
                                            }}
                                        >
                                            Nv. {nivel}
                                        </Text>
                                    </Animated.View>
                                </View>

                                {/* Phase + XP */}
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: fonts.sansSemiBold,
                                            color: colors.text.muted,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.5,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Seu Broto
                                    </Text>
                                    {loading ? (
                                        <View
                                            style={{
                                                height: 20,
                                                width: 110,
                                                borderRadius: 6,
                                                backgroundColor: colors.bg.elevated,
                                                marginBottom: 4,
                                            }}
                                        />
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: 22,
                                                fontFamily: fonts.display,
                                                color: colors.text.primary,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {FASE_LABEL[fase]}
                                        </Text>
                                    )}

                                    <View style={{ marginTop: 10 }}>
                                        <AnimatedBar
                                            progress={loading ? 0 : (xpInLevel / 100) * 100}
                                            color={colors.green[500]}
                                            bgColor="rgba(0,0,0,0.3)"
                                            height={8}
                                            delay={500}
                                        />
                                        <View style={{ marginTop: 5 }}>
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: fonts.sans,
                                                    color: colors.text.muted,
                                                }}
                                            >
                                                {loading ? '…' : `${xpInLevel} / 100 XP`}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Stats strip inside card */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 8,
                                    marginTop: 18,
                                    paddingTop: 16,
                                    borderTopWidth: 1,
                                    borderTopColor: colors.border.subtle,
                                }}
                            >
                                {[
                                    {
                                        label: 'Sequência',
                                        value: loading ? '—' : `${streak} dias`,
                                        Icon: Flame,
                                        iconColor: colors.gold[400],
                                    },
                                    {
                                        label: 'Hoje',
                                        value: loading ? '—' : `${questoesHoje} quest.`,
                                        Icon: BookOpen,
                                        iconColor: colors.blue[400],
                                    },
                                    {
                                        label: 'Acerto',
                                        value:
                                            loading || questoesHoje === 0
                                                ? '—'
                                                : `${accuracyPct}%`,
                                        Icon: Target,
                                        iconColor: colors.green[400],
                                    },
                                ].map(({ label, value, Icon, iconColor }) => (
                                    <View
                                        key={label}
                                        style={{
                                            flex: 1,
                                            alignItems: 'center',
                                            gap: 2,
                                        }}
                                    >
                                        <Icon size={18} color={iconColor} />
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: fonts.sansBold,
                                                color: colors.text.primary,
                                            }}
                                        >
                                            {value}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                fontFamily: fonts.sans,
                                                color: colors.text.muted,
                                            }}
                                        >
                                            {label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </FadeInSection>

                {/* ── Missões do dia ── */}
                <FadeInSection delay={200}>
                    <View>
                        {/* Section header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                            }}
                        >
                            <View
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: fonts.sansBold,
                                        color: colors.text.primary,
                                    }}
                                >
                                    Missões de hoje
                                </Text>
                            </View>
                            {/* Progress counter */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                    borderRadius: 999,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    backgroundColor:
                                        doneMissions === 3
                                            ? 'rgba(16,185,129,0.15)'
                                            : colors.bg.elevated,
                                    borderWidth: 1,
                                    borderColor:
                                        doneMissions === 3
                                            ? colors.border.strong
                                            : colors.border.subtle,
                                }}
                            >
                                {doneMissions === 3 && (
                                    <Sparkles size={11} color={colors.green[400]} />
                                )}
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontFamily: fonts.sansBold,
                                        color:
                                            doneMissions === 3
                                                ? colors.green[400]
                                                : colors.text.muted,
                                    }}
                                >
                                    {doneMissions}/3 completas
                                </Text>
                            </View>
                        </View>

                        {/* Mission progress bar — altura fixa para render igual no device */}
                        <View style={{ height: 5, marginBottom: 14, justifyContent: 'center' }}>
                            <AnimatedBar
                                progress={(doneMissions / 3) * 100}
                                color={colors.gold[500]}
                                bgColor={colors.bg.elevated}
                                height={5}
                                delay={400}
                            />
                        </View>

                        {/* Mission cards */}
                        <View style={{ gap: 10 }}>
                            {missions.map((mission, i) => (
                                <MissionCard
                                    key={`mission-${i}-${mission.areaKey}-${mission.locked}`}
                                    mission={mission}
                                    index={i}
                                />
                            ))}
                        </View>
                    </View>
                </FadeInSection>

                {/* ── Dica do dia (pet speech bubble) ── */}
                <FadeInSection delay={520}>
                    <View
                        style={{
                            borderRadius: 20,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.03)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ padding: 16 }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ fontSize: 18 }}>
                                    {FASE_EMOJI[fase]}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <Lightbulb size={12} color={colors.green[500]} />
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: fonts.sansBold,
                                            color: colors.green[500],
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                        }}
                                    >
                                        Dica do Broto
                                    </Text>
                                </View>
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: fonts.sans,
                                    color: colors.text.primary,
                                    lineHeight: 21,
                                }}
                            >
                                {tip}
                            </Text>
                        </LinearGradient>
                    </View>
                </FadeInSection>

                {/* ── CTA ── */}
                <FadeInSection delay={640}>
                    <Pressable
                        onPress={() => router.push('/(tabs)/questions')}
                        style={({ pressed }) => ({
                            borderRadius: 18,
                            overflow: 'hidden',
                            opacity: pressed ? 0.82 : 1,
                        })}
                    >
                        <LinearGradient
                            colors={[colors.green[600], colors.green[700]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                paddingVertical: 16,
                            }}
                        >
                            <Sparkles size={16} color="#fff" />
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: fonts.sansBold,
                                    color: '#fff',
                                }}
                            >
                                {doneMissions === 3
                                    ? 'Missões completas! Continuar treinando'
                                    : 'Começar missões'}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </FadeInSection>
            </ScrollView>
        </SafeAreaView>
    );
}
