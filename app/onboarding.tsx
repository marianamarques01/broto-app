import { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { api, ApiError } from '@/lib/api-client';
import { refreshUser } from '@/hooks/use-user';
import { colors } from '@/theme/tokens';

export default function OnboardingScreen() {
    const router = useRouter();
    const [dataEnem, setDataEnem] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [horas, setHoras] = useState(2);
    const [loading, setLoading] = useState(false);
    const [skipLoading, setSkipLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function saveProfile(body: Record<string, unknown>) {
        await api.patch('/api/user/profile', body);
        refreshUser();
        router.replace('/(tabs)');
    }

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await saveProfile({
                dataEnem: dataEnem
                    ? dataEnem.toISOString().split('T')[0]
                    : undefined,
                horasDisponiveisPorDia: horas,
            });
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setError('Sessao expirada. Faca login novamente.');
                return;
            }
            const msg =
                err instanceof ApiError
                    ? err.message
                    : 'Erro ao salvar. Verifique sua conexao e tente novamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleSkip() {
        setError(null);
        setSkipLoading(true);
        try {
            await saveProfile({ horasDisponiveisPorDia: 2 });
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setError('Sessao expirada. Faca login novamente.');
                return;
            }
            const msg =
                err instanceof ApiError
                    ? err.message
                    : 'Erro ao pular. Tente novamente.';
            setError(msg);
        } finally {
            setSkipLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Hero */}
                <View
                    className="flex-1 items-center justify-center px-6"
                    style={{ backgroundColor: colors.bg.deep }}
                >
                    <View
                        className="h-28 w-28 items-center justify-center rounded-3xl"
                        style={{
                            backgroundColor: colors.green.glow,
                            borderWidth: 1,
                            borderColor: colors.border.strong,
                        }}
                    >
                        <Text className="text-6xl">🌱</Text>
                    </View>
                    <Text className="mt-6 font-display text-2xl font-black text-foreground">
                        Seu Broto nasceu!
                    </Text>
                    <Text className="mt-1.5 text-center font-sans text-sm text-muted-foreground">
                        Configure sua meta de estudos para comecar.
                    </Text>
                </View>

                {/* Form */}
                <View
                    className="rounded-t-3xl border-t px-6 pb-10 pt-8"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderTopColor: colors.border.default,
                    }}
                >
                    {/* Data ENEM */}
                    <View className="mb-5">
                        <Text className="mb-1.5 font-sans-medium text-sm text-foreground">
                            Quando voce vai fazer o ENEM?
                        </Text>
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            className="w-full rounded-xl border px-4 py-3"
                            style={{ backgroundColor: colors.bg.deep, borderColor: colors.border.default }}
                        >
                            <Text className="font-sans text-sm text-foreground">
                                {dataEnem
                                    ? dataEnem.toLocaleDateString('pt-BR')
                                    : 'Selecionar data'}
                            </Text>
                        </Pressable>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dataEnem ?? new Date()}
                                mode="date"
                                display={
                                    Platform.OS === 'ios'
                                        ? 'spinner'
                                        : 'default'
                                }
                                minimumDate={new Date()}
                                themeVariant="dark"
                                onChange={(_, date) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (date) setDataEnem(date);
                                }}
                            />
                        )}
                        <Text className="mt-1 font-sans text-xs text-muted-foreground">
                            Opcional — ajuda a gerar sua rotina
                        </Text>
                    </View>

                    {/* Horas */}
                    <View className="mb-5">
                        <Text className="mb-1.5 font-sans-medium text-sm text-foreground">
                            Horas de estudo por dia
                        </Text>
                        <View className="flex-row items-center gap-4">
                            <Slider
                                style={{ flex: 1, height: 40 }}
                                minimumValue={1}
                                maximumValue={8}
                                step={1}
                                value={horas}
                                onValueChange={setHoras}
                                minimumTrackTintColor={colors.green[500]}
                                maximumTrackTintColor={colors.bg.surface}
                                thumbTintColor={colors.green[500]}
                            />
                            <View
                                className="w-16 items-center rounded-xl border py-2"
                                style={{ backgroundColor: colors.bg.deep, borderColor: colors.border.default }}
                            >
                                <Text className="font-sans-bold text-sm text-foreground">
                                    {horas}h/dia
                                </Text>
                            </View>
                        </View>
                    </View>

                    {error && (
                        <View
                            className="mb-4 rounded-xl px-4 py-2.5"
                            style={{
                                backgroundColor: colors.red.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(239,68,68,0.2)',
                            }}
                        >
                            <Text className="font-sans text-sm text-danger">{error}</Text>
                        </View>
                    )}

                    <Pressable
                        onPress={handleSubmit}
                        disabled={loading || skipLoading}
                        className="w-full items-center rounded-xl py-3.5"
                        style={{
                            backgroundColor: colors.semantic.primary,
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="font-sans-bold text-sm text-white">
                                Comecar a estudar 🌱
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={handleSkip}
                        disabled={loading || skipLoading}
                        className="mt-4 w-full items-center"
                    >
                        <Text
                            className="font-sans text-sm text-muted-foreground"
                            style={{ opacity: skipLoading ? 0.5 : 1 }}
                        >
                            {skipLoading ? 'Salvando...' : 'Pular por agora'}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
