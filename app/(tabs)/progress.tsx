import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight,
    TrendingUp,
    TrendingDown,
    BarChart3,
    FileText,
    Globe,
    FlaskConical,
    Calculator,
    BookOpen,
    PenLine,
    Target,
    CheckCircle2,
} from 'lucide-react-native';
import {
    useProgress,
    type AreaStat,
    type TopicoStat,
} from '@/hooks/use-progress';
import { colors, fonts } from '@/theme/tokens';
import { FadeInSection, StaggerItem, AnimatedBar } from '@/components/AnimatedEntry';

const AREA_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    linguagens: FileText,
    'ciencias-humanas': Globe,
    'ciencias-natureza': FlaskConical,
    matematica: Calculator,
};

const AREA_STYLE: Record<
    string,
    { bg: string; bar: string; textColor: string; gradientFrom: string; gradientTo: string }
> = {
    linguagens: {
        bg: 'rgba(43,164,184,0.06)',
        bar: colors.blue[500],
        textColor: colors.blue[400],
        gradientFrom: 'rgba(43,164,184,0.06)',
        gradientTo: 'rgba(43,164,184,0.01)',
    },
    'ciencias-humanas': {
        bg: 'rgba(229,150,14,0.06)',
        bar: colors.amber[500],
        textColor: colors.amber[400],
        gradientFrom: 'rgba(229,150,14,0.06)',
        gradientTo: 'rgba(229,150,14,0.01)',
    },
    'ciencias-natureza': {
        bg: 'rgba(16,185,129,0.06)',
        bar: colors.green[500],
        textColor: colors.green[400],
        gradientFrom: 'rgba(16,185,129,0.06)',
        gradientTo: 'rgba(16,185,129,0.01)',
    },
    matematica: {
        bg: 'rgba(155,109,204,0.06)',
        bar: colors.violet[500],
        textColor: colors.violet[400],
        gradientFrom: 'rgba(155,109,204,0.06)',
        gradientTo: 'rgba(155,109,204,0.01)',
    },
};

function AreaCard({ area, loading }: { area: AreaStat; loading: boolean }) {
    const style = AREA_STYLE[area.value] ?? {
        bg: colors.bg.card,
        bar: colors.green[500],
        textColor: colors.green[400],
        gradientFrom: colors.green.glow,
        gradientTo: 'rgba(16,185,129,0)',
    };
    const Icon = AREA_ICONS[area.value] ?? BookOpen;

    return (
        <View
            className="rounded-2xl overflow-hidden"
            style={{
                borderWidth: 1,
                borderColor: style.bar + '15',
            }}
        >
            <LinearGradient
                colors={[style.gradientFrom, style.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
            >
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2.5">
                        <View
                            className="h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: style.bar + '20' }}
                        >
                            <Icon size={16} color={style.textColor} />
                        </View>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.primary,
                            }}
                        >
                            {area.label}
                        </Text>
                    </View>
                    {loading ? (
                        <View
                            className="h-4 w-10 rounded"
                            style={{ backgroundColor: colors.bg.elevated }}
                        />
                    ) : (
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: fonts.sansBold,
                                color: style.textColor,
                            }}
                        >
                            {area.totalAnswered > 0 ? `${area.accuracyPct}%` : '—'}
                        </Text>
                    )}
                </View>
                <AnimatedBar
                    progress={loading ? 0 : area.accuracyPct}
                    color={style.bar}
                    bgColor={colors.bg.deep}
                    height={10}
                    delay={400}
                />
                {!loading && area.totalAnswered > 0 && (
                    <Text
                        style={{
                            fontSize: 11,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                            marginTop: 8,
                        }}
                    >
                        {area.totalAnswered} questoes · {area.totalCorrect} acertos
                    </Text>
                )}
            </LinearGradient>
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
            className="flex-row items-center justify-between rounded-xl px-3.5 py-3"
            style={{
                backgroundColor: isForte
                    ? 'rgba(16,185,129,0.06)'
                    : colors.red.glow,
                borderWidth: 1,
                borderColor: isForte
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(224,82,82,0.12)',
            }}
        >
            <View className="flex-1">
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 14,
                        fontFamily: fonts.sansMedium,
                        color: colors.text.primary,
                    }}
                >
                    {t.label}
                </Text>
                <Text
                    style={{
                        fontSize: 11,
                        fontFamily: fonts.sans,
                        color: colors.text.muted,
                    }}
                >
                    {t.totalAnswered} questoes
                </Text>
            </View>
            <Text
                style={{
                    fontSize: 14,
                    fontFamily: fonts.sansBold,
                    color: isForte ? colors.green[500] : colors.red[500],
                    marginLeft: 12,
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
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
            {/* Header */}
            <View
                className="flex-row items-center gap-2 px-5 py-3"
                style={{ backgroundColor: colors.bg.deep }}
            >
                <BarChart3 size={18} color={colors.green[500]} />
                <Text
                    style={{
                        fontSize: 17,
                        fontFamily: fonts.sansBold,
                        color: colors.text.primary,
                    }}
                >
                    Progresso
                </Text>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary stats */}
                <FadeInSection delay={0}><View className="flex-row gap-3">
                    {[
                        {
                            icon: PenLine,
                            value: loading ? null : (progress?.totalAnswered ?? 0),
                            label: 'questões',
                            iconColor: colors.green[500],
                            bgColor: colors.green.glow,
                        },
                        {
                            icon: CheckCircle2,
                            value: loading ? null : (progress?.totalCorrect ?? 0),
                            label: 'acertos',
                            iconColor: colors.green[500],
                            bgColor: colors.green.glow,
                        },
                        {
                            icon: Target,
                            value: loading
                                ? null
                                : progress?.totalAnswered
                                  ? `${progress.accuracyPct}%`
                                  : '—',
                            label: 'de acerto',
                            iconColor: colors.green[500],
                            bgColor: colors.green.glow,
                        },
                    ].map(({ icon: Icon, value, label, iconColor, bgColor }) => (
                        <View
                            key={label}
                            className="flex-1 items-center rounded-2xl p-3.5"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderWidth: 1,
                                borderColor: colors.border.subtle,
                            }}
                        >
                            <View
                                className="h-7 w-7 items-center justify-center rounded-lg mb-1.5"
                                style={{ backgroundColor: bgColor }}
                            >
                                <Icon size={14} color={iconColor} />
                            </View>
                            {loading ? (
                                <View
                                    className="h-6 w-10 rounded"
                                    style={{ backgroundColor: colors.bg.elevated }}
                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: fonts.sansBold,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {value}
                                </Text>
                            )}
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                    marginTop: 2,
                                }}
                            >
                                {label}
                            </Text>
                        </View>
                    ))}
                </View></FadeInSection>

                {/* Areas */}
                <FadeInSection delay={80}><View>
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
                                fontSize: 14,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            Desempenho por area
                        </Text>
                    </View>
                    <View className="gap-3">
                        {(progress?.areas ?? DEFAULT_AREAS).map((area, i) => (
                            <StaggerItem key={area.value} index={i} baseDelay={160} stagger={80}>
                                <AreaCard
                                    area={area}
                                    loading={loading}
                                />
                            </StaggerItem>
                        ))}
                    </View>
                </View></FadeInSection>

                {/* Fortes */}
                {hasData && fortes.length > 0 && (
                    <FadeInSection delay={500}><View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <View
                                className="h-6 w-6 items-center justify-center rounded-md"
                                style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
                            >
                                <TrendingUp size={14} color={colors.green[500]} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: fonts.sansBold,
                                    color: colors.text.primary,
                                }}
                            >
                                Pontos fortes
                            </Text>
                        </View>
                        <View className="gap-2">
                            {fortes.map((t, i) => (
                                <StaggerItem key={t.value} index={i} baseDelay={560} stagger={60}>
                                    <TopicoChip t={t} variant="forte" />
                                </StaggerItem>
                            ))}
                        </View>
                    </View></FadeInSection>
                )}

                {/* Fracos */}
                {hasData && fracos.length > 0 && (
                    <FadeInSection delay={700}><View>
                        <View className="flex-row items-center gap-2 mb-3">
                            <View
                                className="h-6 w-6 items-center justify-center rounded-md"
                                style={{ backgroundColor: colors.red.glow }}
                            >
                                <TrendingDown size={14} color={colors.red[500]} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: fonts.sansBold,
                                    color: colors.text.primary,
                                }}
                            >
                                Pontos a melhorar
                            </Text>
                        </View>
                        <View className="gap-2">
                            {fracos.map((t, i) => (
                                <StaggerItem key={t.value} index={i} baseDelay={760} stagger={60}>
                                    <TopicoChip t={t} variant="fraco" />
                                </StaggerItem>
                            ))}
                        </View>
                    </View></FadeInSection>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <FadeInSection delay={200}><View
                        className="items-center rounded-3xl p-8"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
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
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                                marginTop: 16,
                            }}
                        >
                            Responda questoes para ver seu progresso!
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sans,
                                color: colors.text.muted,
                                marginTop: 4,
                                textAlign: 'center',
                                lineHeight: 20,
                            }}
                        >
                            Seus dados de desempenho por area aparecerao aqui.
                        </Text>
                        <Link href="/(tabs)/questions" asChild>
                            <Pressable
                                className="mt-5 flex-row items-center gap-2 rounded-xl px-5 py-2.5"
                                style={{ backgroundColor: colors.green[600] }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: fonts.sansBold,
                                        color: '#fff',
                                    }}
                                >
                                    Praticar questões
                                </Text>
                                <ArrowRight size={16} color="#fff" />
                            </Pressable>
                        </Link>
                    </View></FadeInSection>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
