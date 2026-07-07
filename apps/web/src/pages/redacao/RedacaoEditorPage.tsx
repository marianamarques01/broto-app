import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import {
  clampLinhasRedacao,
  countLinhasRedacao,
  linhaCountStatus,
  type RedacaoModo,
} from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { RedacaoHelpModal } from '@/components/redacao/RedacaoHelpModal'
import { RedacaoPropostaPanel } from '@/components/redacao/RedacaoPropostaPanel'
import { RedacaoTimerBadge } from '@/components/redacao/RedacaoTimerBadge'
import {
  ENEM_TEMPO_SEGUNDOS,
  firstHelpTabWithContent,
  groupRepertoriosByTab,
  type HelpTab,
} from '@/components/redacao/redacao-editor-utils'
import { RedacaoWriteCanvas } from '@/components/redacao/RedacaoWriteCanvas'
import { useRedacaoDraft } from '@/hooks/useRedacaoDraft'
import { useRedacaoRepertorios } from '@/hooks/useRedacaoRepertorios'
import { useRedacaoSubmit } from '@/hooks/useRedacaoSubmit'
import { useRedacaoTema } from '@/hooks/useRedacaoTemas'

function linhaCountLabel(count: number): string {
  const status = linhaCountStatus(count)
  if (status === 'empty') return '0 linhas — mínimo 7'
  if (status === 'below_min') return `${count} linhas — faltam ${7 - count}`
  if (status === 'over_max') return `${count} linhas — máximo 30`
  if (status === 'at_max') return `${count} linhas — limite atingido`
  return `${count} linhas`
}

export function RedacaoEditorPage() {
  const navigate = useNavigate()
  const { temaId } = useParams<{ temaId: string }>()
  const { tema, loading: loadingTema, error: temaError } = useRedacaoTema(temaId)
  const {
    repertorios,
    loading: loadingRepertorios,
    error: repertorioError,
  } = useRedacaoRepertorios({
    eixoTematico: tema?.eixo_tematico ?? null,
  })
  const { draft, loading: loadingDraft, error: draftError, saveDraft } = useRedacaoDraft(temaId)
  const {
    submitRedacao,
    submitting,
    error: submitError,
    setError: setSubmitError,
  } = useRedacaoSubmit()

  const draftKey = !loadingDraft && temaId ? (draft?.id ?? `new:${temaId}`) : null
  const [syncedDraftKey, setSyncedDraftKey] = useState<string | null>(null)
  const [userTexto, setUserTexto] = useState<string | null>(null)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(ENEM_TEMPO_SEGUNDOS)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [helpTab, setHelpTab] = useState<HelpTab>('dicas')
  const [expandedRepertorioId, setExpandedRepertorioId] = useState<string | null>(null)

  if (draftKey !== null && draftKey !== syncedDraftKey) {
    setSyncedDraftKey(draftKey)
    setUserTexto(null)
    if (draft?.modo === 'cronometrado' && draft.tempo_segundos != null) {
      setTimerEnabled(true)
      setSecondsLeft(Math.max(0, ENEM_TEMPO_SEGUNDOS - draft.tempo_segundos))
    } else {
      setTimerEnabled(false)
      setSecondsLeft(ENEM_TEMPO_SEGUNDOS)
    }
  }

  const texto = userTexto ?? draft?.texto ?? ''
  const linhaCount = useMemo(() => countLinhasRedacao(texto), [texto])
  const canSubmit =
    linhaCountStatus(linhaCount) === 'valid' || linhaCountStatus(linhaCount) === 'at_max'
  const repertoriosByTab = useMemo(() => groupRepertoriosByTab(repertorios), [repertorios])

  useEffect(() => {
    if (!helpModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [helpModalOpen])

  useEffect(() => {
    if (!timerEnabled || secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerEnabled, secondsLeft])

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setUserTexto(clampLinhasRedacao(event.target.value))
      setSubmitError(null)
    },
    [setSubmitError],
  )

  const elapsedSeconds = timerEnabled ? ENEM_TEMPO_SEGUNDOS - secondsLeft : null
  const modo: RedacaoModo = timerEnabled ? 'cronometrado' : 'digitado'

  useEffect(() => {
    if (!syncedDraftKey || !temaId) return
    const id = window.setTimeout(() => {
      void saveDraft({ texto, modo, tempoSegundos: elapsedSeconds })
    }, 4000)
    return () => window.clearTimeout(id)
  }, [elapsedSeconds, modo, saveDraft, syncedDraftKey, temaId, texto])

  const openHelpModal = useCallback(() => {
    setHelpTab(firstHelpTabWithContent(repertoriosByTab))
    setExpandedRepertorioId(null)
    setHelpModalOpen(true)
  }, [repertoriosByTab])

  const handleSubmit = useCallback(async () => {
    if (!temaId || !canSubmit || submitting) return

    setSubmitError(null)
    await saveDraft({ texto, modo, tempoSegundos: elapsedSeconds })

    const result = await submitRedacao({
      temaId,
      texto,
      modo,
      tempoSegundos: elapsedSeconds,
      redacaoId: draft?.id ?? null,
    })

    if (result?.redacao.id) {
      navigate(`/redacao/resultado/${result.redacao.id}`)
    }
  }, [
    canSubmit,
    draft?.id,
    elapsedSeconds,
    modo,
    navigate,
    saveDraft,
    setSubmitError,
    submitRedacao,
    submitting,
    temaId,
    texto,
  ])

  if (!temaId) {
    return (
      <div className="broto-page broto-page--redacao">
        <TopBar title="Redação" subtitle="Tema não informado" />
        <div className="broto-main-inner">
          <Link to="/redacao" className="broto-redacao-back-link">
            Voltar aos temas
          </Link>
        </div>
      </div>
    )
  }

  const loading = loadingTema || loadingDraft
  const linhaStatus = linhaCountStatus(linhaCount)

  return (
    <div className="broto-page broto-page--redacao broto-page--redacao-editor">
      {loading ? (
        <div className="broto-rx-loading" role="status">
          <Loader2 className="broto-redacao-state__spin" size={24} aria-hidden />
          <span>Preparando editor…</span>
        </div>
      ) : null}

      {!loading && (temaError || !tema) ? (
        <div className="broto-rx-loading broto-rx-loading--error" role="alert">
          {temaError ?? 'Tema não encontrado.'}
          <Link to="/redacao" className="broto-redacao-back-link">
            <ArrowLeft size={16} aria-hidden />
            Voltar aos temas
          </Link>
        </div>
      ) : null}

      {!loading && tema ? (
        <div className="broto-rx-shell">
          <RedacaoTimerBadge
            timerEnabled={timerEnabled}
            onTimerEnabledChange={(enabled) => {
              setTimerEnabled(enabled)
              if (enabled) setSecondsLeft(ENEM_TEMPO_SEGUNDOS)
            }}
            secondsLeft={secondsLeft}
          />
          <div className="broto-rx-workspace">
            <RedacaoPropostaPanel tema={tema} onOpenHelp={openHelpModal} />
            <RedacaoWriteCanvas
              texto={texto}
              onTextChange={handleTextChange}
              draftError={draftError}
              repertorioError={repertorioError}
            />
          </div>

          <footer className="broto-rx-submit-bar">
            <p
              className={`broto-rx-submit-bar__count broto-rx-submit-bar__count--${linhaStatus}`}
              aria-live="polite"
            >
              {linhaCountLabel(linhaCount)}
            </p>
            {submitError ? (
              <p className="broto-rx-submit-bar__error" role="alert">
                {submitError}
              </p>
            ) : null}
            <button
              type="button"
              className="broto-rx-submit-bar__btn"
              disabled={!canSubmit || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="broto-redacao-state__spin" size={18} aria-hidden />
                  Corrigindo…
                </>
              ) : (
                <>
                  <Send size={18} aria-hidden />
                  Enviar redação
                </>
              )}
            </button>
          </footer>

          <RedacaoHelpModal
            open={helpModalOpen}
            helpTab={helpTab}
            onHelpTabChange={(tab) => {
              setHelpTab(tab)
              setExpandedRepertorioId(null)
            }}
            onClose={() => setHelpModalOpen(false)}
            loading={loadingRepertorios}
            repertoriosByTab={repertoriosByTab}
            expandedRepertorioId={expandedRepertorioId}
            onToggleRepertorio={(id) =>
              setExpandedRepertorioId((current) => (current === id ? null : id))
            }
          />
        </div>
      ) : null}
    </div>
  )
}
