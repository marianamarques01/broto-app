import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Clock, LogOut } from 'lucide-react-native'
import {
    areaKeyFromTopico,
    buildPracticeSessionSummary,
    fetchMockExamQuestions,
    getQuestionId,
    parseEnemAreaKey,
    timeLimitMinutesFromPracticeConfig,
    type MockExamAnswerResult,
    type Question,
} from '@broto/shared'
import { getQuestionsStaticBaseUrl } from '@/lib/questions-static-base'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import { submitAnswer } from '@/lib/api/answer-question'
import { QuestionPlayer } from '@/components/questions/QuestionPlayer'
import { colors, fonts } from '@/theme/tokens'
import FireflyBackground from '@/components/FireflyBackground'

function formatElapsed(totalSec: number): string {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
    return `${s}s`
}

function formatTimerClock(totalSec: number): string {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type SessionGetRes = {
    sessionId?: string
    questionIds?: string[]
    config?: unknown
}

export default function MockExamPlayScreen() {
    const router = useRouter()
    const { sessionId: routeSessionId } = useLocalSearchParams<{ sessionId: string }>()
    const { organization } = useClass()
    const baseUrl = getQuestionsStaticBaseUrl(organization?.slug ?? null)

    const [questions, setQuestions] = useState<Question[] | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(routeSessionId ?? null)
    const [questionIds, setQuestionIds] = useState<string[]>([])
    const [index, setIndex] = useState(0)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [topicByQuestionId, setTopicByQuestionId] = useState<Record<string, string | undefined>>({})
    const resultsRef = useRef<MockExamAnswerResult[]>([])
    const [elapsedSec, setElapsedSec] = useState(0)
    const startTimeRef = useRef(0)
    const questionStartMs = useRef(0)
    const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
    const finishingRef = useRef(false)

    useEffect(() => {
        startTimeRef.current = Date.now()
        const interval = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!baseUrl || questionIds.length === 0) return
        let cancelled = false
        void (async () => {
            try {
                const res = await fetch(`${baseUrl}/data/question-topic-mapping.json`)
                const data = (await res.json()) as { mapping?: Record<string, string> }
                const mapping = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {}
                if (cancelled) return
                const next: Record<string, string | undefined> = {}
                for (const id of questionIds) {
                    next[id] = mapping[id]
                }
                setTopicByQuestionId(next)
            } catch {
                if (!cancelled) setTopicByQuestionId({})
            }
        })()
        return () => {
            cancelled = true
        }
    }, [baseUrl, questionIds])

    useEffect(() => {
        if (questions && questions.length > 0) return
        const sid = typeof routeSessionId === 'string' ? routeSessionId.trim() : ''
        if (!sid || !baseUrl) {
            return
        }
        let cancelled = false
        void (async () => {
            try {
                const data = await api.post<SessionGetRes>('/api/practice-session/get', {
                    sessionId: sid,
                })
                const ids = Array.isArray(data.questionIds) ? data.questionIds.map(String) : []
                if (cancelled) return
                if (ids.length === 0) {
                    setLoadError('Nao foi possivel recuperar a lista de questoes.')
                    return
                }
                setSessionId(data.sessionId ?? sid)
                setTimeLimitMinutes(timeLimitMinutesFromPracticeConfig(data.config))
                setQuestionIds(ids)
                const loaded = await fetchMockExamQuestions(baseUrl, ids)
                if (cancelled) return
                if (loaded.length === 0) {
                    setLoadError('Erro ao carregar questoes do armazenamento.')
                    return
                }
                setQuestions(loaded)
            } catch {
                if (!cancelled) setLoadError('Erro ao carregar a sessao.')
            }
        })()
        return () => {
            cancelled = true
        }
    }, [questions, routeSessionId, baseUrl])

    const q = questions?.[index]

    useEffect(() => {
        questionStartMs.current = Date.now()
    }, [index, q])

    const onAnswerRecorded = useCallback((r: MockExamAnswerResult) => {
        resultsRef.current = [...resultsRef.current, r]
    }, [])

    const handleAnswer = useCallback(
        (question: Question, _letter: string, isCorrect: boolean) => {
            const questionId = getQuestionId(question)
            const timeSpentSec = Math.max(
                0,
                Math.round((Date.now() - questionStartMs.current) / 1000),
            )
            const topicSlug = topicByQuestionId[questionId]
            const fromTopicSlug = topicSlug != null ? areaKeyFromTopico(topicSlug) : 'outros'
            const areaSlug =
                parseEnemAreaKey(question.discipline) ??
                (fromTopicSlug !== 'outros' ? fromTopicSlug : undefined)
            void submitAnswer({
                questionId,
                isCorrect,
                ...(areaSlug ? { areaKey: areaSlug } : {}),
                timeSpentSec,
                sessionId: sessionId ?? undefined,
            }).then(() => {
                onAnswerRecorded({ questionId, isCorrect, timeSpentSec })
            })
        },
        [sessionId, onAnswerRecorded, topicByQuestionId],
    )

    const finalizeExam = useCallback(() => {
        const list = questions
        const sid = sessionId
        if (!list || !sid || finishingRef.current) return
        finishingRef.current = true
        const summary = buildPracticeSessionSummary(resultsRef.current, list, topicByQuestionId)
        void api.patch('/api/practice-session/complete', { sessionId: sid, summary }).catch(() => {})
        router.replace({
            pathname: '/mock-exam/result',
            params: { sessionId: sid },
        })
    }, [questions, sessionId, router, topicByQuestionId])

    const handleNext = useCallback(() => {
        if (finishingRef.current) return
        const list = questions
        const sid = sessionId
        if (!list || !sid) return
        if (index >= list.length - 1) {
            finalizeExam()
            return
        }
        setIndex((i) => i + 1)
    }, [questions, sessionId, index, finalizeExam])

    const handlePrevious = useCallback(() => {
        if (finishingRef.current || index <= 0) return
        setIndex((i) => i - 1)
    }, [index])

    useEffect(() => {
        if (timeLimitMinutes == null || !questions?.length || !sessionId) return
        const limitSec = timeLimitMinutes * 60
        if (elapsedSec < limitSec) return
        finalizeExam()
    }, [elapsedSec, timeLimitMinutes, questions, sessionId, finalizeExam])

    const totalQ = questions?.length ?? 0
    const progressLabel = totalQ > 0 ? `${index + 1} / ${totalQ}` : ''
    const progressPct = totalQ > 0 ? ((index + 1) / totalQ) * 100 : 0
    const limitSec = timeLimitMinutes != null ? timeLimitMinutes * 60 : null
    const remainingSec = limitSec != null ? Math.max(0, limitSec - elapsedSec) : null
    const timerWarn = remainingSec != null && remainingSec > 0 && remainingSec <= 300
    const timerProgressPct =
        limitSec != null ? Math.max(0, Math.min(100, ((remainingSec ?? 0) / limitSec) * 100)) : null

    if (!routeSessionId || String(routeSessionId).trim() === '') {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <Text style={styles.err}>Sessao invalida.</Text>
                <Pressable style={styles.linkBtn} onPress={() => router.replace('/mock-exam')}>
                    <Text style={styles.linkText}>Nova sessão</Text>
                </Pressable>
            </SafeAreaView>
        )
    }

    if (!baseUrl && !(questions && questions.length)) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <Text style={styles.err}>Configure a URL do corpus de questoes.</Text>
            </SafeAreaView>
        )
    }

    if (loadError) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <FireflyBackground count={5} runKey={1} opacity={0.85} />
                <Text style={styles.err}>{loadError}</Text>
                <Pressable style={styles.linkBtn} onPress={() => router.replace('/mock-exam')}>
                    <Text style={styles.linkText}>Nova sessão</Text>
                </Pressable>
            </SafeAreaView>
        )
    }

    if (!q || !sessionId) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.green[400]} size="large" />
                    <Text style={styles.muted}>Carregando questoes...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FireflyBackground count={6} runKey={2} opacity={0.85} />
            <View style={styles.topBar}>
                <Text style={styles.title}>Sessão ENEM</Text>
                <Text style={styles.sub}>{progressLabel}</Text>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>

            <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                    <Text style={styles.counter}>Questao {index + 1} de {totalQ}</Text>
                    <View style={[styles.timerCard, timerWarn && styles.timerCardWarn]}>
                        {remainingSec != null ? (
                            <>
                                <View style={styles.timerHead}>
                                    <View style={styles.timerLabelRow}>
                                        <Clock
                                            size={14}
                                            color={timerWarn ? colors.gold[400] : colors.green[400]}
                                        />
                                        <Text style={styles.timerLabel}>Tempo restante</Text>
                                    </View>
                                    <Text style={[styles.timerClock, timerWarn && styles.timerClockWarn]}>
                                        {formatTimerClock(remainingSec)}
                                    </Text>
                                </View>
                                <View style={styles.timerTrack}>
                                    <View
                                        style={[
                                            styles.timerFill,
                                            timerWarn && styles.timerFillWarn,
                                            { width: `${timerProgressPct ?? 0}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.timerElapsed}>
                                    {timerWarn ? 'Reta final' : 'Decorrido'} · {formatElapsed(elapsedSec)}
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.timerHead}>
                                    <View style={styles.timerLabelRow}>
                                        <Clock size={14} color={colors.text.muted} />
                                        <Text style={styles.timerLabel}>Tempo de prova</Text>
                                    </View>
                                    <Text style={styles.timerClock}>{formatTimerClock(elapsedSec)}</Text>
                                </View>
                                <Text style={styles.timerElapsed}>Sessao sem limite de tempo</Text>
                            </>
                        )}
                    </View>
                </View>
                <Pressable
                    onPress={() => router.replace('/mock-exam')}
                    style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.8 }]}
                >
                    <LogOut size={14} color={colors.text.secondary} />
                    <Text style={styles.exitText}>Sair</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <QuestionPlayer
                    key={getQuestionId(q)}
                    question={q}
                    questionNumber={index + 1}
                    totalQuestions={totalQ}
                    onAnswer={handleAnswer}
                    onPrevious={handlePrevious}
                    previousDisabled={index <= 0}
                    onNext={handleNext}
                />
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#02140D' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    muted: { color: colors.text.muted, fontFamily: fonts.sans },
    err: { color: colors.red[400], padding: 20, fontFamily: fonts.sans },
    linkBtn: { padding: 16 },
    linkText: { color: colors.green[400], fontFamily: fonts.sansSemiBold },
    topBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#031A11' },
    title: { fontFamily: fonts.displaySemiBold, fontSize: 18, color: colors.text.primary },
    sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted, marginTop: 4 },
    progressTrack: {
        height: 4,
        backgroundColor: colors.bg.elevated,
    },
    progressFill: {
        height: 4,
        backgroundColor: colors.green[500],
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#031A11',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
    },
    statusLeft: { gap: 4 },
    counter: { fontFamily: fonts.sansSemiBold, color: colors.text.primary, fontSize: 14 },
    timerCard: {
        minWidth: 214,
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(45, 212, 168, 0.26)',
        backgroundColor: 'rgba(18, 28, 23, 0.86)',
    },
    timerCardWarn: {
        borderColor: 'rgba(245, 200, 66, 0.46)',
        backgroundColor: 'rgba(34, 26, 9, 0.82)',
    },
    timerHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    timerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timerLabel: {
        fontFamily: fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.text.muted,
    },
    timerClock: {
        fontFamily: fonts.sansBold,
        fontSize: 20,
        lineHeight: 22,
        color: colors.green[400],
        letterSpacing: -0.4,
    },
    timerClockWarn: { color: colors.gold[400] },
    timerTrack: {
        height: 5,
        marginTop: 9,
        overflow: 'hidden',
        borderRadius: 999,
        backgroundColor: 'rgba(160, 184, 160, 0.16)',
    },
    timerFill: {
        height: 5,
        borderRadius: 999,
        backgroundColor: colors.green[400],
    },
    timerFillWarn: { backgroundColor: colors.gold[400] },
    timerElapsed: {
        marginTop: 6,
        fontFamily: fonts.sans,
        fontSize: 11,
        color: colors.text.muted,
        opacity: 0.88,
    },
    exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
    exitText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text.secondary },
    scroll: { paddingBottom: 32 },
})