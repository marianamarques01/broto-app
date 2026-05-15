import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Switch,
    StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { ArrowRight, ChevronLeft, History, ClipboardList } from 'lucide-react-native'
import {
    IDIOMAS_TOPIC_ID,
    LANGUAGE_OPTIONS,
    LINGUAGENS_AREA_VALUE,
    useQuestionsFilters,
} from '@/hooks/useQuestionsFilters'
import { formatMockExamFlowError } from '@/lib/mock-exam-flow-error'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import {
    buildMockExamPayload,
    fetchMockExamQuestions,
    isValidMockExamN,
    loadMockExamPool,
    MOCK_EXAM_N_MAX,
    MOCK_EXAM_N_MIN,
    MOCK_EXAM_TIME_LIMIT_MINUTES_MAX,
    MOCK_EXAM_TIME_LIMIT_MINUTES_MIN,
    MOCK_EXAM_YEAR_MAX,
    MOCK_EXAM_YEAR_MIN,
    clampMockExamTimeLimitMinutes,
    type StudentMockExamConfig,
} from '@broto/shared'
import { colors, fonts } from '@/theme/tokens'
import { BrotoCtaButton } from '@/components/BrotoCtaButton'
import FireflyBackground from '@/components/FireflyBackground'

const ALL_YEARS_VALUE = ''

function clampMockExamN(n: number): number {
    return Math.min(
        MOCK_EXAM_N_MAX,
        Math.max(MOCK_EXAM_N_MIN, Math.floor(Number.isFinite(n) ? n : MOCK_EXAM_N_MIN)),
    )
}

export default function MockExamConfigScreen() {
    const router = useRouter()
    const { organization } = useClass()
    const baseUrl = getQuestionsStaticBaseUrl(organization?.slug ?? null)

    const {
        areas,
        exams,
        topicos,
        loading,
        error,
        selectedArea,
        selectedLanguage,
        setSelectedArea,
        setSelectedLanguage,
        isLanguageFilterEnabled,
    } = useQuestionsFilters({ skipQuestionFetch: true })

    const [randomMode, setRandomMode] = useState(false)
    const [selectedAreas, setSelectedAreas] = useState<string[]>([])
    const [nQuestoes, setNQuestoes] = useState(20)
    const [yearSelect, setYearSelect] = useState<string>(ALL_YEARS_VALUE)
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const suggestedTimeLimit = useMemo(
        () =>
            clampMockExamTimeLimitMinutes(Math.max(30, Math.round(clampMockExamN(nQuestoes) * 1.5))),
        [nQuestoes],
    )
    const [timeLimitEnabled, setTimeLimitEnabled] = useState(false)
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(() =>
        clampMockExamTimeLimitMinutes(Math.max(30, Math.round(20 * 1.5))),
    )

    const toggleArea = (value: string) => {
        setSelectedAreas((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
    }

    const toggleTopico = (id: string) => {
        setSelectedTopicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const singleAreaForTopics = !randomMode && selectedAreas.length === 1 ? selectedAreas[0] : null

    useEffect(() => {
        if (singleAreaForTopics && singleAreaForTopics !== selectedArea) {
            setSelectedArea(singleAreaForTopics)
        }
    }, [singleAreaForTopics, selectedArea, setSelectedArea])

    useEffect(() => {
        if (selectedAreas.length !== 1) {
            setSelectedTopicIds([])
        }
    }, [selectedAreas])

    const topicoValues = useMemo(() => {
        if (!singleAreaForTopics || selectedTopicIds.length === 0) return []
        return topicos.filter((t) => selectedTopicIds.includes(t.id)).map((t) => t.value)
    }, [topicos, singleAreaForTopics, selectedTopicIds])

    const expandLinguagensIdiomas = useMemo(() => {
        if (!singleAreaForTopics || singleAreaForTopics !== LINGUAGENS_AREA_VALUE) return false
        if (!selectedTopicIds.includes(IDIOMAS_TOPIC_ID)) return false
        return !selectedLanguage
    }, [singleAreaForTopics, selectedTopicIds, selectedLanguage])

    const yearOptions = useMemo(() => {
        if (exams.length > 0) {
            return [...new Set(exams.map((e) => e.year))].sort((a, b) => a - b)
        }
        const ys: number[] = []
        for (let y = MOCK_EXAM_YEAR_MIN; y <= MOCK_EXAM_YEAR_MAX; y++) ys.push(y)
        return ys
    }, [exams])

    const selectedYears = useMemo(
        () => (yearSelect === ALL_YEARS_VALUE ? [] : [Number(yearSelect)]),
        [yearSelect],
    )

    const buildConfig = useCallback((): StudentMockExamConfig | null => {
        const nQCfg = clampMockExamN(nQuestoes)
        if (!isValidMockExamN(nQCfg)) {
            setSubmitError(`Escolha entre ${MOCK_EXAM_N_MIN} e ${MOCK_EXAM_N_MAX} questoes.`)
            return null
        }
        if (!randomMode && selectedAreas.length === 0) {
            setSubmitError('Selecione ao menos uma area ou ative o modo aleatorio.')
            return null
        }
        return {
            nQuestoes: nQCfg,
            randomMode,
            areaValues: randomMode ? [] : [...selectedAreas],
            topicoValues: randomMode || !singleAreaForTopics ? [] : topicoValues,
            years: selectedYears,
            language: selectedLanguage,
            expandLinguagensIdiomas: randomMode ? false : expandLinguagensIdiomas,
            ...(timeLimitEnabled
                ? { timeLimitMinutes: clampMockExamTimeLimitMinutes(timeLimitMinutes) }
                : {}),
        }
    }, [
        nQuestoes,
        randomMode,
        selectedAreas,
        singleAreaForTopics,
        topicoValues,
        selectedYears,
        selectedLanguage,
        expandLinguagensIdiomas,
        timeLimitEnabled,
        timeLimitMinutes,
    ])

    const handleStart = async () => {
        setSubmitError(null)
        const cfg = buildConfig()
        if (!cfg || !baseUrl) {
            if (!baseUrl) setSubmitError('Configure EXPO_PUBLIC_SUPABASE_URL ou QUESTIONS_BASE_URL.')
            return
        }

        setSubmitting(true)
        try {
            const pool = await loadMockExamPool({
                baseUrl,
                randomMode: cfg.randomMode,
                areaValues: cfg.areaValues,
                topicoValues: cfg.topicoValues,
                years: cfg.years,
                language: cfg.language,
                expandLinguagensIdiomas: cfg.expandLinguagensIdiomas,
            })

            const built = buildMockExamPayload(cfg.nQuestoes, cfg.randomMode, cfg.areaValues, pool)

            if (!built.ok) {
                if (built.error.code === 'POOL_EMPTY') {
                    setSubmitError(
                        'Nenhuma questao encontrada com esses filtros. Afrouxe ano, topico ou area.',
                    )
                } else {
                    setSubmitError(
                        `Nao ha questoes suficientes: pedidas ${built.error.requested}, disponiveis ${built.error.poolSize}.`,
                    )
                }
                return
            }

            const questions = await fetchMockExamQuestions(baseUrl, built.questionIds)
            if (questions.length === 0) {
                setSubmitError('Nao foi possivel carregar o conteudo das questoes.')
                return
            }
            if (questions.length < built.questionIds.length) {
                setSubmitError('Algumas questoes nao puderam ser carregadas. Tente de novo.')
                return
            }

            type CreateRes = { sessionId?: string }
            const created = await api.post<CreateRes>('/api/practice-session/create', {
                config: cfg,
                questionIds: built.questionIds,
            })

            if (!created.sessionId) {
                setSubmitError('Erro ao criar sessao no servidor.')
                return
            }

            router.replace(`/mock-exam/play/${created.sessionId}`)
        } catch (e) {
            setSubmitError(formatMockExamFlowError(e))
        } finally {
            setSubmitting(false)
        }
    }

    const nQ = clampMockExamN(nQuestoes)
    const tLim = clampMockExamTimeLimitMinutes(timeLimitMinutes)

    if (loading) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <FireflyBackground count={6} runKey={1} opacity={0.85} />
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.green[400]} size="large" />
                    <Text style={styles.muted}>Carregando...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FireflyBackground count={6} runKey={2} opacity={0.85} />
            <View style={styles.header}>
                <Link href="/(tabs)/study" asChild>
                    <Pressable style={styles.headerBtn}>
                        <ChevronLeft size={22} color={colors.text.secondary} />
                    </Pressable>
                </Link>
                <Text style={styles.headerTitle}>Sessão ENEM</Text>
                <Link href="/mock-exam/history" asChild>
                    <Pressable style={styles.headerBtn}>
                        <History size={22} color={colors.green[400]} />
                    </Pressable>
                </Link>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {error ? (
                    <Text style={styles.err}>{error}</Text>
                ) : null}
                {submitError ? <Text style={styles.err}>{submitError}</Text> : null}

                <Text style={[styles.subHint, { marginBottom: -4 }]}>
                    Bloco personalizado no estilo de um simulado — voce escolhe quantas questoes e se usa cronometro;
                    nao e a prova completa de 90 itens.
                </Text>

                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <View style={styles.rowIcon}>
                            <ClipboardList size={20} color={colors.gold[400]} />
                            <Text style={styles.cardTitle}>Modo aleatorio (todas as areas)</Text>
                        </View>
                        <Switch
                            value={randomMode}
                            onValueChange={setRandomMode}
                            trackColor={{ false: colors.bg.elevated, true: colors.green[700] }}
                            thumbColor={randomMode ? colors.green[400] : colors.text.muted}
                        />
                    </View>
                </View>

                {!randomMode && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Areas</Text>
                        <View style={styles.chips}>
                            {areas.map((a) => {
                                const on = selectedAreas.includes(a.value)
                                return (
                                    <Pressable
                                        key={a.value}
                                        onPress={() => toggleArea(a.value)}
                                        style={[styles.chip, on && styles.chipOn]}
                                    >
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{a.label}</Text>
                                    </Pressable>
                                )
                            })}
                        </View>

                        {singleAreaForTopics && topicos.length > 0 && (
                            <>
                                <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Topicos (opcional)</Text>
                                <View style={styles.chips}>
                                    {topicos.map((t) => {
                                        const on = selectedTopicIds.includes(t.id)
                                        return (
                                            <Pressable
                                                key={t.id}
                                                onPress={() => toggleTopico(t.id)}
                                                style={[styles.chip, on && styles.chipOn]}
                                            >
                                                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                                                    {t.label}
                                                </Text>
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            </>
                        )}

                        {isLanguageFilterEnabled && selectLanguageBlock(selectedLanguage, setSelectedLanguage)}
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Numero de questoes: {nQ}</Text>
                    <View style={styles.stepper}>
                        <Pressable
                            style={styles.stepBtn}
                            onPress={() => setNQuestoes((n) => clampMockExamN(n - 1))}
                            disabled={nQ <= MOCK_EXAM_N_MIN}
                        >
                            <Text style={styles.stepBtnText}>-</Text>
                        </Pressable>
                        <Text style={styles.stepVal}>{nQ}</Text>
                        <Pressable
                            style={styles.stepBtn}
                            onPress={() => setNQuestoes((n) => clampMockExamN(n + 1))}
                            disabled={nQ >= MOCK_EXAM_N_MAX}
                        >
                            <Text style={styles.stepBtnText}>+</Text>
                        </Pressable>
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Ano</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
                        <Pressable
                            style={[styles.yearChip, yearSelect === ALL_YEARS_VALUE && styles.chipOn]}
                            onPress={() => setYearSelect(ALL_YEARS_VALUE)}
                        >
                            <Text
                                style={[
                                    styles.yearChipText,
                                    yearSelect === ALL_YEARS_VALUE && styles.chipTextOn,
                                ]}
                            >
                                Todos
                            </Text>
                        </Pressable>
                        {yearOptions.map((y) => (
                            <Pressable
                                key={y}
                                style={[styles.yearChip, yearSelect === String(y) && styles.chipOn]}
                                onPress={() => setYearSelect(String(y))}
                            >
                                <Text
                                    style={[
                                        styles.yearChipText,
                                        yearSelect === String(y) && styles.chipTextOn,
                                    ]}
                                >
                                    {y}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={styles.cardTitle}>Limite de tempo</Text>
                            <Text style={[styles.subHint, { marginTop: 6 }]}>
                                Ao zerar o cronometro, a sessao encerra com o que voce ja respondeu.
                            </Text>
                        </View>
                        <Switch
                            value={timeLimitEnabled}
                            onValueChange={(on) => {
                                setTimeLimitEnabled(on)
                                if (on) setTimeLimitMinutes(suggestedTimeLimit)
                            }}
                            trackColor={{ false: colors.bg.elevated, true: colors.green[700] }}
                            thumbColor={timeLimitEnabled ? colors.green[400] : colors.text.muted}
                        />
                    </View>
                    {timeLimitEnabled ? (
                        <>
                            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                                Minutos totais: {tLim}
                            </Text>
                            <View style={styles.stepper}>
                                <Pressable
                                    style={styles.stepBtn}
                                    onPress={() =>
                                        setTimeLimitMinutes((m) =>
                                            clampMockExamTimeLimitMinutes(m - 5),
                                        )
                                    }
                                    disabled={tLim <= MOCK_EXAM_TIME_LIMIT_MINUTES_MIN}
                                >
                                    <Text style={styles.stepBtnText}>-</Text>
                                </Pressable>
                                <Text style={styles.stepVal}>{tLim}</Text>
                                <Pressable
                                    style={styles.stepBtn}
                                    onPress={() =>
                                        setTimeLimitMinutes((m) =>
                                            clampMockExamTimeLimitMinutes(m + 5),
                                        )
                                    }
                                    disabled={tLim >= MOCK_EXAM_TIME_LIMIT_MINUTES_MAX}
                                >
                                    <Text style={styles.stepBtnText}>+</Text>
                                </Pressable>
                            </View>
                            <Text style={[styles.subHint, { marginTop: 10 }]}>
                                Entre {MOCK_EXAM_TIME_LIMIT_MINUTES_MIN} e{' '}
                                {MOCK_EXAM_TIME_LIMIT_MINUTES_MAX} minutos.
                            </Text>
                        </>
                    ) : null}
                </View>

                <BrotoCtaButton
                    title={submitting ? 'Montando...' : 'Iniciar sessão'}
                    leftIcon={
                        submitting ? undefined : (
                            <ArrowRight size={18} color={colors.cta.text} strokeWidth={2.2} />
                        )
                    }
                    onPress={() => void handleStart()}
                    loading={submitting}
                    disabled={!baseUrl}
                />
            </ScrollView>
        </SafeAreaView>
    )
}

function selectLanguageBlock(
    selectedLanguage: string,
    setSelectedLanguage: (v: string) => void,
) {
    return (
        <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionLabel}>Idioma (Linguagens)</Text>
            <View style={styles.chips}>
                {LANGUAGE_OPTIONS.map((opt) => {
                    const on = selectedLanguage === opt.value
                    return (
                        <Pressable
                            key={opt.value || 'all'}
                            onPress={() => setSelectedLanguage(opt.value)}
                            style={[styles.chip, on && styles.chipOn]}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#02140D' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    muted: { color: colors.text.muted, fontFamily: fonts.sans },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
        backgroundColor: '#031A11',
    },
    headerBtn: { padding: 10 },
    headerTitle: {
        fontSize: 17,
        fontFamily: fonts.displaySemiBold,
        color: colors.text.primary,
    },
    scroll: { padding: 16, paddingBottom: 40, gap: 14 },
    err: { color: colors.red[400], fontFamily: fonts.sans, marginBottom: 4 },
    card: {
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    cardTitle: { fontFamily: fonts.sansSemiBold, color: colors.text.primary, fontSize: 15, flex: 1 },
    sectionLabel: {
        fontFamily: fonts.sansSemiBold,
        color: colors.text.secondary,
        fontSize: 13,
        marginBottom: 8,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    chipOn: {
        backgroundColor: colors.green.glow,
        borderColor: colors.green[500],
    },
    chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted },
    chipTextOn: { color: colors.green[300], fontFamily: fonts.sansSemiBold },
    subHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, lineHeight: 17 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    stepBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.bg.elevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    stepBtnText: { fontSize: 22, color: colors.text.primary, fontFamily: fonts.sansSemiBold },
    stepVal: { fontSize: 20, color: colors.text.primary, fontFamily: fonts.displaySemiBold, minWidth: 36, textAlign: 'center' },
    yearScroll: { flexGrow: 0 },
    yearChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    yearChipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted },
})
