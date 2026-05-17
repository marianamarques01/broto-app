import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/contexts/AuthContext'
import { usePet, refreshPet } from '@/hooks/usePet'
import { useTheme } from '@/hooks/useTheme'
import { useClass } from '@/hooks/useClass'
import { api } from '@/lib/api-client'
import { resetPracticeHistoryFromServer } from '@/lib/reset-practice-history'
import { supabase } from '@/lib/supabase'
import { requestIntegratedTourReplay } from '@/lib/integrated-tour'
import { useCallback, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Eraser,
  Leaf,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Pencil,
  RotateCw,
  Sun,
  Users,
} from 'lucide-react'

const HORAS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const SETTINGS_ANCHORS = [
  { id: 'settings-section-conta', label: 'Conta' },
  { id: 'settings-section-turma', label: 'Turma' },
  { id: 'settings-section-broto', label: 'Broto' },
  { id: 'settings-section-aparencia', label: 'Tema' },
  { id: 'settings-section-prefs', label: 'Alertas' },
  { id: 'settings-section-ajuda', label: 'Ajuda' },
  { id: 'settings-section-dados', label: 'Dados' },
] as const

const SETTINGS_BROTO_EMOJI = '\u{1F331}'

function mapSupabasePetsNomeMissing(msg: string): string {
  const m = msg.toLowerCase()
  if (
    (m.includes('schema cache') && m.includes('nome') && m.includes('pets')) ||
    m.includes('pets.nome ausente') ||
    m.includes('coluna pets.nome')
  ) {
    return 'O banco ainda não tem a coluna de nome do Broto. No painel do Supabase: SQL → rode o script da migração `pets_broto_nome` (ou `supabase db push`). Depois, salve de novo.'
  }
  return msg
}

function formatDataEnem(iso: string | null | undefined): string {
  if (!iso) return '—'
  const s = String(iso).slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s
  return `${d}/${m}/${y}`
}

export function Settings() {
  const { user, signOut, refreshUser } = useAuth()
  const { pet, loading: loadingPet } = usePet()
  const { theme, setTheme } = useTheme()
  const { currentClass, organization, loading: loadingClass } = useClass()
  const idPrefix = useId()
  const localMsgId = `${idPrefix}-local-msg`
  const errId = `${idPrefix}-form-error`

  const [localMsg, setLocalMsg] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const [displayNome, setDisplayNome] = useState('')
  const [horas, setHoras] = useState(2)
  const [savingPerfil, setSavingPerfil] = useState(false)

  const [brotoNome, setBrotoNome] = useState('Broto')
  const [savingBroto, setSavingBroto] = useState(false)
  const [resettingPractice, setResettingPractice] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayNome(user.nome ?? '')
      setHoras(
        HORAS_OPTIONS.includes(user.horasDisponiveisPorDia)
          ? user.horasDisponiveisPorDia
          : Math.min(12, Math.max(1, user.horasDisponiveisPorDia ?? 2)),
      )
    }
  }, [user])

  useEffect(() => {
    if (pet?.nome) setBrotoNome(pet.nome)
  }, [pet?.nome])

  const handleClearLocal = useCallback(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('broto:')) localStorage.removeItem(key)
    })
    setLocalMsg('Dados locais limpos neste aparelho.')
    window.setTimeout(() => setLocalMsg(null), 3000)
  }, [])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }, [signOut])

  async function handleSavePerfil() {
    if (!user) return
    setFormError(null)
    const nome = displayNome.trim()
    if (nome.length < 2) {
      setFormError('Use um nome com pelo menos 2 caracteres.')
      return
    }
    if (nome.length > 80) {
      setFormError('Nome muito longo (máx. 80 caracteres).')
      return
    }
    setSavingPerfil(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ nome, horas_disponiveis_por_dia: horas })
        .eq('id', user.id)
      if (error) {
        setFormError(error.message)
        return
      }
      await refreshUser()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSavingPerfil(false)
    }
  }

  async function handleSaveBroto() {
    if (!user) return
    setFormError(null)
    const nome = brotoNome.trim()
    if (nome.length < 1) {
      setFormError('Dê um nome ao seu Broto.')
      return
    }
    if (nome.length > 32) {
      setFormError('Nome do Broto: máximo 32 caracteres.')
      return
    }
    setSavingBroto(true)
    try {
      await api.patch('/api/pet/me', { nome })
      await refreshPet()
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Não foi possível salvar.'
      setFormError(mapSupabasePetsNomeMissing(raw))
    } finally {
      setSavingBroto(false)
    }
  }

  async function handleResetPracticeHistory() {
    if (
      !window.confirm(
        'Apagar na conta todas as respostas do banco e o desempenho por tópico?\n\n' +
          'Isto também zera contagens locais do dia nas missões e no histórico de consistência neste navegador. XP e nível do Broto na conta não mudam.',
      )
    )
      return
    setFormError(null)
    setResettingPractice(true)
    try {
      await resetPracticeHistoryFromServer()
      setLocalMsg(
        'Histórico de prática zerado nas questões. As próximas respostas contam de novo nos gráficos.',
      )
      window.setTimeout(() => setLocalMsg(null), 4200)
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : 'Não foi possível zerar o histórico. Tenta de novo mais tarde.',
      )
    } finally {
      setResettingPractice(false)
    }
  }

  if (!user) {
    return (
      <div>
        <TopBar title="Configurações" subtitle="Carregando…" />
        <div className="broto-main-inner">
          <p className="broto-muted" style={{ margin: 0 }}>
            Carregando perfil…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Configurações" subtitle="Conta, turma, Broto, tema e dados" />
      <div className="broto-main-inner broto-main-inner--settings">
        <div className="broto-settings-page">
          <div className="broto-settings__column">
            <div className="broto-settings">
          <header className="broto-card broto-settings__hero">
            <div className="broto-settings__hero-accent" aria-hidden />
            <div className="broto-settings__hero-row">
              <div className="broto-settings__hero-icon" aria-hidden>
                <Leaf size={22} strokeWidth={2} />
              </div>
              <div className="broto-settings__hero-copy">
                <h1 className="broto-settings__title">Ajustes da conta</h1>
                <p className="broto-settings__lede">
                  Nome, rotina, turma, mascote e tema. Use os atalhos ao lado (ou abaixo no celular)
                  para pular de seção. O que você salvar fica na sua conta.
                </p>
              </div>
            </div>
          </header>

          {formError ? (
            <div className="broto-settings__alert" id={errId} role="alert">
              <AlertCircle size={18} className="broto-settings__alert-icon" aria-hidden />
              <p className="broto-settings__alert-text">{formError}</p>
            </div>
          ) : null}

          <nav className="broto-settings__toc" aria-label="Atalhos para seções">
            <ul className="broto-settings__toc-list">
              {SETTINGS_ANCHORS.map(({ id, label }) => (
                <li key={id}>
                  <a className="broto-settings__toc-link" href={`#${id}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="broto-settings__group" id="settings-section-conta">
            <p className="broto-section-label">Conta e rotina</p>
            <section
              className="broto-card broto-settings__section"
              aria-labelledby={`${idPrefix}-section-perfil`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-perfil`}>
                    Perfil
                  </h2>
                  <p className="broto-settings__section-desc">
                    Como você aparece no app, tempo disponível para estudo e dados da conta (somente
                    leitura).
                  </p>
                </div>
              </div>

              <div className="broto-settings__blocks">
                <div className="broto-settings__block">
                  <h3 className="broto-settings__block-label">Identificação</h3>
                  <div className="broto-settings__grid">
                    <div className="broto-settings__field">
                      <label className="broto-settings__label" htmlFor={`${idPrefix}-nome`}>
                        <Pencil size={14} className="broto-settings__label-icon" aria-hidden />
                        Nome
                      </label>
                      <input
                        id={`${idPrefix}-nome`}
                        className="broto-input"
                        value={displayNome}
                        onChange={(e) => setDisplayNome(e.target.value)}
                        autoComplete="name"
                      />
                      <p className="broto-settings__hint">Usado pelo Broto e nos relatórios.</p>
                    </div>

                    <div className="broto-settings__field">
                      <label className="broto-settings__label" htmlFor={`${idPrefix}-horas`}>
                        <BookOpen size={14} className="broto-settings__label-icon" aria-hidden />
                        Horas de estudo por dia
                      </label>
                      <select
                        id={`${idPrefix}-horas`}
                        className="broto-select"
                        value={horas}
                        onChange={(e) => setHoras(Number(e.target.value))}
                        aria-label="Horas de estudo por dia"
                      >
                        {HORAS_OPTIONS.map((h) => (
                          <option key={h} value={h}>
                            {h} {h === 1 ? 'hora' : 'horas'}
                          </option>
                        ))}
                      </select>
                      <p className="broto-settings__hint">Base para a rotina e o planejador.</p>
                    </div>
                  </div>
                </div>

                <div className="broto-settings__hr" role="presentation" />

                <div className="broto-settings__block">
                  <h3 className="broto-settings__block-label">Conta</h3>
                  <div className="broto-settings__grid">
                    <div className="broto-settings__field">
                      <span className="broto-settings__label">
                        <Mail size={14} className="broto-settings__label-icon" aria-hidden />
                        E-mail
                      </span>
                      <p className="broto-settings__readout">{user.email}</p>
                      <p className="broto-settings__hint">Vinculado ao login. Não é editável aqui.</p>
                    </div>

                    <div className="broto-settings__field">
                      <span className="broto-settings__label">Data do ENEM</span>
                      <p className="broto-settings__readout">{formatDataEnem(user.dataEnem)}</p>
                      <p className="broto-settings__hint">Definida no onboarding. Em breve: editar aqui.</p>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="broto-settings__section-footer">
                <button
                  type="button"
                  className="broto-btn-primary broto-btn-primary--inline"
                  onClick={() => void handleSavePerfil()}
                  disabled={savingPerfil}
                  aria-disabled={savingPerfil}
                >
                  {savingPerfil ? <Loader2 className="broto-settings__spin" size={16} aria-hidden /> : null}
                  {savingPerfil ? 'Salvando…' : 'Salvar perfil'}
                </button>
              </footer>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-turma">
            <p className="broto-section-label">Turma</p>
            <section
              className="broto-card broto-settings__section broto-settings__section--class"
              aria-labelledby={`${idPrefix}-section-class`}
            >
              <div className="broto-settings__class-head">
                <div className="broto-settings__class-icon" aria-hidden>
                  <Users size={20} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-class`}>
                    Sua turma
                  </h2>
                  <p className="broto-settings__section-desc">
                    Turmas ligam você a materiais e ao professor. Use o código para entrar ou
                    trocar.
                  </p>
                </div>
              </div>

              {loadingClass ? (
                <p className="broto-settings__class-status broto-settings__class-status--muted">
                  Carregando turma…
                </p>
              ) : currentClass ? (
                <div className="broto-settings__class-panel">
                  <p className="broto-settings__class-name">{currentClass.name}</p>
                  {organization ? (
                    <p className="broto-settings__class-org">{organization.name}</p>
                  ) : null}
                </div>
              ) : (
                <p className="broto-settings__class-status">
                  Você ainda não está em uma turma com esta conta.
                </p>
              )}

              <div className="broto-settings__class-actions">
                <Link to="/join-class" className="broto-settings__link">
                  {currentClass ? 'Trocar ou entrar em outra turma' : 'Entrar em uma turma'}
                  <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-broto">
            <p className="broto-section-label">Broto</p>
            <section
              className="broto-card broto-settings__section broto-settings__section--broto"
              aria-labelledby={`${idPrefix}-section-broto`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-broto`}>
                    Mascote
                  </h2>
                  <p className="broto-settings__section-desc">
                    Nome do Broto que aparece na home e no progresso.
                  </p>
                </div>
              </div>

              <div className="broto-settings__broto-row">
                <div className="broto-settings__broto-avatar" aria-hidden>
                  {SETTINGS_BROTO_EMOJI}
                </div>
                <div className="broto-settings__field broto-settings__field--grow">
                  <label className="broto-settings__label" htmlFor={`${idPrefix}-broto-nome`}>
                    Nome do Broto
                  </label>
                  <input
                    id={`${idPrefix}-broto-nome`}
                    className="broto-input"
                    value={brotoNome}
                    onChange={(e) => setBrotoNome(e.target.value)}
                    disabled={loadingPet}
                    maxLength={32}
                    autoComplete="off"
                    placeholder="Ex.: Broto, Folhinha, Sementinha…"
                  />
                  <p className="broto-settings__hint">
                    {loadingPet
                      ? 'Carregando dados do mascote…'
                      : 'Sincronizado com o pet da sua conta.'}
                  </p>
                </div>
              </div>

              <footer className="broto-settings__section-footer broto-settings__section-footer--tight">
                <button
                  type="button"
                  className="broto-btn-primary broto-btn-primary--inline"
                  onClick={() => void handleSaveBroto()}
                  disabled={savingBroto || loadingPet}
                  aria-disabled={savingBroto || loadingPet}
                >
                  {savingBroto ? <Loader2 className="broto-settings__spin" size={16} aria-hidden /> : null}
                  {savingBroto ? 'Salvando…' : 'Salvar nome'}
                </button>
              </footer>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-aparencia">
            <p className="broto-section-label">Aparência</p>
            <section
              className="broto-card broto-settings__section"
              aria-labelledby={`${idPrefix}-section-look`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-look`}>
                    Tema
                  </h2>
                  <p className="broto-settings__section-desc">Claro ou escuro em todo o app web.</p>
                </div>
              </div>
              <div className="broto-settings__theme" role="group" aria-label="Tema do aplicativo">
                <button
                  type="button"
                  className={`broto-settings__theme-pill${theme === 'light' ? ' broto-settings__theme-pill--on' : ''}`}
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  <Sun size={16} aria-hidden />
                  Claro
                </button>
                <button
                  type="button"
                  className={`broto-settings__theme-pill${theme === 'dark' ? ' broto-settings__theme-pill--on' : ''}`}
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  <Moon size={16} aria-hidden />
                  Escuro
                </button>
              </div>
              <p className="broto-settings__theme-note">
                Você também pode alternar pelo ícone na barra superior.
              </p>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-prefs">
            <p className="broto-section-label">Preferências</p>
            <section
              className="broto-card broto-settings__section broto-settings__section--muted"
              aria-labelledby={`${idPrefix}-section-prefs`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-prefs`}>
                    Notificações
                  </h2>
                  <p className="broto-settings__section-desc">Controles extras em breve.</p>
                </div>
              </div>
              <div className="broto-settings__placeholder">
                <Bell size={18} className="broto-settings__placeholder-icon" aria-hidden />
                <div>
                  <p className="broto-settings__placeholder-title">Lembretes e sons</p>
                  <p className="broto-settings__placeholder-text">
                    Em breve você poderá ativar lembretes de estudo e sons ao bater meta.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-ajuda">
            <p className="broto-section-label">Ajuda</p>
            <section
              className="broto-card broto-settings__section broto-settings__section--muted"
              aria-labelledby={`${idPrefix}-section-help`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-help`}>
                    Conhecer o app
                  </h2>
                  <p className="broto-settings__section-desc">
                    Abra de novo o tour em tela cheia com os principais blocos do Broto (integração entre
                    rotina, questões, simulado e Broto).
                  </p>
                </div>
              </div>
              <div className="broto-settings__class-actions">
                <Link
                  to="/"
                  className="broto-settings__link"
                  onClick={() => requestIntegratedTourReplay()}
                >
                  <CircleHelp size={18} aria-hidden />
                  Ver tour do app de novo
                  <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
            </section>
          </div>

          <div className="broto-settings__group" id="settings-section-dados">
            <p className="broto-section-label">Dados e sessão</p>
            <section
              className="broto-card broto-settings__section broto-settings__section--danger"
              aria-labelledby={`${idPrefix}-section-data`}
            >
              <div className="broto-settings__section-head">
                <div>
                  <h2 className="broto-settings__section-title" id={`${idPrefix}-section-data`}>
                    Zona sensível
                  </h2>
                  <p className="broto-settings__section-desc">
                    Zerar progresso no servidor, limpar cache deste navegador ou sair da conta.
                  </p>
                </div>
              </div>

              <ul className="broto-settings__action-list">
                <li className="broto-settings__action-item">
                  <div className="broto-settings__action-copy">
                    <p className="broto-settings__action-title">Zerar histórico de questões</p>
                    <p className="broto-settings__action-desc">
                      Remove respostas e desempenho por tópico no servidor, e zera contagens locais
                      do dia. XP e nível do Broto não mudam.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="broto-btn-secondary broto-btn-secondary--inline broto-settings__action-btn"
                    onClick={() => void handleResetPracticeHistory()}
                    disabled={resettingPractice}
                    aria-disabled={resettingPractice}
                  >
                    {resettingPractice ? (
                      <Loader2 className="broto-settings__spin" size={16} aria-hidden />
                    ) : (
                      <RotateCw size={16} aria-hidden />
                    )}
                    {resettingPractice ? 'Zerando…' : 'Zerar histórico'}
                  </button>
                </li>

                <li className="broto-settings__action-item" aria-labelledby={`${idPrefix}-act-local`}>
                  <div className="broto-settings__action-copy">
                    <p className="broto-settings__action-title" id={`${idPrefix}-act-local`}>
                      Limpar dados locais
                    </p>
                    <p className="broto-settings__action-desc">
                      Apaga preferências e caches guardados só neste aparelho (prefixo{' '}
                      <span className="broto-settings__kbd">broto:</span>
                      ). Não altera sua conta.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="broto-btn-secondary broto-btn-secondary--inline broto-settings__action-btn"
                    onClick={handleClearLocal}
                  >
                    <Eraser size={16} aria-hidden />
                    Limpar agora
                  </button>
                </li>

                <li className="broto-settings__action-item">
                  <div className="broto-settings__action-copy">
                    <p className="broto-settings__action-title">Sair</p>
                    <p className="broto-settings__action-desc">Encerra a sessão neste navegador.</p>
                  </div>
                  <button
                    type="button"
                    className="broto-btn-secondary broto-btn-secondary--inline broto-settings__action-btn"
                    onClick={() => void handleSignOut()}
                    disabled={signingOut}
                    aria-disabled={signingOut}
                  >
                    <LogOut size={16} aria-hidden />
                    {signingOut ? 'Saindo…' : 'Sair da conta'}
                  </button>
                </li>
              </ul>

              {localMsg ? (
                <p className="broto-settings__inline-ok" id={localMsgId} role="status">
                  <Check size={14} aria-hidden />
                  {localMsg}
                </p>
              ) : null}
            </section>
          </div>
            </div>
          </div>

          <aside className="broto-settings__toc broto-settings__toc--rail" aria-label="Nesta página">
            <p className="broto-settings__toc-rail-title">Nesta página</p>
            <ul className="broto-settings__toc-rail-list">
              {SETTINGS_ANCHORS.map(({ id, label }) => (
                <li key={`rail-${id}`}>
                  <a className="broto-settings__toc-rail-link" href={`#${id}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
