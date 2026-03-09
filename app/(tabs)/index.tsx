import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    HelpCircle,
    BookOpen,
    ArrowRight,
    Flame,
    Target,
    PenLine,
    Sparkles,
    Lightbulb,
} from 'lucide-react-native';
import { usePet, FASE_EMOJI, FASE_LABEL } from '@/hooks/use-pet';
import { HeaderAuth } from '@/components/HeaderAuth';
import { BrotoLogo } from '@/components/BrotoLogo';
import { colors, fonts } from '@/theme/tokens';

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
            bgColor: colors.gold.glow,
        },
        {
            icon: PenLine,
            value: questoesHoje,
            label: 'questoes hoje',
            iconColor: colors.green[500],
            bgColor: colors.green.glow,
        },
        {
            icon: Target,
            value: accuracyPct !== null ? `${accuracyPct}%` : '—',
            label: 'de acerto',
            iconColor: colors.green[500],
            bgColor: colors.green.glow,
        },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
            {/* Header */}
            <View
                className="flex-row items-center justify-between px-5 pb-3 pt-2"
                style={{ backgroundColor: colors.bg.deep }}
            >
                <View className="flex-row items-center gap-2.5">
                    <Sparkles size={18} color={colors.green[500]} />
                    <BrotoLogo size="header" />
                </View>
                <View className="flex-row items-center gap-2.5">
                    {streak > 0 && (
                        <View
                            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
                            style={{
                                backgroundColor: colors.gold.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(251,191,36,0.15)',
                            }}
                        >
                            <Flame size={12} color={colors.gold[400]} />
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sansBold,
                                    color: colors.gold[400],
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
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View>
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: fonts.sans,
                            color: colors.text.muted,
                        }}
                    >
                        Bem-vindo de volta
                    </Text>
                    <Text
                        style={{
                            fontSize: 24,
                            fontFamily: fonts.sansBold,
                            color: colors.text.primary,
                            marginTop: 2,
                        }}
                    >
                        Bora estudar? {FASE_EMOJI[fase]}
                    </Text>
                </View>

                {/* Broto card */}
                <View
                    className="overflow-hidden rounded-3xl"
                    style={{
                        borderWidth: 1,
                        borderColor: colors.border.default,
                    }}
                >
                    <LinearGradient
                        colors={[colors.green[900], colors.bg.card]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 20 }}
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
                                    <Text style={{ fontSize: 48 }}>
                                        {FASE_EMOJI[fase]}
                                    </Text>
                                </View>
                                <View
                                    className="absolute -bottom-1.5 self-center rounded-full px-2 py-0.5"
                                    style={{
                                        backgroundColor: colors.gold.glow,
                                        borderWidth: 1,
                                        borderColor: 'rgba(251,191,36,0.15)',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontFamily: fonts.sansBold,
                                            color: colors.gold[300],
                                        }}
                                    >
                                        Nv. {nivel}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: fonts.sansSemiBold,
                                        color: colors.text.muted,
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.5,
                                    }}
                                >
                                    Seu Broto
                                </Text>
                                {loading ? (
                                    <View
                                        className="mt-1 h-5 w-32 rounded"
                                        style={{ backgroundColor: colors.bg.elevated }}
                                    />
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: fonts.sansBold,
                                            color: colors.text.primary,
                                            marginTop: 2,
                                        }}
                                    >
                                        {FASE_LABEL[fase]}
                                    </Text>
                                )}
                                <View
                                    className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
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
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: fonts.sans,
                                        color: colors.text.muted,
                                        marginTop: 4,
                                    }}
                                >
                                    {loading ? '...' : `${xp % 100} / 100 XP`}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats */}
                <View className="flex-row gap-3">
                    {stats.map(({ icon: Icon, value, label, iconColor, bgColor }) => (
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
                                className="h-8 w-8 items-center justify-center rounded-lg mb-1.5"
                                style={{ backgroundColor: bgColor }}
                            >
                                <Icon size={16} color={iconColor} />
                            </View>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: fonts.sansBold,
                                    color: colors.text.primary,
                                }}
                            >
                                {loading ? '-' : value}
                            </Text>
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
                </View>

                {/* Quick access */}
                <View>
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
                            Continuar estudando
                        </Text>
                    </View>
                    <View className="flex-row gap-3">
                        <Link href="/(tabs)/questions" asChild>
                            <Pressable
                                className="flex-1 flex-row items-center gap-3 rounded-2xl p-4"
                                style={{
                                    backgroundColor: colors.bg.card,
                                    borderWidth: 1,
                                    borderColor: colors.border.subtle,
                                }}
                            >
                                <View
                                    className="h-11 w-11 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: colors.green.glow }}
                                >
                                    <HelpCircle size={20} color={colors.green[500]} />
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: fonts.sansSemiBold,
                                            color: colors.text.primary,
                                        }}
                                    >
                                        Questoes
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: fonts.sans,
                                            color: colors.text.muted,
                                        }}
                                    >
                                        Banco ENEM
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>
                        <Link href="/(tabs)/study" asChild>
                            <Pressable
                                className="flex-1 flex-row items-center gap-3 rounded-2xl p-4"
                                style={{
                                    backgroundColor: colors.bg.card,
                                    borderWidth: 1,
                                    borderColor: colors.border.subtle,
                                }}
                            >
                                <View
                                    className="h-11 w-11 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: colors.green.glow }}
                                >
                                    <BookOpen size={20} color={colors.green[500]} />
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: fonts.sansSemiBold,
                                            color: colors.text.primary,
                                        }}
                                    >
                                        Estudar
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: fonts.sans,
                                            color: colors.text.muted,
                                        }}
                                    >
                                        Seu Broto
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>
                    </View>
                </View>

                {/* Tip */}
                <View
                    className="rounded-2xl overflow-hidden"
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
                            <Lightbulb size={14} color={colors.green[500]} />
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: fonts.sansBold,
                                    color: colors.green[500],
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                Dica do dia
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
                            Pratique pelo menos 5 questoes por dia para manter seu
                            Broto saudavel e avancar no nivel!
                        </Text>
                        <Link href="/(tabs)/questions" asChild>
                            <Pressable className="mt-3 flex-row items-center gap-1.5">
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: fonts.sansSemiBold,
                                        color: colors.green[400],
                                    }}
                                >
                                    Praticar agora
                                </Text>
                                <ArrowRight size={14} color={colors.green[400]} />
                            </Pressable>
                        </Link>
                    </LinearGradient>
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
                            Praticar agora
                        </Text>
                    </Pressable>
                </Link>
            </ScrollView>
        </SafeAreaView>
    );
}
