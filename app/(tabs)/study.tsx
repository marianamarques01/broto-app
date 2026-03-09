import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRight,
    Flame,
    Sprout,
    Sparkles,
    Target,
    PenLine,
    ChevronRight,
    FileText,
    Globe,
    FlaskConical,
    Calculator,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { colors, fonts } from '@/theme/tokens';

const FASE_MSG: Record<string, string> = {
    semente: 'Cada questao faz seu Broto crescer. Comece agora!',
    muda: 'Seu Broto esta brotando! Continue para chegar na proxima fase.',
    planta: 'Que planta linda! Voce esta progredindo muito bem.',
    flor: 'Incrivel — seu Broto esta florindo! Continue assim.',
    especial: 'Lendario! Voce alcancou o nivel especial.',
};

const AREA_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    linguagens: FileText,
    'ciencias-humanas': Globe,
    'ciencias-natureza': FlaskConical,
    matematica: Calculator,
};

const AREA_COLORS: Record<string, { solid: string; bg: string; text: string }> = {
    linguagens: { solid: '#3b82f6', bg: 'rgba(59,130,246,0.10)', text: '#60a5fa' },
    'ciencias-humanas': { solid: '#f59e0b', bg: 'rgba(245,158,11,0.10)', text: '#fbbf24' },
    'ciencias-natureza': { solid: '#22c55e', bg: 'rgba(34,197,94,0.10)', text: '#34d399' },
    matematica: { solid: '#a855f7', bg: 'rgba(168,85,247,0.10)', text: '#c084fc' },
};

function FocusCard({ area }: { area: AreaStat }) {
    const Icon = AREA_ICONS[area.value] ?? Sprout;
    const areaColor = AREA_COLORS[area.value] ?? { solid: colors.green[500], bg: colors.green.glow, text: colors.green[400] };

    return (
        <Link href="/(tabs)/questions" asChild>
            <Pressable
                className="flex-row items-center gap-3 rounded-xl px-4 py-3.5"
                style={{
                    backgroundColor: areaColor.bg,
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
    const { pet, loading: loadingPet } = usePet();
    const { progress, loading: loadingProgress } = useProgress();

    const fase = pet?.fase ?? 'semente';
    const nivel = pet?.nivel ?? 1;
    const xp = pet?.xp ?? 0;
    const xpProgress = xp % 100;
    const streak = pet?.streak ?? 0;
    const questoesHoje = pet?.questoesHoje ?? 0;
    const acertosHoje = pet?.acertosHoje ?? 0;

    const areasParaFocar = (progress?.areas ?? [])
        .filter(a => a.totalAnswered > 0)
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 2);

    const areasNaoIniciadas = (progress?.areas ?? [])
        .filter(a => a.totalAnswered === 0)
        .slice(0, 2);

    const mostrarFoco = !loadingProgress && areasParaFocar.length > 0;
    const mostrarIniciar =
        !loadingProgress &&
        areasParaFocar.length === 0 &&
        areasNaoIniciadas.length > 0;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <LinearGradient
                    colors={[colors.green[900], colors.bg.deep, colors.bg.void]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
                >
                    {/* Header row */}
                    <View className="flex-row items-center gap-2 mb-6">
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
                    </View>

                    {/* Broto avatar */}
                    <View className="items-center">
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
                            <View
                                className="h-2.5 overflow-hidden rounded-full"
                                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                            >
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: loadingPet ? '0%' : `${xpProgress}%`,
                                        backgroundColor: colors.green[500],
                                    }}
                                />
                            </View>
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
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, gap: 20, paddingBottom: 32 }}>
                    {/* Stats */}
                    <View className="flex-row gap-3">
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
                                className="flex-1 items-center rounded-2xl p-3"
                                style={{
                                    backgroundColor: colors.bg.card,
                                    borderWidth: 1,
                                    borderColor: colors.border.subtle,
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
                                        fontSize: 18,
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
                                        marginTop: 1,
                                    }}
                                >
                                    {label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <Link href="/(tabs)/questions" asChild>
                        <Pressable
                            className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-4"
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
                                Estudar para crescer
                            </Text>
                            <ArrowRight size={18} color="#fff" />
                        </Pressable>
                    </Link>

                    {/* Focus areas */}
                    {(mostrarFoco || mostrarIniciar) && (
                        <View>
                            <View className="flex-row items-center gap-2 mb-3">
                                <View
                                    style={{
                                        width: 3,
                                        height: 14,
                                        borderRadius: 1.5,
                                        backgroundColor: mostrarFoco ? colors.green[500] : colors.text.muted,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: fonts.sansBold,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {mostrarFoco ? 'Onde focar agora' : 'Por onde comecar?'}
                                </Text>
                            </View>
                            <View className="gap-2">
                                {(mostrarFoco ? areasParaFocar : areasNaoIniciadas).map(a => (
                                    <FocusCard key={a.value} area={a} />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
