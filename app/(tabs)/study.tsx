import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Flame } from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { useProgress, type AreaStat } from '@/hooks/use-progress';
import { colors } from '@/theme/tokens';

const FASE_MSG: Record<string, string> = {
    semente: 'Cada questao faz seu Broto crescer. Comece agora!',
    muda: 'Seu Broto esta brotando! Continue para chegar na proxima fase.',
    planta: 'Que planta linda! Voce esta progredindo muito bem.',
    flor: 'Incrivel — seu Broto esta florindo! Continue assim.',
    especial: 'Lendario! Voce alcancou o nivel especial.',
};

function FocusCard({ area }: { area: AreaStat }) {
    return (
        <Link href="/(tabs)/questions" asChild>
            <Pressable
                className="flex-row items-center gap-3 rounded-xl border px-4 py-3.5"
                style={{
                    borderColor: colors.border.default,
                    backgroundColor: colors.bg.card,
                }}
            >
                <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-foreground">
                        {area.label}
                    </Text>
                    <Text className="font-sans text-xs text-muted-foreground">
                        {area.totalAnswered > 0
                            ? `${area.accuracyPct}% acerto · ${area.totalAnswered} questoes`
                            : 'Nenhuma questao ainda'}
                    </Text>
                </View>
                <ArrowRight size={16} color={colors.text.muted} />
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
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView className="flex-1">
                {/* Hero */}
                <View
                    className="items-center px-4 pb-7 pt-5"
                    style={{ backgroundColor: colors.bg.deep }}
                >
                    <Text className="mb-5 self-start font-display-bold text-base text-foreground">
                        Seu Broto
                    </Text>

                    <View
                        className="mb-4 h-28 w-28 items-center justify-center rounded-3xl"
                        style={{
                            backgroundColor: colors.green.glow,
                            borderWidth: 1,
                            borderColor: colors.border.strong,
                        }}
                    >
                        <Text className="text-6xl">
                            {loadingPet ? '...' : FASE_EMOJI[fase]}
                        </Text>
                    </View>

                    <Text className="font-display-bold text-xl text-foreground">
                        {loadingPet
                            ? '...'
                            : `${FASE_LABEL[fase]} · Nivel ${nivel}`}
                    </Text>

                    {/* XP bar */}
                    <View className="mt-3 w-full max-w-[280px]">
                        <View
                            className="h-2.5 overflow-hidden rounded-full"
                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                        >
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: loadingPet
                                        ? '0%'
                                        : `${xpProgress}%`,
                                    backgroundColor: colors.green[500],
                                }}
                            />
                        </View>
                        <Text className="mt-1 text-center font-sans text-xs text-muted-foreground">
                            {loadingPet ? '...' : `${xpProgress}/100 XP`}
                        </Text>
                    </View>

                    {!loadingPet && (
                        <Text className="mt-3 text-center font-sans text-sm text-muted-foreground">
                            {FASE_MSG[fase]}
                        </Text>
                    )}
                </View>

                <View className="gap-5 px-4 py-5">
                    {/* Stats */}
                    <View className="flex-row gap-3">
                        <View
                            className="flex-1 items-center rounded-2xl border p-3"
                            style={{
                                borderColor: colors.border.default,
                                backgroundColor: colors.bg.card,
                            }}
                        >
                            <View className="flex-row items-center gap-1">
                                <Flame size={16} color={colors.gold[400]} />
                                <Text className="font-sans-bold text-lg text-foreground">
                                    {loadingPet ? '-' : streak}
                                </Text>
                            </View>
                            <Text className="font-sans text-[10px] text-muted-foreground">
                                streak
                            </Text>
                        </View>
                        <View
                            className="flex-1 items-center rounded-2xl border p-3"
                            style={{
                                borderColor: colors.border.default,
                                backgroundColor: colors.bg.card,
                            }}
                        >
                            <Text className="font-sans-bold text-lg text-foreground">
                                {loadingPet ? '-' : questoesHoje}
                            </Text>
                            <Text className="font-sans text-[10px] text-muted-foreground">
                                hoje
                            </Text>
                        </View>
                        <View
                            className="flex-1 items-center rounded-2xl border p-3"
                            style={{
                                borderColor: colors.border.default,
                                backgroundColor: colors.bg.card,
                            }}
                        >
                            <Text className="font-sans-bold text-lg text-foreground">
                                {loadingPet
                                    ? '-'
                                    : questoesHoje > 0
                                      ? `${Math.round((acertosHoje / questoesHoje) * 100)}%`
                                      : '—'}
                            </Text>
                            <Text className="font-sans text-[10px] text-muted-foreground">
                                acerto
                            </Text>
                        </View>
                    </View>

                    {/* CTA */}
                    <Link href="/(tabs)/questions" asChild>
                        <Pressable
                            className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                            style={{ backgroundColor: colors.green[600] }}
                        >
                            <Text className="font-sans-bold text-sm text-white">
                                Estudar para crescer {FASE_EMOJI[fase]}
                            </Text>
                            <ArrowRight size={18} color="#fff" />
                        </Pressable>
                    </Link>

                    {/* Focus */}
                    {(mostrarFoco || mostrarIniciar) && (
                        <View>
                            <Text className="mb-3 font-sans-bold text-sm text-foreground">
                                {mostrarFoco
                                    ? 'Onde focar agora'
                                    : 'Por onde comecar?'}
                            </Text>
                            <View className="gap-2">
                                {(mostrarFoco
                                    ? areasParaFocar
                                    : areasNaoIniciadas
                                ).map(a => (
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
