import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react-native';
import {
    useProgress,
    type AreaStat,
    type TopicoStat,
} from '@/hooks/use-progress';
import { colors } from '@/theme/tokens';

const AREA_STYLE: Record<
    string,
    { bg: string; bar: string; textColor: string; glow: string }
> = {
    linguagens: {
        bg: 'rgba(59,130,246,0.06)',
        bar: '#3b82f6',
        textColor: '#3b82f6',
        glow: 'rgba(59,130,246,0.25)',
    },
    'ciencias-humanas': {
        bg: 'rgba(245,158,11,0.06)',
        bar: '#f59e0b',
        textColor: '#f59e0b',
        glow: 'rgba(245,158,11,0.25)',
    },
    'ciencias-natureza': {
        bg: 'rgba(34,197,94,0.06)',
        bar: '#22c55e',
        textColor: '#22c55e',
        glow: 'rgba(34,197,94,0.25)',
    },
    matematica: {
        bg: 'rgba(168,85,247,0.06)',
        bar: '#a855f7',
        textColor: '#a855f7',
        glow: 'rgba(168,85,247,0.25)',
    },
};

function AreaCard({ area, loading }: { area: AreaStat; loading: boolean }) {
    const style = AREA_STYLE[area.value] ?? {
        bg: colors.bg.card,
        bar: colors.green[500],
        textColor: colors.green[500],
        glow: colors.green.glow,
    };

    return (
        <View
            className="rounded-2xl border p-4"
            style={{
                borderColor: colors.border.default,
                backgroundColor: style.bg,
            }}
        >
            <View className="mb-2.5 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">
                    {area.label}
                </Text>
                {loading ? (
                    <View className="h-4 w-10 rounded bg-muted" />
                ) : (
                    <Text
                        className="text-sm font-bold"
                        style={{ color: style.textColor }}
                    >
                        {area.totalAnswered > 0 ? `${area.accuracyPct}%` : '—'}
                    </Text>
                )}
            </View>
            <View
                className="h-2.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: colors.bg.surface }}
            >
                <View
                    className="h-full rounded-full"
                    style={{
                        width: loading ? '0%' : `${area.accuracyPct}%`,
                        backgroundColor: style.bar,
                    }}
                />
            </View>
            {!loading && area.totalAnswered > 0 && (
                <Text className="mt-2 text-[11px] text-muted-foreground">
                    {area.totalAnswered} questoes · {area.totalCorrect} acertos
                </Text>
            )}
        </View>
    );
}

function TopicoChip({
    t,
    variant,
}: {
    t: TopicoStat;
    variant: 'forte' | 'fraco';
}) {
    const isForte = variant === 'forte';
    return (
        <View
            className="flex-row items-center justify-between rounded-xl border px-3.5 py-3"
            style={{
                backgroundColor: isForte
                    ? 'rgba(34,197,94,0.06)'
                    : colors.red.glow,
                borderColor: isForte
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(239,68,68,0.15)',
            }}
        >
            <View className="flex-1">
                <Text
                    className="text-sm font-medium text-foreground"
                    numberOfLines={1}
                >
                    {t.label}
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                    {t.totalAnswered} questoes
                </Text>
            </View>
            <Text
                className="ml-3 text-sm font-bold"
                style={{
                    color: isForte ? colors.green[500] : colors.red[500],
                }}
            >
                {t.accuracyPct}%
            </Text>
        </View>
    );
}

function topFortes(areas: AreaStat[]): TopicoStat[] {
    return areas
        .flatMap(a => a.topicos)
        .filter(t => t.totalAnswered >= 3)
        .sort((a, b) => b.accuracyPct - a.accuracyPct)
        .slice(0, 3);
}

function topFracos(areas: AreaStat[]): TopicoStat[] {
    return areas
        .flatMap(a => a.topicos)
        .filter(t => t.totalAnswered >= 3)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 3);
}

const DEFAULT_AREAS: AreaStat[] = [
    { value: 'linguagens', label: 'Linguagens', totalAnswered: 0, totalCorrect: 0, accuracyPct: 0, topicos: [] },
    { value: 'ciencias-humanas', label: 'Ciencias Humanas', totalAnswered: 0, totalCorrect: 0, accuracyPct: 0, topicos: [] },
    { value: 'ciencias-natureza', label: 'Ciencias da Natureza', totalAnswered: 0, totalCorrect: 0, accuracyPct: 0, topicos: [] },
    { value: 'matematica', label: 'Matematica', totalAnswered: 0, totalCorrect: 0, accuracyPct: 0, topicos: [] },
];

export default function ProgressScreen() {
    const { progress, loading } = useProgress();

    const hasData = !loading && progress !== null && progress.totalAnswered > 0;
    const isEmpty =
        !loading && (progress === null || progress.totalAnswered === 0);

    const fortes = hasData ? topFortes(progress!.areas) : [];
    const fracos = hasData ? topFracos(progress!.areas) : [];

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
                    Progresso
                </Text>
            </View>

            <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ gap: 20 }}>
                {/* Summary */}
                <View className="flex-row gap-3">
                    {[
                        {
                            value: loading ? null : (progress?.totalAnswered ?? 0),
                            label: 'questoes',
                        },
                        {
                            value: loading ? null : (progress?.totalCorrect ?? 0),
                            label: 'acertos',
                        },
                        {
                            value: loading
                                ? null
                                : progress?.totalAnswered
                                  ? `${progress.accuracyPct}%`
                                  : '—',
                            label: 'de acerto',
                        },
                    ].map(({ value, label }) => (
                        <View
                            key={label}
                            className="flex-1 items-center rounded-2xl border p-3.5"
                            style={{
                                borderColor: colors.border.default,
                                backgroundColor: colors.bg.card,
                            }}
                        >
                            {loading ? (
                                <View className="h-6 w-10 rounded bg-muted" />
                            ) : (
                                <Text className="text-xl font-bold text-foreground">
                                    {value}
                                </Text>
                            )}
                            <Text className="mt-0.5 text-[10px] text-muted-foreground">
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Areas */}
                <View>
                    <Text className="mb-3 text-sm font-bold text-foreground">
                        Desempenho por area
                    </Text>
                    <View className="gap-3">
                        {(progress?.areas ?? DEFAULT_AREAS).map(area => (
                            <AreaCard
                                key={area.value}
                                area={area}
                                loading={loading}
                            />
                        ))}
                    </View>
                </View>

                {/* Fortes */}
                {hasData && fortes.length > 0 && (
                    <View>
                        <View className="mb-2.5 flex-row items-center gap-2">
                            <TrendingUp size={15} color={colors.green[500]} />
                            <Text className="text-sm font-bold text-foreground">
                                Pontos fortes
                            </Text>
                        </View>
                        <View className="gap-2">
                            {fortes.map(t => (
                                <TopicoChip
                                    key={t.value}
                                    t={t}
                                    variant="forte"
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Fracos */}
                {hasData && fracos.length > 0 && (
                    <View>
                        <View className="mb-2.5 flex-row items-center gap-2">
                            <TrendingDown size={15} color={colors.red[500]} />
                            <Text className="text-sm font-bold text-foreground">
                                Pontos a melhorar
                            </Text>
                        </View>
                        <View className="gap-2">
                            {fracos.map(t => (
                                <TopicoChip
                                    key={t.value}
                                    t={t}
                                    variant="fraco"
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty */}
                {isEmpty && (
                    <View
                        className="items-center rounded-2xl border p-6"
                        style={{
                            borderColor: colors.border.default,
                            backgroundColor: colors.bg.card,
                        }}
                    >
                        <View
                            className="h-16 w-16 items-center justify-center rounded-2xl"
                            style={{
                                backgroundColor: colors.green.glow,
                                borderWidth: 1,
                                borderColor: colors.border.default,
                            }}
                        >
                            <BarChart3 size={32} color={colors.green[500]} />
                        </View>
                        <Text className="mt-4 text-sm font-semibold text-foreground">
                            Responda questoes para ver seu progresso!
                        </Text>
                        <Text className="mt-1 text-xs text-muted-foreground">
                            Seus dados de desempenho por area aparecerao aqui.
                        </Text>
                        <Link href="/(tabs)/questions" asChild>
                            <Pressable
                                className="mt-4 flex-row items-center gap-2 rounded-xl px-5 py-2.5"
                                style={{
                                    backgroundColor: colors.green[600],
                                }}
                            >
                                <Text className="text-sm font-bold text-white">
                                    Praticar questoes
                                </Text>
                                <ArrowRight size={16} color="#fff" />
                            </Pressable>
                        </Link>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
