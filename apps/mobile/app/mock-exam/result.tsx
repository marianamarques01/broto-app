import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams } from 'expo-router'
import type { PracticeSessionSummary } from '@broto/shared'
import { getAreaConfig } from '@/theme/area-config'
import { api } from '@/lib/api-client'
import { colors, fonts } from '@/theme/tokens'
import { ChevronLeft } from 'lucide-react-native'
import FireflyBackground from '@/components/FireflyBackground'

function isPracticeSessionSummary(raw: unknown): raw is PracticeSessionSummary {
    if (!raw || typeof raw !== 'object') return false
    const o = raw as Record<string, unknown>
    if (typeof o.percentualGeral !== 'number') return false
    if (typeof o.totalQuestoes !== 'number') return false
    if (typeof o.totalCorretas !== 'number') return false
    if (!o.porArea || typeof o.porArea !== 'object') return false
    if (!o.porTopico || typeof o.porTopico !== 'object') return false
    return true
}

function formatTime(sec: number): string {
    if (sec < 60) return `${sec}s`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`
    const h = Math.floor(m / 60)
    const rm = m % 60
    return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

function tierLabel(pct: number): string {
    if (pct >= 80) return 'Excelente!'
    if (pct >= 60) return 'Bom trabalho!'
    if (pct >= 40) return 'Continue praticando!'
    return 'Nao desanime!'
}

export default function MockExamResultScreen() {
    const { sessionId: paramSessionId } = useLocalSearchParams<{ sessionId?: string }>()
    const [summary, setSummary] = useState<PracticeSessionSummary | null>(null)
    const [loading, setLoading] = useState(!!paramSessionId?.trim())
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        const sid = paramSessionId?.trim()
        if (!sid) {
            setLoading(false)
            return
        }
        let cancelled = false
        void (async () => {
            try {
                type GetRes = { summary?: unknown; completedAt?: string | null }
                const data = await api.post<GetRes>('/api/practice-session/get', { sessionId: sid })
                if (cancelled) return
                if (isPracticeSessionSummary(data.summary)) {
                    setSummary(data.summary)
                    setLoadError(null)
                } else if (data.completedAt == null) {
                    setLoadError('Esta sessao ainda esta em andamento.')
                } else {
                    setLoadError('O resumo desta sessao nao esta disponivel.')
                }
            } catch (e) {
                if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Erro ao carregar')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [paramSessionId])

    if (loading) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.green[400]} size="large" />
                    <Text style={styles.muted}>Carregando resultado...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (!summary) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <FireflyBackground count={5} runKey={1} opacity={0.85} />
                <Link href="/mock-exam" asChild>
                    <Pressable style={styles.backRow}>
                        <ChevronLeft size={22} color={colors.green[400]} />
                        <Text style={styles.backText}>Voltar</Text>
                    </Pressable>
                </Link>
                <Text style={styles.err}>{loadError ?? 'Resultado nao encontrado.'}</Text>
            </SafeAreaView>
        )
    }

    const pct = summary.percentualGeral
    const porArea = summary.porArea

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FireflyBackground count={6} runKey={2} opacity={0.85} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Link href="/mock-exam" asChild>
                    <Pressable style={styles.backRow}>
                        <ChevronLeft size={22} color={colors.green[400]} />
                        <Text style={styles.backText}>Nova sessão</Text>
                    </Pressable>
                </Link>

                <Text style={styles.heroPct}>{pct}%</Text>
                <Text style={styles.heroSub}>acertos · {tierLabel(pct)}</Text>
                <Text style={styles.detail}>
                    {summary.totalCorretas} / {summary.totalQuestoes} questoes
                </Text>
                {summary.tempoMedioPorQuestaoSeg != null ? (
                    <Text style={styles.detail}>
                        Tempo medio: {formatTime(Math.round(summary.tempoMedioPorQuestaoSeg))} / questao
                    </Text>
                ) : null}
                {summary.tempoTotalSeg != null ? (
                    <Text style={styles.detail}>Tempo total: {formatTime(Math.round(summary.tempoTotalSeg))}</Text>
                ) : null}

                <Text style={styles.section}>Por area</Text>
                {Object.entries(porArea).map(([slug, v]) => {
                    const cfg = getAreaConfig(slug)
                    return (
                        <View key={slug} style={styles.areaRow}>
                            <Text style={styles.areaName}>{cfg.label}</Text>
                            <Text style={[styles.areaScore, { color: cfg.color }]}>
                                {v.corretas}/{v.total} ({v.percentual}%)
                            </Text>
                        </View>
                    )
                })}

                <Link href="/mock-exam/history" asChild>
                    <Pressable style={styles.secondaryBtn}>
                        <Text style={styles.secondaryBtnText}>Historico</Text>
                    </Pressable>
                </Link>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#02140D' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    muted: { color: colors.text.muted, fontFamily: fonts.sans },
    scroll: { padding: 20, paddingBottom: 40 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    backText: { fontFamily: fonts.sansSemiBold, color: colors.green[400], fontSize: 16 },
    err: { color: colors.red[400], fontFamily: fonts.sans, padding: 16 },
    heroPct: {
        fontSize: 48,
        fontFamily: fonts.displaySemiBold,
        color: colors.green[400],
        textAlign: 'center',
    },
    heroSub: {
        fontFamily: fonts.sansSemiBold,
        color: colors.text.primary,
        textAlign: 'center',
        fontSize: 18,
        marginTop: 8,
    },
    detail: {
        fontFamily: fonts.sans,
        color: colors.text.muted,
        textAlign: 'center',
        marginTop: 8,
    },
    section: {
        fontFamily: fonts.displaySemiBold,
        color: colors.text.primary,
        fontSize: 18,
        marginTop: 28,
        marginBottom: 12,
    },
    areaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
    },
    areaName: { fontFamily: fonts.sans, color: colors.text.secondary, flex: 1 },
    areaScore: { fontFamily: fonts.sansSemiBold },
    secondaryBtn: {
        marginTop: 28,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.strong,
        alignItems: 'center',
    },
    secondaryBtnText: { fontFamily: fonts.sansSemiBold, color: colors.text.secondary },
})
