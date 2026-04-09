import { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import type { PracticeSessionSummary } from '@broto/shared'
import { api } from '@/lib/api-client'
import { colors, fonts } from '@/theme/tokens'
import { ChevronLeft } from 'lucide-react-native'
import FireflyBackground from '@/components/FireflyBackground'

type SessionListItem = {
    sessionId: string
    createdAt: string
    completedAt: string | null
    summary: unknown
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

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FireflyBackground count={5} runKey={1} opacity={0.85} />
            <View style={styles.header}>
                <Link href="/mock-exam" asChild>
                    <Pressable style={styles.backBtn}>
                        <ChevronLeft size={22} color={colors.text.secondary} />
                    </Pressable>
                </Link>
                <Text style={styles.title}>Simulados anteriores</Text>
                <View style={{ width: 40 }} />
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
                    <Text style={styles.muted}>Nenhum simulado ainda.</Text>
                ) : null}

                {sessions.map((s) => {
                    const sum = s.summary
                    const pct = isPracticeSessionSummary(sum) ? sum.percentualGeral : null
                    const done = !!s.completedAt
                    return (
                        <View key={s.sessionId} style={styles.card}>
                            <Text style={styles.cardMeta}>{formatWhen(s.createdAt)}</Text>
                            <Text style={styles.cardSub}>
                                {s.questionCount} questoes · {done ? 'Concluido' : 'Em andamento'}
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
})
