import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useCallback, memo, useState, useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import {
    Flame,
    Lock,
    CheckCircle2,
    Sparkles,
    BookOpen,
    Zap,
    Target,
    ArrowUpRight,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { useProgress } from '@/hooks/use-progress';
import { useUser } from '@/hooks/use-user';
import { HeaderAuth } from '@/components/HeaderAuth';
import { BrotoLogo } from '@/components/BrotoLogo';
import { BrotoCtaButton } from '@/components/BrotoCtaButton';
import { AREA_CONFIG, getAreaConfig } from '@/theme/area-config';
import { colors, fonts, radii, space } from '@/theme/tokens';
import { AnimatedBar, FadeInSection } from '@/components/AnimatedEntry';
import { getDailyMissionsState, type DailyMissionsState } from '@/lib/missions/daily-missions';

const DEFAULT_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'];

// ─── Static constants (outside component to avoid re-creation) ───────────────
const HERO_GRADIENT = ['#0D5B33', '#10261B'] as const;
const HERO_LOCATIONS = [0, 0.8] as const;
const DIVIDER_GRADIENT = [
    'rgba(255, 255, 255, 0)',
    'rgba(204, 204, 204, 0.4)',
    'rgba(153, 153, 153, 0)',
] as const;
const DIVIDER_LOCATIONS = [0, 0.5, 1] as const;
const DIVIDER_START: [number, number] = [0, 0.5];
const DIVIDER_END: [number, number] = [1, 0.5];
const dividerStyle = {
    width: '100%' as const,
    height: 1,
    borderRadius: 10,
    marginBottom: 16,
};

// ─── Stats pill config (stable reference) ────────────────────────────────────
const STAT_ICONS = [
    { key: 'streak', Icon: Flame, iconColor: colors.gold[400] },
    { key: 'hoje', Icon: BookOpen, iconColor: colors.blue[400] },
    { key: 'acerto', Icon: Target, iconColor: colors.green[400] },
] as const;

// ─── Mission card ─────────────────────────────────────────────────────────────
interface Mission {
    title: string;
    subtitle: string;
    xp: number;
    areaKey: string;
    done: boolean;
    locked: boolean;
}

const MissionCard = memo(function MissionCard({
    mission,
    onPress,
}: {
    mission: Mission;
    onPress: () => void;
}) {
    const area = getAreaConfig(mission.areaKey);
    const { Icon } = area;

    return (
        <Pressable
            onPress={() => !mission.locked && onPress()}
            style={({ pressed }) => ({
                opacity: mission.locked ? 0.55 : pressed ? 0.85 : 1,
            })}
        >
            <View
                style={{
                    width: '100%',
                    padding: 16,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: mission.locked
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.06)',
                    backgroundColor: mission.locked ? '#0B1F15' : '#122B1E',
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden',
                }}
            >
                {/* Area icon */}
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        marginRight: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderColor: mission.done
                            ? 'rgba(34,197,94,0.5)'
                            : mission.locked
                                ? 'rgba(148,163,184,0.45)'
                                : 'rgba(248,250,252,0.14)',
                    }}
                >
                    {mission.locked ? (
                        <Lock size={16} color="rgba(255,255,255,0.65)" />
                    ) : mission.done ? (
                        <CheckCircle2 size={16} color={colors.green[400]} />
                    ) : (
                        <Icon size={16} color="rgba(255,255,255,0.88)" />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontSize: 13,
                            lineHeight: 18,
                            fontFamily: fonts.sansMedium,
                            color: mission.locked
                                ? 'rgba(255,255,255,0.72)'
                                : mission.done
                                  ? 'rgba(255,255,255,0.9)'
                                  : '#ffffff',
                            textDecorationLine: mission.done ? 'line-through' : 'none',
                            flexShrink: 1,
                        }}
                    >
                        {mission.title}
                    </Text>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontSize: 12,
                            lineHeight: 16,
                            fontFamily: fonts.sans,
                            color: mission.locked
                                ? 'rgba(255,255,255,0.58)'
                                : 'rgba(255,255,255,0.68)',
                            marginTop: 4,
                        }}
                    >
                        {mission.locked ? 'Complete a missão anterior' : mission.subtitle}
                    </Text>
                </View>

                {/* XP badge (active) */}
                {!mission.done && !mission.locked && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 12,
                            backgroundColor: 'rgba(223,204,0,0.15)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: 'rgba(223,204,0,0.4)',
                        }}
                    >
                        <Zap size={11} color={colors.cta.gradientEnd} />
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.sansBold,
                                color: colors.cta.gradientEnd,
                                marginLeft: 3,
                            }}
                        >
                            +{mission.xp}
                        </Text>
                    </View>
                )}

                {/* XP earned (done) */}
                {mission.done && (
                    <View
                        style={{
                            marginLeft: 12,
                            backgroundColor: 'rgba(34,197,94,0.2)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: 'rgba(34,197,94,0.3)',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.green[400],
                            }}
                        >
                            +{mission.xp} XP
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
});

// ─── CTA Começar missões ─────────────────────────────────────────────────────
function StartMissionsButton({
    label,
    onPress,
    delay = 0,
}: {
    label: string;
    onPress: () => void;
    delay?: number;
    done?: boolean;
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.97, { damping: 14, stiffness: 380 });
    };
    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 14, stiffness: 380 });
    };

    return (
        <FadeInSection delay={delay}>
            <Animated.View style={[animatedStyle, { width: '100%', alignSelf: 'stretch' }]}>
                <BrotoCtaButton
                    title={label}
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    rightIcon={<ArrowUpRight size={18} color={colors.cta.text} />}
                />
            </Animated.View>
        </FadeInSection>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { pet, loading, refresh: refreshPet } = usePet();
    const { progress, refresh: refreshProgress } = useProgress();
    const { user } = useUser();
    const [refreshing, setRefreshing] = useState(false);
    const [daily, setDaily] = useState<DailyMissionsState | null>(null);

    const xp = pet?.xp ?? 0;
    const xpInLevel = xp % 100;
    const nivel = pet?.nivel ?? 1;
    const fase = pet?.fase ?? 'semente';
    const streak = pet?.streak ?? 0;
    const questoesHoje = pet?.questoesHoje ?? 0;
    const acertosHoje = pet?.acertosHoje ?? 0;
    const accuracyPct =
        questoesHoje > 0 ? Math.round((acertosHoje / questoesHoje) * 100) : 0;

    const displayName = useMemo(() => {
        const raw = user?.nome?.trim();
        if (!raw) return null;
        const first = raw.split(/\s+/)[0];
        return first || raw;
    }, [user?.nome]);

    useEffect(() => {
        let alive = true;
        getDailyMissionsState()
            .then(state => {
                if (alive) setDaily(state);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [pet?.questoesHoje, pet?.acertosHoje]);

    // Derive missions from progress (worst areas first) — memoized
    const missions = useMemo(() => {
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

        const areaAnswered = (key: string) => daily?.byArea?.[key]?.answered ?? 0;
        const areaCorrect = (key: string) => daily?.byArea?.[key]?.correct ?? 0;
        const areaAccuracy = (key: string) => {
            const a = areaAnswered(key);
            if (a === 0) return null;
            return Math.round((areaCorrect(key) / a) * 100);
        };

        return [
            {
                title: `3 questões de ${areaLabel(missionAreas[0])}`,
                subtitle: 'Area com maior oportunidade',
                xp: 30,
                areaKey: missionAreas[0],
                done: areaAnswered(missionAreas[0]) >= 3,
                locked: false,
            },
            {
                title: `2 questões de ${areaLabel(missionAreas[1])}`,
                subtitle: 'Continue progredindo',
                xp: 20,
                areaKey: missionAreas[1],
                done: areaAnswered(missionAreas[1]) >= 2,
                locked: areaAnswered(missionAreas[0]) < 3,
            },
            {
                title: 'Atingir 70% de acerto',
                subtitle: `Acerto atual: ${areaAccuracy(missionAreas[2]) !== null ? areaAccuracy(missionAreas[2]) + '%' : '\u2014'}`,
                xp: 50,
                areaKey: missionAreas[2],
                done:
                    (areaAnswered(missionAreas[2]) >= 5) &&
                    (areaAccuracy(missionAreas[2]) ?? 0) >= 70,
                locked: areaAnswered(missionAreas[2]) < 5,
            },
        ] satisfies Mission[];
    }, [progress?.areas, daily]);

    const doneMissions = useMemo(
        () => missions.filter((m) => m.done).length,
        [missions],
    );

    const goToQuestions = useCallback(
        () => router.push('/(tabs)/questions'),
        [router],
    );

    const onRefresh = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        refreshPet();
        refreshProgress();
        getDailyMissionsState().then(setDaily).catch(() => {});
        const t = setTimeout(() => setRefreshing(false), 800);
        return () => clearTimeout(t);
    }, [refreshPet, refreshProgress]);

    // Stats values — memoized
    const statsValues = useMemo(() => [
        { label: 'Sequencia', value: loading ? '\u2014' : `${streak} dias` },
        { label: 'Hoje', value: loading ? '\u2014' : `${questoesHoje} quest.` },
        { label: 'Acerto', value: loading || questoesHoje === 0 ? '\u2014' : `${accuracyPct}%` },
    ], [loading, streak, questoesHoje, accuracyPct]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#02140D' }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: '#031A11',
                }}
            >
                <BrotoLogo size="header" />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {streak > 0 && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginRight: 12,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                backgroundColor: colors.gold.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(251,191,36,0.18)',
                            }}
                        >
                            <View style={{ marginRight: 4 }}>
                                <Flame size={12} color={colors.gold[400]} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 12,
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.green[500]}
                        colors={[colors.green[500]]}
                        progressBackgroundColor="#031A11"
                    />
                }
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 40 + insets.bottom,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Greeting ── */}
                <View style={{ width: '100%', marginBottom: 16 }}>
                    <FadeInSection delay={0}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sans,
                                color: colors.text.secondary,
                                letterSpacing: 0.3,
                            }}
                        >
                            {displayName ? `Bem vindo de volta, ${displayName}` : 'Bem vindo de volta'}
                        </Text>
                        <Text
                            style={{
                                fontSize: 24,
                                fontFamily: fonts.sansMedium,
                                color: colors.text.primary,
                                marginTop: 4,
                            }}
                        >
                            Bora estudar?
                        </Text>
                    </FadeInSection>
                </View>

                {/* ── Pet hero card ── */}
                <View style={{ width: '100%', marginBottom: 24 }}>
                    <FadeInSection delay={100}>
                        <View
                            style={{
                                width: '100%',
                                borderRadius: radii.lg,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: 'rgba(16, 185, 129, 0.18)',
                            }}
                        >
                            <LinearGradient
                                colors={HERO_GRADIENT}
                                locations={HERO_LOCATIONS}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    borderRadius: radii.lg,
                                    pointerEvents: 'none',
                                }}
                            />

                            <View style={{ padding: 24 }}>
                                {/* Pet + info */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* Emoji avatar (circular) */}
                                    <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                            <View
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: 40,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255, 255, 255, 0.06)',
                                                    zIndex: 1,
                                                }}
                                            >
                                            <Text style={{ fontSize: 40 }}>
                                                {FASE_EMOJI[fase]}
                                            </Text>
                                            </View>

                                        {/* Level badge — floats below emoji */}
                                        <View
                                            style={{
                                                marginTop: -14,
                                                zIndex: 2,
                                                borderRadius: 24,
                                                paddingHorizontal: 12,
                                                paddingVertical: 4,
                                                backgroundColor: 'rgba(160, 148, 15, 0.12)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(223, 204, 0, 0.5)',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: fonts.sansBold,
                                                    color: 'rgba(223, 204, 0, 0.9)',
                                                }}
                                            >
                                                Nv. {nivel}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Phase + XP */}
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                fontFamily: fonts.sans,
                                                color: '#BBBBBB',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Seu Broto
                                        </Text>
                                        {loading ? (
                                            <View
                                                style={{
                                                    height: 24,
                                                    width: 110,
                                                    borderRadius: 6,
                                                    backgroundColor: colors.bg.elevated,
                                                    marginBottom: 4,
                                                }}
                                            />
                                        ) : (
                                            <Text
                                                style={{
                                                    fontSize: 26,
                                                    fontFamily: fonts.sansMedium,
                                                    color: colors.text.primary,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {FASE_LABEL[fase]}
                                            </Text>
                                        )}

                                        <View style={{ marginTop: 8 }}>
                                            <View
                                                style={{
                                                    boxShadow: '0px 0px 6px rgba(16, 185, 129, 0.4)',
                                                }}
                                            >
                                                <AnimatedBar
                                                    progress={loading ? 0 : (xpInLevel / 100) * 100}
                                                    color={colors.cta.gradientEnd}
                                                    bgColor="rgba(0,0,0,0.3)"
                                                    height={10}
                                                    delay={500}
                                                />
                                            </View>
                                            <View style={{ marginTop: 6 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        fontFamily: fonts.sans,
                                                        color: '#BBBBBB',
                                                    }}
                                                >
                                                    {loading ? '\u2026' : `${xpInLevel} / 100 XP`}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Stats strip */}
                                <View style={{ marginTop: 20 }}>
                                    <LinearGradient
                                        colors={DIVIDER_GRADIENT}
                                        locations={DIVIDER_LOCATIONS}
                                        start={DIVIDER_START}
                                        end={DIVIDER_END}
                                        style={dividerStyle}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {STAT_ICONS.map(({ key, Icon, iconColor }, i) => (
                                        <View
                                            key={key}
                                            style={{
                                                flex: 1,
                                                alignItems: 'center',
                                                paddingVertical: 8,
                                                borderRadius: radii.sm,
                                                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                            }}
                                        >
                                            <View style={{ marginBottom: 4 }}>
                                                <Icon size={16} color={iconColor} />
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: statsValues[i].label === 'Sequencia' ? 14 : 15,
                                                    fontFamily: fonts.sansMedium,
                                                    color: colors.text.primary,
                                                }}
                                            >
                                                {statsValues[i].value}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: statsValues[i].label === 'Sequencia' ? 10 : 11,
                                                    fontFamily: fonts.sansMedium,
                                                    color: colors.text.muted,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {statsValues[i].label}
                                            </Text>
                                        </View>
                                    ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </FadeInSection>
                </View>

                {/* ── Missions ── */}
                <View style={{ width: '100%', marginBottom: 4 }}>
                    <FadeInSection delay={250}>
                        <View style={{ width: '100%' }}>
                            {/* Section header */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: colors.cta.gradientEnd,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: fonts.sans,
                                            color: '#BBBBBB',
                                            letterSpacing: 0.2,
                                            textTransform: 'uppercase',
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
                                        <View style={{ marginRight: 4 }}>
                                            <Sparkles size={11} color={colors.green[400]} />
                                        </View>
                                    )}
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontFamily: fonts.sans,
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

                            {/* Mission progress bar */}
                            <View style={{ height: 4, marginBottom: 12, justifyContent: 'center' }}>
                                <AnimatedBar
                                    progress={(doneMissions / 3) * 100}
                                    color={colors.cta.gradientEnd}
                                    bgColor={colors.bg.elevated}
                                    height={4}
                                    delay={400}
                                />
                            </View>

                            {/* Mission cards — stable keys */}
                            <View style={{ width: '100%', gap: 8 }}>
                                {missions.map((mission, i) => (
                                    <MissionCard
                                        key={`mission-${i}`}
                                        mission={mission}
                                        onPress={goToQuestions}
                                    />
                                ))}
                            </View>
                        </View>
                    </FadeInSection>
                </View>

                {/* ── CTA Começar missões ── */}
                <View style={{ marginTop: space[3] }}>
                    <StartMissionsButton
                        label={
                            doneMissions === 3
                                ? 'Missões completas! Continuar'
                                : 'COMEÇAR MISSÕES'
                        }
                        onPress={goToQuestions}
                        delay={500}
                        done={doneMissions === 3}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
