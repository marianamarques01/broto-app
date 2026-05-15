import { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { formatPracticeSessionAreasLabel, type PracticeSessionSummary } from '@broto/shared'
import { api } from '@/lib/api-client'
import { colors, fonts } from '@/theme/tokens'
import { ChevronLeft, Trash2 } from 'lucide-react-native'
import FireflyBackground from '@/components/FireflyBackground'

type SessionListItem = {
    sessionId: string
    createdAt: string
    completedAt: string | null
    summary: unknown
    config: unknown
    questionCount: number
}

function isPracticeSessionSummary(raw: unknown): raw is PracticeSessionSummary {
    if (!raw || typeof raw !== 'object') return false
    const o = raw as Record<string, unknown>
    return typeof o.percentualGeral === 'number'
}

function formatWhen(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function MockExamHistoryScreen() {
    const router = useRouter()
    const [sessions, setSessions] = useState<SessionListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        setError(null)
        setLoading(true)
        try {
            type Res = { sessions?: SessionListItem[] }
            const data = await api.post<Res>('/api/practice-session/list', { limit: 50 })
            setSessions(Array.isArray(data.sessions) ? data.sessions : [])
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro ao carregar historico')
            setSessions([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const promptClearAll = useCallback(() => {
        if (sessions.length === 0 || busy) return
        Alert.alert(
            'Limpar histórico',
            'Todas as sessões serão removidas. Não dá para desfazer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpar tudo',
                    style: 'destructive',
                    onPress: () => {
                        void (async () => {
                            setBusy(true)
                            setError(null)
                            try {
                                await api.post('/api/practice-session/delete', { deleteAll: true })
                                setSessions([])
                            } catch (e) {
                                setError(e instanceof Error ? e.message : 'Nao foi possivel limpar')
                            } finally {
                                setBusy(false)
                            }
                        })()
                    },
                },
            ],
        )
    }, [sessions.length, busy])

    const promptDeleteOne = useCallback(
        (sessionId: string) => {
            if (busy) return
            Alert.alert(
                'Excluir sessão?',
                'O bloco sai do histórico. Sessões em andamento não poderão ser retomadas por aqui.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: () => {
                            void (async () => {
                                setBusy(true)
                                setError(null)
                                try {
                                    await api.post('/api/practice-session/delete', { sessionId })
                                    setSessions((prev) => prev.filter((x) => x.sessionId !== sessionId))
                                } catch (e) {
                                    setError(e instanceof Error ? e.message : 'Nao foi possivel excluir')
                                } finally {
                                    setBusy(false)
                                }
                            })()
                        },
                    },
                ],
            )
        },
        [busy],
    )

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FireflyBackground count={5} runKey={1} opacity={0.85} />
            <View style={styles.header}>
                <Link href="/mock-exam" asChild>
                    <Pressable style={styles.backBtn}>
                        <ChevronLeft size={22} color={colors.text.secondary} />
                    </Pressable>
                </Link>
                <Text style={styles.title}>Sessões anteriores</Text>
                <Pressable
                    style={[
                        styles.headerClear,
                        (loading || sessions.length === 0 || busy) && styles.headerClearDisabled,
                    ]}
                    disabled={loading || sessions.length === 0 || busy}
                    onPress={promptClearAll}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar todo o histórico de sessões"
                >
                    <Text style={styles.headerClearText}>Limpar</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {loading ? (
                    <View style={styles.centerRow}>
                        <ActivityIndicator color={colors.green[400]} />
                        <Text style={styles.muted}>Carregando...</Text>
                    </View>
                ) : null}

                {error ? <Text style={styles.err}>{error}</Text> : null}

                {!loading && sessions.length === 0 ? (
                    <Text style={styles.muted}>Nenhuma sessão ainda.</Text>
                ) : null}

                {sessions.map((s) => {
                    const sum = s.summary
                    const pct = isPracticeSessionSummary(sum) ? sum.percentualGeral : null
                    const done = !!s.completedAt
                    const areasLabel = formatPracticeSessionAreasLabel(s.config, s.summary)
                    return (
                        <View key={s.sessionId} style={styles.card}>
                            <Text style={styles.cardMeta}>{formatWhen(s.createdAt)}</Text>
                            <Text style={styles.cardSub}>
                                {s.questionCount} questoes · {areasLabel} ·{' '}
                                {done ? 'Concluido' : 'Em andamento'}
                            </Text>
                            {pct != null ? (
                                <Text style={styles.pct}>{pct}% acertos</Text>
                            ) : null}
                            <View style={styles.actions}>
                                {!done ? (
                                    <Pressable
                                        style={styles.btn}
                                        onPress={() => router.push(`/mock-exam/play/${s.sessionId}`)}
                                    >
                                        <Text style={styles.btnText}>Continuar</Text>
                                    </Pressable>
                                ) : null}
                                {done ? (
                                    <Pressable
                                        style={styles.btnGhost}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/mock-exam/result',
                                                params: { sessionId: s.sessionId },
                                            })
                                        }
                                    >
                                        <Text style={styles.btnGhostText}>Resultado</Text>
                                    </Pressable>
                                ) : null}
                                <Pressable
                                    style={styles.btnTrash}
                                    onPress={() => promptDeleteOne(s.sessionId)}
                                    disabled={busy}
                                    accessibilityRole="button"
                                    accessibilityLabel="Excluir sessão do histórico"
                                >
                                    <Trash2 size={20} color={colors.red[400]} />
                                </Pressable>
                            </View>
                        </View>
                    )
                })}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#02140D' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: '#031A11',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
    },
    backBtn: { padding: 10 },
    title: { fontFamily: fonts.displaySemiBold, fontSize: 17, color: colors.text.primary },
    scroll: { padding: 16, gap: 12, paddingBottom: 40 },
    centerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    muted: { color: colors.text.muted, fontFamily: fonts.sans },
    err: { color: colors.red[400], fontFamily: fonts.sans, marginBottom: 8 },
    card: {
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    cardMeta: { fontFamily: fonts.sansSemiBold, color: colors.text.primary },
    cardSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted, marginTop: 4 },
    pct: { fontFamily: fonts.sansSemiBold, color: colors.green[400], marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btn: {
        flex: 1,
        backgroundColor: colors.green[600],
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: { fontFamily: fonts.sansSemiBold, color: '#fff' },
    btnGhost: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.strong,
    },
    btnGhostText: { fontFamily: fonts.sansSemiBold, color: colors.text.secondary },
    headerClear: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.red[400],
    },
    headerClearDisabled: { opacity: 0.4 },
    headerClearText: {
        fontFamily: fonts.sansSemiBold,
        fontSize: 13,
        color: colors.red[400],
    },
    btnTrash: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.bg.deep,
    },
})
