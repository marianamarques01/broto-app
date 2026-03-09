import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight,
    Moon,
    FileText,
    Globe,
    FlaskConical,
    Calculator,
    BookOpen,
    CalendarDays,
    Settings2,
    Sparkles,
    Clock,
    ChevronRight,
} from 'lucide-react-native';
import { useUser } from '@/hooks/use-user';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { colors, fonts } from '@/theme/tokens';

type AreaMeta = {
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    solid: string;
    bg: string;
    textColor: string;
    gradientFrom: string;
    gradientTo: string;
};

const AREA_META: Record<string, AreaMeta> = {
    linguagens: {
        Icon: FileText,
        solid: '#3b82f6',
        bg: 'rgba(59,130,246,0.10)',
        textColor: '#60a5fa',
        gradientFrom: 'rgba(59,130,246,0.18)',
        gradientTo: 'rgba(59,130,246,0.03)',
    },
    'ciencias-humanas': {
        Icon: Globe,
        solid: '#f59e0b',
        bg: 'rgba(245,158,11,0.10)',
        textColor: '#fbbf24',
        gradientFrom: 'rgba(245,158,11,0.18)',
        gradientTo: 'rgba(245,158,11,0.03)',
    },
    'ciencias-natureza': {
        Icon: FlaskConical,
        solid: '#22c55e',
        bg: 'rgba(34,197,94,0.10)',
        textColor: '#34d399',
        gradientFrom: 'rgba(34,197,94,0.18)',
        gradientTo: 'rgba(34,197,94,0.03)',
    },
    matematica: {
        Icon: Calculator,
        solid: '#a855f7',
        bg: 'rgba(168,85,247,0.10)',
        textColor: '#c084fc',
        gradientFrom: 'rgba(168,85,247,0.18)',
        gradientTo: 'rgba(168,85,247,0.03)',
    },
};

const DESCANSO_COLOR = '#6b7280';

const DEFAULT_AREA_META: AreaMeta = {
    Icon: BookOpen,
    solid: colors.text.muted,
    bg: colors.bg.card,
    textColor: colors.text.primary,
    gradientFrom: colors.bg.card,
    gradientTo: colors.bg.surface,
};

const LABELS_DIA = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo',
];
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
                  .map(t => ({
                      value: t.value,
                      label: t.label,
                      accuracyPct: t.accuracyPct,
                  }))
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
    if (dia.ehDescanso) return DESCANSO_COLOR;
    const area = dia.area;
    if (!area) return DESCANSO_COLOR;
    return AREA_META[area.value]?.solid ?? DESCANSO_COLOR;
}

// ——— Skeleton ———
function SkeletonPulse({ style, className }: { style?: import('react-native').StyleProp<import('react-native').ViewStyle>; className?: string }) {
    return (
        <View
            className={className}
            style={[{ backgroundColor: colors.bg.elevated }, style]}
        />
    );
}

function SkeletonHero() {
    return (
        <View
            className="rounded-3xl overflow-hidden p-6"
            style={{ backgroundColor: colors.bg.surface }}
        >
            <View className="flex-row items-center gap-4 mb-4">
                <SkeletonPulse className="h-14 w-14 rounded-2xl" />
                <View className="flex-1 gap-2">
                    <SkeletonPulse className="h-5 w-28 rounded" />
                    <SkeletonPulse className="h-4 w-20 rounded" />
                </View>
            </View>
            <SkeletonPulse className="h-2.5 rounded-full" />
            <View className="flex-row gap-2 mt-4">
                {[1, 2, 3].map(i => (
                    <SkeletonPulse key={i} className="h-8 w-20 rounded-full" />
                ))}
            </View>
            <SkeletonPulse className="h-14 rounded-2xl mt-4" />
        </View>
    );
}

// ——— Week calendar strip ———
function WeekCalendar({ rotina }: { rotina: DiaRotina[] }) {
    const segunda = getSegundaDaSemana(new Date());
    const datas = datasDaSemana(segunda);

    return (
        <View
            className="rounded-2xl overflow-hidden"
            style={{
                backgroundColor: colors.bg.card,
                borderWidth: 1,
                borderColor: colors.border.subtle,
            }}
        >
            <View className="flex-row justify-between px-3 pt-3 pb-2">
                {rotina.map((dia, i) => {
                    const isToday = dia.ehHoje;
                    const dotColor = getDotColor(dia);
                    const dayNum = datas[i].getDate();

                    return (
                        <View key={dia.idx} className="flex-1 items-center">
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
                                className="items-center justify-center mt-2 mb-1.5"
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
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

// ——— Card Hoje (hero) ———
function CardHoje({ dia }: { dia: DiaRotina }) {
    if (dia.ehDescanso) {
        return (
            <View
                className="rounded-3xl overflow-hidden"
                style={{
                    backgroundColor: 'rgba(107, 114, 128, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(107, 114, 128, 0.15)',
                }}
            >
                <View className="items-center py-8 px-6">
                    <View
                        className="h-16 w-16 items-center justify-center rounded-full mb-4"
                        style={{ backgroundColor: 'rgba(107, 114, 128, 0.12)' }}
                    >
                        <Moon size={28} color={colors.text.muted} />
                    </View>
                    <Text
                        className="text-lg text-center"
                        style={{ color: colors.text.primary, fontFamily: fonts.sansBold }}
                    >
                        Dia de descanso
                    </Text>
                    <Text
                        className="text-sm text-center mt-2"
                        style={{
                            color: colors.text.muted,
                            fontFamily: fonts.sans,
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

    const area = dia.area!;
    const meta = AREA_META[area.value] ?? DEFAULT_AREA_META;
    const horas = Math.floor(dia.duracaoMin / 60);
    const min = dia.duracaoMin % 60;
    const duracaoLabel = min > 0 ? `${horas}h ${min}min` : `${horas}h`;
    const temDados = area.totalAnswered > 0;

    return (
        <View
            className="rounded-3xl overflow-hidden"
            style={{
                borderWidth: 1,
                borderColor: meta.textColor + '20',
            }}
        >
            {/* Gradient bg layer */}
            <LinearGradient
                colors={[meta.gradientFrom, meta.gradientTo, colors.bg.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
            >
                {/* Area header */}
                <View className="flex-row items-center gap-3.5 mb-4">
                    <View
                        className="h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: meta.solid + '20' }}
                    >
                        <meta.Icon size={24} color={meta.solid} />
                    </View>
                    <View className="flex-1">
                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            {area.label}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
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
                    <View className="mb-4">
                        <View className="flex-row items-center justify-between mb-1.5">
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
                        <View
                            className="h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: colors.bg.deep }}
                        >
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: `${area.accuracyPct}%`,
                                    backgroundColor: meta.solid,
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* Topics */}
                {dia.topicosDestaque.length > 0 && (
                    <View className="mb-4">
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
                        <View className="gap-1.5">
                            {dia.topicosDestaque.map(t => (
                                <View
                                    key={t.value}
                                    className="flex-row items-center justify-between rounded-xl px-3 py-2.5"
                                    style={{ backgroundColor: colors.bg.deep + 'CC' }}
                                >
                                    <Text
                                        className="flex-1"
                                        numberOfLines={1}
                                        style={{
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
                        className="mb-4"
                        style={{
                            fontSize: 13,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            lineHeight: 20,
                        }}
                    >
                        Nenhuma questão desta área ainda. Comece agora!
                    </Text>
                )}

                {/* CTA */}
                <Link href="/(tabs)/questions" asChild>
                    <Pressable
                        className="flex-row items-center justify-center gap-2 rounded-xl py-4"
                        style={{ backgroundColor: colors.green[600] }}
                    >
                        <Sparkles size={16} color="#fff" />
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: fonts.sansBold,
                                color: '#fff',
                            }}
                        >
                            Estudar agora
                        </Text>
                        <ArrowRight size={18} color="#fff" />
                    </Pressable>
                </Link>
            </LinearGradient>
        </View>
    );
}

// ——— Linha próximo dia ———
function LinhaProximoDia({ dia, isLast }: { dia: DiaRotina; isLast: boolean }) {
    if (dia.ehDescanso) {
        return (
            <View
                className="flex-row items-center gap-3 py-3.5 px-1"
                style={isLast ? undefined : {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                }}
            >
                <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'rgba(107, 114, 128, 0.10)' }}
                >
                    <Moon size={18} color={colors.text.muted} />
                </View>
                <View className="flex-1">
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
                        }}
                    >
                        Descanso
                    </Text>
                </View>
            </View>
        );
    }

    const area = dia.area!;
    const meta = AREA_META[area.value] ?? DEFAULT_AREA_META;
    const horas = Math.floor(dia.duracaoMin / 60);
    const min = dia.duracaoMin % 60;
    const duracaoLabel = min > 0 ? `${horas}h ${min}min` : `${horas}h`;

    return (
        <View
            className="flex-row items-center gap-3 py-3.5 px-1"
            style={isLast ? undefined : {
                borderBottomWidth: 1,
                borderBottomColor: colors.border.subtle,
            }}
        >
            <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: meta.bg }}
            >
                <meta.Icon size={18} color={meta.textColor} />
            </View>
            <View className="flex-1">
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
                    }}
                >
                    {area.label} · {duracaoLabel}
                </Text>
            </View>
            {area.totalAnswered > 0 && (
                <View className="flex-row items-center gap-1.5">
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

export default function RoutineScreen() {
    const scrollRef = useRef<ScrollView>(null);
    const { user, loading: loadingUser } = useUser();
    const { progress, loading: loadingProgress } = useProgress();

    const loading = loadingUser || loadingProgress;
    const horasPorDia = user?.horasDisponiveisPorDia ?? 2;
    const areas = progress?.areas ?? [];

    const rotina = !loading ? gerarRotina(areas, horasPorDia) : [];
    const diaHoje = rotina.find(d => d.ehHoje);
    const proximosDias = rotina.filter(d => !d.ehHoje && !d.ehPassado);

    const segundaAtual = getSegundaDaSemana(new Date());
    const semanaLabel = formatarSemana(segundaAtual);

    useEffect(() => {
        if (!loading && scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [loading]);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
            {/* Header */}
            <View
                className="px-5 pt-2 pb-4"
                style={{ backgroundColor: colors.bg.deep }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
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
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.secondary,
                            }}
                        >
                            {loading ? '...' : semanaLabel}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Week calendar */}
                {loading ? (
                    <SkeletonPulse
                        className="rounded-2xl"
                        style={{ height: 80, backgroundColor: colors.bg.surface }}
                    />
                ) : (
                    <WeekCalendar rotina={rotina} />
                )}

                {/* Section: Hoje */}
                <View className="mt-6">
                    <View className="flex-row items-center gap-2 mb-3">
                        <View
                            style={{
                                width: 3,
                                height: 14,
                                borderRadius: 1.5,
                                backgroundColor: colors.green[500],
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.sansBold,
                                color: colors.text.muted,
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                            }}
                        >
                            Hoje
                        </Text>
                    </View>
                    {loading ? <SkeletonHero /> : diaHoje ? <CardHoje dia={diaHoje} /> : null}
                </View>

                {/* Section: Próximos dias */}
                {!loading && proximosDias.length > 0 && (
                    <View className="mt-7">
                        <View className="flex-row items-center gap-2 mb-3">
                            <View
                                style={{
                                    width: 3,
                                    height: 14,
                                    borderRadius: 1.5,
                                    backgroundColor: colors.text.muted,
                                    opacity: 0.5,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sansBold,
                                    color: colors.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.5,
                                }}
                            >
                                Próximos dias
                            </Text>
                        </View>
                        <View
                            className="rounded-2xl px-4 overflow-hidden"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderWidth: 1,
                                borderColor: colors.border.subtle,
                            }}
                        >
                            {proximosDias.map((dia, i) => (
                                <LinhaProximoDia
                                    key={dia.idx}
                                    dia={dia}
                                    isLast={i === proximosDias.length - 1}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {loading && (
                    <View className="mt-7 gap-2">
                        {[1, 2, 3].map(i => (
                            <SkeletonPulse
                                key={i}
                                className="rounded-xl"
                                style={{ height: 56, backgroundColor: colors.bg.surface }}
                            />
                        ))}
                    </View>
                )}

                {/* Meta card */}
                {!loading && (
                    <View
                        className="mt-7 rounded-2xl overflow-hidden"
                        style={{
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ padding: 16 }}
                        >
                            <View className="flex-row items-center gap-2 mb-2">
                                <Settings2 size={14} color={colors.green[500]} />
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: fonts.sansBold,
                                        color: colors.green[500],
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                    }}
                                >
                                    Sua meta
                                </Text>
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: fonts.sans,
                                    color: colors.text.primary,
                                    lineHeight: 20,
                                }}
                            >
                                {horasPorDia}h por dia · rotina prioriza áreas mais fracas
                            </Text>
                            <Link href="/onboarding" asChild>
                                <Pressable className="mt-3 flex-row items-center gap-1.5">
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontFamily: fonts.sansSemiBold,
                                            color: colors.green[400],
                                        }}
                                    >
                                        Ajustar meta
                                    </Text>
                                    <ArrowRight size={14} color={colors.green[400]} />
                                </Pressable>
                            </Link>
                        </LinearGradient>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
