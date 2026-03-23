import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight,
    Moon,
    CalendarDays,
    Settings2,
    Clock,
    ChevronRight,
} from 'lucide-react-native';
import { useUser } from '@/hooks/use-user';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { getAreaConfig } from '@/theme/area-config';
import { colors, fonts } from '@/theme/tokens';
import { FadeInSection, StaggerItem, AnimatedBar } from '@/components/AnimatedEntry';
import { BrotoCtaButton } from '@/components/BrotoCtaButton';

// ─── Area config (using shared config) ───────────────────────────────────────
type AreaMeta = {
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    solid: string;
    textColor: string;
    gradientFrom: string;
    gradientTo: string;
};

function getAreaMeta(key: string): AreaMeta {
    const cfg = getAreaConfig(key);
    return {
        Icon: cfg.AltIcon,
        solid: cfg.color,
        textColor: cfg.textColor,
        gradientFrom: cfg.gradientFrom,
        gradientTo: cfg.gradientTo,
    };
}

// DEFAULT_AREA_META no longer needed — getAreaMeta handles fallback

// ─── Date helpers ────────────────────────────────────────────────────────────
const LABELS_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const LABELS_DIA_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function getSegundaDaSemana(d: Date): Date {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function datasDaSemana(segunda: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(segunda);
        d.setDate(segunda.getDate() + i);
        return d;
    });
}

function hojeIdx(): number {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
}

function formatarSemana(segunda: Date): string {
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);
    const dIni = segunda.getDate();
    const dFim = domingo.getDate();
    const mes = MESES[segunda.getMonth()];
    return `${dIni} – ${dFim} de ${mes}`;
}

// ─── Routine generation ──────────────────────────────────────────────────────
interface DiaRotina {
    idx: number;
    label: string;
    labelCurto: string;
    area: AreaStat | null;
    topicosDestaque: { value: string; label: string; accuracyPct: number }[];
    duracaoMin: number;
    ehDescanso: boolean;
    ehHoje: boolean;
    ehPassado: boolean;
}

function gerarRotina(areas: AreaStat[], horasPorDia: number): DiaRotina[] {
    const ordered = [...areas].sort((a, b) => {
        if (a.totalAnswered === 0 && b.totalAnswered === 0) return 0;
        if (a.totalAnswered === 0) return 1;
        if (b.totalAnswered === 0) return -1;
        return a.accuracyPct - b.accuracyPct;
    });

    const PATTERN = [0, 1, 2, 3, 0, 1, -1];
    const hoje = hojeIdx();

    return PATTERN.map((areaIdx, dayIdx) => {
        const area = areaIdx >= 0 && ordered.length > 0
            ? ordered[areaIdx % ordered.length]
            : null;
        const topicosDestaque = area
            ? area.topicos
                  .filter(t => t.totalAnswered > 0)
                  .sort((a, b) => a.accuracyPct - b.accuracyPct)
                  .slice(0, 3)
                  .map(t => ({ value: t.value, label: t.label, accuracyPct: t.accuracyPct }))
            : [];

        return {
            idx: dayIdx,
            label: LABELS_DIA[dayIdx],
            labelCurto: LABELS_DIA_CURTO[dayIdx],
            area,
            topicosDestaque,
            duracaoMin: areaIdx >= 0 ? horasPorDia * 60 : 0,
            ehDescanso: areaIdx < 0,
            ehHoje: dayIdx === hoje,
            ehPassado: dayIdx < hoje,
        };
    });
}

function getDotColor(dia: DiaRotina): string {
    if (dia.ehDescanso) return '#6b7280';
    const area = dia.area;
    if (!area) return '#6b7280';
    return getAreaMeta(area.value).solid;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonPulse({ style }: { style?: import('react-native').StyleProp<import('react-native').ViewStyle> }) {
    return <View style={[{ backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 8 }, style]} />;
}

function SkeletonHero() {
    return (
        <View
            style={{
                borderRadius: 24,
                overflow: 'hidden',
                padding: 24,
                backgroundColor: 'rgba(0, 0, 0, 0.10)',
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <SkeletonPulse style={{ height: 48, width: 48, borderRadius: 24 }} />
                <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonPulse style={{ height: 20, width: 120 }} />
                    <SkeletonPulse style={{ height: 14, width: 80 }} />
                </View>
            </View>
            <SkeletonPulse style={{ height: 8, borderRadius: 999 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                {[1, 2, 3].map(i => (
                    <SkeletonPulse key={i} style={{ height: 32, width: 80, borderRadius: 999 }} />
                ))}
            </View>
            <SkeletonPulse style={{ height: 52, borderRadius: 20, marginTop: 16 }} />
        </View>
    );
}

// ─── Week calendar strip ─────────────────────────────────────────────────────
function WeekCalendar({ rotina }: { rotina: DiaRotina[] }) {
    const segunda = getSegundaDaSemana(new Date());
    const datas = datasDaSemana(segunda);

    return (
        <View
            style={{
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: 'rgba(0, 0, 0, 0.10)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
                {rotina.map((dia, i) => {
                    const isToday = dia.ehHoje;
                    const dotColor = getDotColor(dia);
                    const dayNum = datas[i].getDate();

                    return (
                        <View key={dia.idx} style={{ flex: 1, alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: fonts.sansSemiBold,
                                    color: isToday ? colors.green[400] : colors.text.muted,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {dia.labelCurto}
                            </Text>
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 8,
                                    marginBottom: 6,
                                    backgroundColor: isToday ? colors.green[600] : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: isToday ? fonts.sansBold : fonts.sansMedium,
                                        color: isToday ? '#fff' : (dia.ehPassado ? colors.text.muted : colors.text.primary),
                                    }}
                                >
                                    {dayNum}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: 2.5,
                                    backgroundColor: dia.ehPassado
                                        ? `${dotColor}50`
                                        : isToday
                                            ? '#fff'
                                            : dotColor,
                                }}
                            />
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Card Hoje (hero) ────────────────────────────────────────────────────────
function CardHoje({ dia }: { dia: DiaRotina }) {
    if (dia.ehDescanso) {
        return (
            <View
                style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(107, 114, 128, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(107, 114, 128, 0.15)',
                }}
            >
                <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(107, 114, 128, 0.12)',
                            marginBottom: 16,
                        }}
                    >
                        <Moon size={28} color={colors.text.muted} />
                    </View>
                    <Text
                        style={{
                            fontSize: 18,
                            fontFamily: fonts.sansBold,
                            color: colors.text.primary,
                            textAlign: 'center',
                        }}
                    >
                        Dia de descanso
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            textAlign: 'center',
                            marginTop: 8,
                            maxWidth: 240,
                            lineHeight: 20,
                        }}
                    >
                        Descanse bem — você merece. Volte amanhã com tudo.
                    </Text>
                </View>
            </View>
        );
    }

    const area = dia.area;
    if (!area) return null;
    const meta = getAreaMeta(area.value);
    const horas = Math.floor(dia.duracaoMin / 60);
    const min = dia.duracaoMin % 60;
    const duracaoLabel = min > 0 ? `${horas}h ${min}min` : `${horas}h`;
    const temDados = area.totalAnswered > 0;

    return (
        <View
            style={{
                borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
            }}
        >
            <LinearGradient
                colors={['rgba(34,197,94,0.08)', 'rgba(0,0,0,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
            >
                {/* Area header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <View
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: meta.solid + '20',
                        }}
                    >
                        <meta.Icon size={24} color={meta.solid} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            {area.label}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Clock size={12} color={colors.text.muted} />
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sans,
                                    color: colors.text.secondary,
                                }}
                            >
                                {duracaoLabel} de estudo
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Accuracy bar */}
                {temDados && (
                    <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: fonts.sansSemiBold,
                                    color: colors.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Acerto atual
                            </Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: fonts.sansBold,
                                    color: meta.textColor,
                                }}
                            >
                                {area.accuracyPct}%
                            </Text>
                        </View>
                        <AnimatedBar
                            progress={area.accuracyPct}
                            color={meta.solid}
                            bgColor="rgba(0,0,0,0.3)"
                            height={8}
                            delay={300}
                        />
                    </View>
                )}

                {/* Topics */}
                {dia.topicosDestaque.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.muted,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                marginBottom: 8,
                            }}
                        >
                            Foco de hoje
                        </Text>
                        <View style={{ gap: 6 }}>
                            {dia.topicosDestaque.map(t => (
                                <View
                                    key={t.value}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                    }}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            flex: 1,
                                            fontSize: 13,
                                            fontFamily: fonts.sans,
                                            color: colors.text.secondary,
                                        }}
                                    >
                                        {t.label}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontFamily: fonts.sansBold,
                                            color: meta.textColor,
                                            marginLeft: 8,
                                        }}
                                    >
                                        {t.accuracyPct}%
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {!temDados && (
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            lineHeight: 20,
                            marginBottom: 16,
                        }}
                    >
                        Nenhuma questão desta área ainda. Comece agora!
                    </Text>
                )}

                {/* CTA - mesmo estilo do botão principal de estudo */}
                <Link href="/(tabs)/questions" asChild>
                    <BrotoCtaButton
                        title="ESTUDAR PARA CRESCER"
                        rightIcon={<ArrowRight size={18} color={colors.cta.text} />}
                    />
                </Link>
            </LinearGradient>
        </View>
    );
}

// ─── Linha próximo dia ───────────────────────────────────────────────────────
function LinhaProximoDia({ dia, isLast }: { dia: DiaRotina; isLast: boolean }) {
    if (dia.ehDescanso) {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: 'rgba(255,255,255,0.04)',
                }}
            >
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(107, 114, 128, 0.10)',
                    }}
                >
                    <Moon size={18} color={colors.text.muted} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: fonts.sansSemiBold,
                            color: colors.text.primary,
                        }}
                    >
                        {dia.label}
                    </Text>
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            marginTop: 1,
                        }}
                    >
                        Descanso
                    </Text>
                </View>
            </View>
        );
    }

    const area = dia.area;
    if (!area) return null;
    const meta = getAreaMeta(area.value);
    const horas = Math.floor(dia.duracaoMin / 60);
    const min = dia.duracaoMin % 60;
    const duracaoLabel = min > 0 ? `${horas}h ${min}min` : `${horas}h`;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: 'rgba(255,255,255,0.04)',
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${meta.solid}22`,
                }}
            >
                <meta.Icon size={18} color={meta.textColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontFamily: fonts.sansSemiBold,
                        color: colors.text.primary,
                    }}
                >
                    {dia.label}
                </Text>
                <Text
                    style={{
                        fontSize: 12,
                        fontFamily: fonts.sans,
                        color: colors.text.muted,
                        marginTop: 1,
                    }}
                >
                    {area.label} · {duracaoLabel}
                </Text>
            </View>
            {area.totalAnswered > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: fonts.sansBold,
                            color: meta.textColor,
                        }}
                    >
                        {area.accuracyPct}%
                    </Text>
                    <ChevronRight size={14} color={colors.text.muted} />
                </View>
            )}
        </View>
    );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function RoutineScreen() {
    const scrollRef = useRef<ScrollView>(null);
    const { user, loading: loadingUser, refresh: refreshUser } = useUser();
    const { progress, loading: loadingProgress, refresh: refreshProgress } = useProgress();
    const [refreshing, setRefreshing] = useState(false);

    const loading = loadingUser || loadingProgress;
    const horasPorDia = user?.horasDisponiveisPorDia ?? 2;
    const areas = progress?.areas ?? [];

    const rotina = useMemo(
        () => !loading ? gerarRotina(areas, horasPorDia) : [],
        [loading, areas, horasPorDia],
    );
    const diaHoje = useMemo(() => rotina.find(d => d.ehHoje), [rotina]);
    const proximosDias = useMemo(() => rotina.filter(d => !d.ehHoje && !d.ehPassado), [rotina]);

    const semanaLabel = useMemo(
        () => formatarSemana(getSegundaDaSemana(new Date())),
        [],
    );

    useEffect(() => {
        if (!loading && scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [loading]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshUser();
        refreshProgress();
        const t = setTimeout(() => setRefreshing(false), 800);
        return () => clearTimeout(t);
    }, [refreshUser, refreshProgress]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#02140D' }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingTop: 8,
                    paddingBottom: 8,
                    backgroundColor: '#031A11',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CalendarDays size={18} color={colors.green[500]} />
                    <Text
                        style={{
                            fontSize: 17,
                            fontFamily: fonts.sansBold,
                            color: colors.text.primary,
                        }}
                    >
                        Rotina
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.06)',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontFamily: fonts.sansSemiBold,
                            color: '#BBBBBB',
                        }}
                    >
                        {loading ? '...' : semanaLabel}
                    </Text>
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
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
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Week calendar */}
                {loading ? (
                    <SkeletonPulse style={{ height: 80, borderRadius: 20 }} />
                ) : (
                    <FadeInSection delay={0}>
                        <WeekCalendar rotina={rotina} />
                    </FadeInSection>
                )}

                {/* Section: Hoje */}
                <View style={{ marginTop: 24 }}>
                    <FadeInSection delay={100}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                backgroundColor: colors.gold[500],
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
                                Hoje
                            </Text>
                        </View>
                        {loading ? <SkeletonHero /> : diaHoje ? <CardHoje dia={diaHoje} /> : null}
                    </FadeInSection>
                </View>

                {/* Section: Próximos dias */}
                {!loading && proximosDias.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                        <FadeInSection delay={250}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                }}
                            >
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: colors.text.muted,
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
                                    Próximos dias
                                </Text>
                            </View>
                            <View
                                style={{
                                    borderRadius: 20,
                                    paddingHorizontal: 16,
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(0, 0, 0, 0.10)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                {proximosDias.map((dia, i) => (
                                    <StaggerItem key={dia.idx} index={i} baseDelay={300} stagger={50}>
                                        <LinhaProximoDia
                                            dia={dia}
                                            isLast={i === proximosDias.length - 1}
                                        />
                                    </StaggerItem>
                                ))}
                            </View>
                        </FadeInSection>
                    </View>
                )}

                {loading && (
                    <View style={{ marginTop: 28, gap: 8 }}>
                        {[1, 2, 3].map(i => (
                            <SkeletonPulse key={i} style={{ height: 56, borderRadius: 20 }} />
                        ))}
                    </View>
                )}

                {/* Meta card */}
                {!loading && (
                    <View style={{ marginTop: 24 }}>
                        <FadeInSection delay={400}>
                            <View
                                style={{
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <LinearGradient
                                    colors={['rgba(34,197,94,0.08)', 'rgba(0,0,0,0.10)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ padding: 20 }}
                                >
                                    {/* Header row */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 10,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(34,197,94,0.12)',
                                                }}
                                            >
                                                <Settings2 size={16} color={colors.green[400]} />
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: fonts.sansSemiBold,
                                                    color: colors.text.muted,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                Sua meta
                                            </Text>
                                        </View>
                                        <Link href="/onboarding" asChild>
                                            <Pressable
                                                style={({ pressed }) => ({
                                                    opacity: pressed ? 0.7 : 1,
                                                })}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        fontFamily: fonts.sansSemiBold,
                                                        color: colors.green[400],
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.6,
                                                        paddingHorizontal: 4,
                                                        paddingVertical: 2,
                                                        borderRadius: 999,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    Ajustar
                                                </Text>
                                            </Pressable>
                                        </Link>
                                    </View>

                                    {/* Content */}
                                    <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text
                                            style={{
                                                fontSize: 28,
                                                fontFamily: fonts.sansBold,
                                                color: colors.text.primary,
                                            }}
                                        >
                                            {horasPorDia}h
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: fonts.sans,
                                                color: colors.text.secondary,
                                            }}
                                        >
                                            por dia
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontFamily: fonts.sans,
                                            color: colors.text.muted,
                                            marginTop: 4,
                                            lineHeight: 18,
                                        }}
                                    >
                                        A rotina prioriza automaticamente suas áreas mais fracas
                                    </Text>

                                    {/* Visual bar: 7 day slots */}
                                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 16 }}>
                                        {rotina.map((dia) => (
                                            <View
                                                key={dia.idx}
                                                style={{
                                                    flex: 1,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    backgroundColor: dia.ehDescanso
                                                        ? 'rgba(255,255,255,0.06)'
                                                        : getDotColor(dia) + '60',
                                                }}
                                            />
                                        ))}
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                                        <Text style={{ fontSize: 10, fontFamily: fonts.sans, color: colors.text.muted }}>
                                            Seg
                                        </Text>
                                        <Text style={{ fontSize: 10, fontFamily: fonts.sans, color: colors.text.muted }}>
                                            Dom
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        </FadeInSection>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
