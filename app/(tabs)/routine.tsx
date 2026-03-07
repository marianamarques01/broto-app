import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowRight,
    Moon,
    FileText,
    Globe,
    FlaskConical,
    Calculator,
    BookOpen,
} from 'lucide-react-native';
import { useUser } from '@/hooks/use-user';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { colors } from '@/theme/tokens';

type AreaMeta = {
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    bg: string;
    textColor: string;
};

const AREA_META: Record<string, AreaMeta> = {
    linguagens: {
        Icon: FileText,
        bg: 'rgba(59,130,246,0.06)',
        textColor: '#3b82f6',
    },
    'ciencias-humanas': {
        Icon: Globe,
        bg: 'rgba(245,158,11,0.06)',
        textColor: '#f59e0b',
    },
    'ciencias-natureza': {
        Icon: FlaskConical,
        bg: 'rgba(34,197,94,0.06)',
        textColor: '#22c55e',
    },
    matematica: {
        Icon: Calculator,
        bg: 'rgba(168,85,247,0.06)',
        textColor: '#a855f7',
    },
};

const DEFAULT_AREA_META: AreaMeta = {
    Icon: BookOpen,
    bg: colors.bg.card,
    textColor: colors.text.primary,
};

const LABELS_DIA = [
    'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo',
];
const LABELS_DIA_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

interface DiaRotina {
    idx: number;
    label: string;
    labelCurto: string;
    area: AreaStat | null;
    topicosDestaque: { value: string; label: string; accuracyPct: number }[];
    duracaoMin: number;
    ehDescanso: boolean;
    ehHoje: boolean;
}

function hojeIdx(): number {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
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
        const area = areaIdx >= 0 ? ordered[areaIdx % ordered.length] : null;
        const topicosDestaque = area
            ? area.topicos
                  .filter(t => t.totalAnswered > 0)
                  .sort((a, b) => a.accuracyPct - b.accuracyPct)
                  .slice(0, 2)
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
        };
    });
}

function DiaHojeCard({ dia }: { dia: DiaRotina }) {
    if (dia.ehDescanso) {
        return (
            <View
                className="items-center gap-3 rounded-2xl border p-6"
                style={{
                    borderColor: colors.border.default,
                    backgroundColor: colors.bg.card,
                }}
            >
                <Moon size={36} color={colors.text.muted} />
                <View>
                    <Text className="text-center text-base font-bold text-foreground">
                        Dia de descanso
                    </Text>
                    <Text className="mt-1 text-center text-sm text-muted-foreground">
                        Descanse bem — voce merece! Volte amanha.
                    </Text>
                </View>
            </View>
        );
    }

    const area = dia.area!;
    const meta = AREA_META[area.value] ?? DEFAULT_AREA_META;
    const horas = Math.floor(dia.duracaoMin / 60);
    const min = dia.duracaoMin % 60;
    const duracaoLabel = min > 0 ? `${horas}h${min}min` : `${horas}h`;

    return (
        <View
            className="overflow-hidden rounded-2xl border"
            style={{
                borderColor: colors.border.default,
                backgroundColor: meta.bg,
            }}
        >
            <View className="flex-row items-center gap-3 p-4 pb-3">
                <View
                    className="h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: colors.bg.surface }}
                >
                    <meta.Icon size={24} color={meta.textColor} />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                        {area.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        {duracaoLabel} de estudo
                        {area.totalAnswered > 0 &&
                            ` · ${area.accuracyPct}% de acerto`}
                    </Text>
                </View>
            </View>

            {dia.topicosDestaque.length > 0 && (
                <View
                    className="border-t px-4 py-3"
                    style={{ borderTopColor: colors.border.subtle }}
                >
                    <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Foco de hoje
                    </Text>
                    <View className="gap-1.5">
                        {dia.topicosDestaque.map(t => (
                            <View
                                key={t.value}
                                className="flex-row items-center justify-between"
                            >
                                <Text className="text-sm text-foreground">
                                    {t.label}
                                </Text>
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: meta.textColor }}
                                >
                                    {t.accuracyPct}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {area.totalAnswered === 0 && (
                <View
                    className="border-t px-4 py-3"
                    style={{ borderTopColor: colors.border.subtle }}
                >
                    <Text className="text-sm text-muted-foreground">
                        Nenhuma questao desta area ainda. Comece agora!
                    </Text>
                </View>
            )}

            <View className="px-4 pb-4 pt-2">
                <Link href="/(tabs)/questions" asChild>
                    <Pressable
                        className="w-full flex-row items-center justify-center gap-2 rounded-xl py-3"
                        style={{ backgroundColor: colors.green[600] }}
                    >
                        <Text className="text-sm font-bold text-white">
                            Estudar {area.label}
                        </Text>
                        <ArrowRight size={16} color="#fff" />
                    </Pressable>
                </Link>
            </View>
        </View>
    );
}

function DiaCompactoCard({ dia }: { dia: DiaRotina }) {
    if (dia.ehDescanso) {
        return (
            <View
                className="flex-row items-center gap-3 rounded-xl border px-4 py-3 opacity-50"
                style={{
                    borderColor: colors.border.default,
                    backgroundColor: colors.bg.card,
                }}
            >
                <Moon size={16} color={colors.text.muted} />
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                        {dia.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        Descanso
                    </Text>
                </View>
            </View>
        );
    }

    const area = dia.area!;
    const meta = AREA_META[area.value] ?? DEFAULT_AREA_META;

    return (
        <View
            className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
            style={{
                borderColor: colors.border.default,
                backgroundColor: meta.bg,
            }}
        >
            <meta.Icon size={20} color={meta.textColor} />
            <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                    {dia.label}
                </Text>
                <Text className="text-xs text-muted-foreground">
                    {area.label}
                </Text>
            </View>
            {area.totalAnswered > 0 && (
                <Text
                    className="text-xs font-bold"
                    style={{ color: meta.textColor }}
                >
                    {area.accuracyPct}%
                </Text>
            )}
        </View>
    );
}

export default function RoutineScreen() {
    const { user, loading: loadingUser } = useUser();
    const { progress, loading: loadingProgress } = useProgress();

    const loading = loadingUser || loadingProgress;
    const horasPorDia = user?.horasDisponiveisPorDia ?? 2;
    const areas = progress?.areas ?? [];

    const rotina = !loading ? gerarRotina(areas, horasPorDia) : [];
    const diaHoje = rotina.find(d => d.ehHoje);
    const outrosDias = rotina.filter(d => !d.ehHoje);
    const hoje = hojeIdx();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View
                className="border-b px-4 py-3"
                style={{
                    borderBottomColor: colors.border.default,
                    backgroundColor: colors.bg.deep,
                }}
            >
                <Text className="text-base font-bold text-foreground">
                    Rotina de Estudos
                </Text>
            </View>

            <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ gap: 20 }}>
                {/* Week strip */}
                <View className="flex-row gap-1.5">
                    {LABELS_DIA_CURTO.map((label, idx) => {
                        const dia = rotina[idx];
                        const isHoje = idx === hoje;
                        const isPast = idx < hoje;
                        const areaValue = dia?.area?.value;
                        const meta = areaValue
                            ? AREA_META[areaValue]
                            : null;

                        return (
                            <View
                                key={label}
                                className="flex-1 items-center gap-1 rounded-xl p-2"
                                style={{
                                    backgroundColor: isHoje
                                        ? colors.green[600]
                                        : isPast
                                          ? colors.bg.surface
                                          : colors.bg.card,
                                    opacity: isPast && !isHoje ? 0.4 : 1,
                                }}
                            >
                                <Text
                                    className="text-[10px] font-semibold"
                                    style={{
                                        color: isHoje
                                            ? '#fff'
                                            : colors.text.muted,
                                    }}
                                >
                                    {label}
                                </Text>
                                {loading ? (
                                    <Text className="text-sm leading-none text-muted-foreground">·</Text>
                                ) : dia?.ehDescanso ? (
                                    <Moon
                                        size={18}
                                        color={isHoje ? '#fff' : colors.text.muted}
                                    />
                                ) : (() => {
                                    const M = meta ?? DEFAULT_AREA_META;
                                    const Icon = M.Icon;
                                    return (
                                        <Icon
                                            size={18}
                                            color={isHoje ? '#fff' : M.textColor}
                                        />
                                    );
                                })()}
                            </View>
                        );
                    })}
                </View>

                {/* Today */}
                <View>
                    <Text className="mb-3 text-sm font-bold text-foreground">
                        Hoje
                    </Text>
                    {loading ? (
                        <View
                            className="h-48 rounded-2xl"
                            style={{ backgroundColor: colors.bg.surface }}
                        />
                    ) : diaHoje ? (
                        <DiaHojeCard dia={diaHoje} />
                    ) : null}
                </View>

                {/* Rest of week */}
                <View>
                    <Text className="mb-3 text-sm font-bold text-foreground">
                        Esta semana
                    </Text>
                    {loading ? (
                        <View className="gap-2">
                            {[1, 2, 3].map(i => (
                                <View
                                    key={i}
                                    className="h-14 rounded-xl"
                                    style={{
                                        backgroundColor: colors.bg.surface,
                                    }}
                                />
                            ))}
                        </View>
                    ) : (
                        <View className="gap-2">
                            {outrosDias.map(dia => (
                                <DiaCompactoCard key={dia.idx} dia={dia} />
                            ))}
                        </View>
                    )}
                </View>

                {/* Meta */}
                {!loading && (
                    <View
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: colors.border.default,
                            backgroundColor: colors.green.glow,
                        }}
                    >
                        <Text className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            Sua meta
                        </Text>
                        <Text className="mt-1.5 text-sm text-foreground">
                            {horasPorDia}h de estudo por dia · rotina prioriza
                            suas areas mais fracas
                        </Text>
                        <Link href="/onboarding" asChild>
                            <Pressable className="mt-2 flex-row items-center gap-1">
                                <Text className="text-xs font-semibold text-primary">
                                    Ajustar meta
                                </Text>
                                <ArrowRight
                                    size={12}
                                    color={colors.green[500]}
                                />
                            </Pressable>
                        </Link>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
