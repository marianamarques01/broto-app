import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    HelpCircle,
    BookOpen,
    ArrowRight,
    Flame,
    Target,
    PenLine,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { HeaderAuth } from '@/components/HeaderAuth';
import { colors } from '@/theme/tokens';

export default function HomeScreen() {
    const { pet, loading } = usePet();

    const xp = pet?.xp ?? 0;
    const nivel = pet?.nivel ?? 1;
    const fase = pet?.fase ?? 'semente';
    const streak = pet?.streak ?? 0;
    const questoesHoje = pet?.questoesHoje ?? 0;
    const acertosHoje = pet?.acertosHoje ?? 0;
    const accuracyPct =
        questoesHoje > 0
            ? Math.round((acertosHoje / questoesHoje) * 100)
            : null;

    const stats = [
        {
            icon: Flame,
            value: streak,
            label: 'dias seguidos',
            iconColor: colors.gold[400],
        },
        {
            icon: PenLine,
            value: questoesHoje,
            label: 'questoes hoje',
            iconColor: colors.green[500],
        },
        {
            icon: Target,
            value: accuracyPct !== null ? `${accuracyPct}%` : '—',
            label: 'de acerto',
            iconColor: colors.green[500],
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View
                className="flex-row items-center justify-between border-b px-4 pb-3 pt-2"
                style={{
                    borderBottomColor: colors.border.default,
                    backgroundColor: colors.bg.deep,
                }}
            >
                <View className="flex-row items-center gap-2.5">
                    <Text className="text-xl">🌿</Text>
                    <Text className="text-xl font-black text-primary">
                        broto
                    </Text>
                </View>
                <View className="flex-row items-center gap-2.5">
                    {streak > 0 && (
                        <View
                            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                            style={{
                                backgroundColor: colors.gold.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(251,191,36,0.2)',
                            }}
                        >
                            <Text style={{ color: colors.gold[400] }} className="text-xs font-bold">
                                🔥 {streak}
                            </Text>
                        </View>
                    )}
                    <HeaderAuth />
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-5" contentContainerStyle={{ gap: 20 }}>
                {/* Greeting */}
                <View>
                    <Text className="text-sm text-muted-foreground">
                        Bem-vindo de volta
                    </Text>
                    <Text className="text-2xl font-black text-foreground">
                        Bora estudar? {FASE_EMOJI[fase]}
                    </Text>
                </View>

                {/* Broto card */}
                <View
                    className="overflow-hidden rounded-2xl border p-5"
                    style={{
                        borderColor: colors.border.default,
                        backgroundColor: colors.green[900],
                    }}
                >
                    <View className="flex-row items-center gap-4">
                        <View>
                            <View
                                className="h-20 w-20 items-center justify-center rounded-2xl"
                                style={{
                                    backgroundColor: colors.green.glow,
                                    borderWidth: 1,
                                    borderColor: colors.border.strong,
                                }}
                            >
                                <Text className="text-5xl">
                                    {FASE_EMOJI[fase]}
                                </Text>
                            </View>
                            <View
                                className="absolute -bottom-1.5 self-center rounded-full px-2 py-0.5"
                                style={{
                                    backgroundColor: colors.gold.glow,
                                    borderWidth: 1,
                                    borderColor: 'rgba(251,191,36,0.2)',
                                }}
                            >
                                <Text
                                    className="text-[10px] font-bold"
                                    style={{ color: colors.gold[300] }}
                                >
                                    Nv. {nivel}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Seu Broto
                            </Text>
                            {loading ? (
                                <View className="mt-1 h-5 w-32 rounded bg-muted" />
                            ) : (
                                <Text className="text-lg font-bold text-foreground">
                                    {FASE_LABEL[fase]}
                                </Text>
                            )}
                            <View
                                className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full"
                                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                            >
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: loading
                                            ? '0%'
                                            : `${Math.min((xp % 100) / 100, 1) * 100}%`,
                                        backgroundColor: colors.green[500],
                                    }}
                                />
                            </View>
                            <Text className="mt-1 text-[11px] text-muted-foreground">
                                {loading ? '...' : `${xp % 100} / 100 XP`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View className="flex-row gap-3">
                    {stats.map(({ icon: Icon, value, label, iconColor }) => (
                        <View
                            key={label}
                            className="flex-1 items-center rounded-2xl border p-3.5"
                            style={{
                                borderColor: colors.border.default,
                                backgroundColor: colors.bg.card,
                            }}
                        >
                            <Icon size={20} color={iconColor} />
                            <Text className="mt-1.5 text-xl font-bold text-foreground">
                                {loading ? '-' : value}
                            </Text>
                            <Text className="mt-0.5 text-[10px] text-muted-foreground">
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Quick access */}
                <View>
                    <Text className="mb-3 text-sm font-bold text-foreground">
                        Continuar estudando
                    </Text>
                    <View className="flex-row gap-3">
                        <Link href="/(tabs)/questions" asChild>
                            <Pressable
                                className="flex-1 flex-row items-center gap-3 rounded-2xl border p-4"
                                style={{
                                    borderColor: colors.border.default,
                                    backgroundColor: colors.bg.card,
                                }}
                            >
                                <View
                                    className="h-11 w-11 items-center justify-center rounded-xl"
                                    style={{
                                        backgroundColor: colors.green.glow,
                                    }}
                                >
                                    <HelpCircle
                                        size={20}
                                        color={colors.green[500]}
                                    />
                                </View>
                                <View>
                                    <Text className="text-sm font-semibold text-foreground">
                                        Questoes
                                    </Text>
                                    <Text className="text-[11px] text-muted-foreground">
                                        Banco ENEM
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>
                        <Link href="/(tabs)/study" asChild>
                            <Pressable
                                className="flex-1 flex-row items-center gap-3 rounded-2xl border p-4"
                                style={{
                                    borderColor: colors.border.default,
                                    backgroundColor: colors.bg.card,
                                }}
                            >
                                <View
                                    className="h-11 w-11 items-center justify-center rounded-xl"
                                    style={{
                                        backgroundColor: colors.green.glow,
                                    }}
                                >
                                    <BookOpen
                                        size={20}
                                        color={colors.green[500]}
                                    />
                                </View>
                                <View>
                                    <Text className="text-sm font-semibold text-foreground">
                                        Estudar
                                    </Text>
                                    <Text className="text-[11px] text-muted-foreground">
                                        Seu Broto
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>
                    </View>
                </View>

                {/* Tip */}
                <View
                    className="rounded-2xl border p-4"
                    style={{
                        borderColor: colors.border.default,
                        backgroundColor: colors.green.glow,
                    }}
                >
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Dica do dia
                    </Text>
                    <Text className="mt-1.5 text-sm leading-relaxed text-foreground">
                        Pratique pelo menos 5 questoes por dia para manter seu
                        Broto saudavel e avancar no nivel!
                    </Text>
                    <Link href="/(tabs)/questions" asChild>
                        <Pressable className="mt-3 flex-row items-center gap-1">
                            <Text className="text-xs font-semibold text-primary">
                                Praticar agora
                            </Text>
                            <ArrowRight size={14} color={colors.green[500]} />
                        </Pressable>
                    </Link>
                </View>

                {/* CTA */}
                <Link href="/(tabs)/questions" asChild>
                    <Pressable
                        className="w-full items-center rounded-2xl py-4"
                        style={{ backgroundColor: colors.green[600] }}
                    >
                        <Text className="text-sm font-bold text-white">
                            🌱 Praticar agora
                        </Text>
                    </Pressable>
                </Link>
            </ScrollView>
        </SafeAreaView>
    );
}
