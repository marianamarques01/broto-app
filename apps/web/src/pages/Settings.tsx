import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/contexts/AuthContext'
import { usePet, refreshPet } from '@/hooks/usePet'
import { useTheme } from '@/hooks/useTheme'
import { api } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useId, useState } from 'react'
import {
  Bell,
  BookOpen,
  Check,
  Eraser,
  Leaf,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Pencil,
  Sun,
} from 'lucide-react'

const HORAS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

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
      <TopBar title="Configurações" subtitle="Conta, Broto, estudo e aparência" />
      <div className="broto-main-inner">
        <div className="broto-settings">
          <div className="broto-settings__intro">
            <div className="broto-settings__intro-icon" aria-hidden>
              <Leaf size={22} />
            </div>
            <div>
              <h1 className="broto-settings__title">Ajuste como você estuda com o Broto</h1>
              <p className="broto-settings__lede">
                Edite seu nome, metas de rotina, o nome do mascote e o tema — tudo fica salvo na sua
                conta.
              </p>
            </div>
          </div>

          {formError ? (
            <p className="broto-settings__alert" id={errId} role="status">
              {formError}
            </p>
          ) : null}

          <section className="broto-settings__panel" aria-labelledby={`${idPrefix}-panel-perfil`}>
            <div className="broto-settings__panel-head">
              <h2 className="broto-settings__panel-title" id={`${idPrefix}-panel-perfil`}>
                Perfil
              </h2>
              <p className="broto-settings__panel-desc">Seu nome e meta diária de estudo (rotina).</p>
            </div>

            <div className="broto-settings__grid">
              <div className="broto-settings__field">
                <label className="broto-settings__label" htmlFor={`${idPrefix}-nome`}>
                  <Pencil size={14} className="broto-settings__label-icon" aria-hidden />
                  Seu nome
                </label>
                <input
                  id={`${idPrefix}-nome`}
                  className="broto-input"
                  value={displayNome}
                  onChange={(e) => setDisplayNome(e.target.value)}
                  autoComplete="name"
                />
                <p className="broto-settings__hint">Como o Broto e os relatórios vão chamar você.</p>
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
                >
                  {HORAS_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h} {h === 1 ? 'hora' : 'horas'}
                    </option>
                  ))}
                </select>
                <p className="broto-settings__hint">Base para a rotina de estudo e o planejador.</p>
              </div>

              <div className="broto-settings__field">
                <span className="broto-settings__label">
                  <Mail size={14} className="broto-settings__label-icon" aria-hidden />
                  E-mail
                </span>
                <p className="broto-settings__readout">{user.email}</p>
                <p className="broto-settings__hint">Não dá para alterar aqui (é o login da conta).</p>
              </div>

              <div className="broto-settings__field">
                <span className="broto-settings__label">Data do ENEM</span>
                <p className="broto-settings__readout">{formatDataEnem(user.dataEnem)}</p>
                <p className="broto-settings__hint">Definida no onboarding. Em breve: editar aqui.</p>
              </div>
            </div>

            <div className="broto-settings__row-actions">
              <button
                type="button"
                className="broto-btn-primary broto-btn-primary--inline"
                onClick={() => void handleSavePerfil()}
                disabled={savingPerfil}
                aria-disabled={savingPerfil}
              >
                {savingPerfil ? <Loader2 className="broto-settings__spin" size={16} /> : null}
                {savingPerfil ? 'Salvando…' : 'Salvar perfil'}
              </button>
            </div>
          </section>

          <section className="broto-settings__panel broto-settings__panel--broto" aria-labelledby={`${idPrefix}-panel-broto`}>
            <div className="broto-settings__panel-head">
              <h2 className="broto-settings__panel-title" id={`${idPrefix}-panel-broto`}>
                Seu Broto
              </h2>
              <p className="broto-settings__panel-desc">Nome do mascote que acompanha seu progresso.</p>
            </div>

            <div className="broto-settings__broto-row">
              <div className="broto-settings__broto-avatar" aria-hidden>
                {SETTINGS_BROTO_EMOJI}
              </div>
              <div className="broto-settings__field" style={{ flex: 1, minWidth: 0 }}>
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
                    : 'Aparece na home e no progresso quando usarmos o nome do pet.'}
                </p>
              </div>
            </div>

            <div className="broto-settings__row-actions">
              <button
                type="button"
                className="broto-btn-primary broto-btn-primary--inline"
                onClick={() => void handleSaveBroto()}
                disabled={savingBroto || loadingPet}
                aria-disabled={savingBroto || loadingPet}
              >
                {savingBroto ? <Loader2 className="broto-settings__spin" size={16} /> : null}
                {savingBroto ? 'Salvando…' : 'Salvar nome do Broto'}
              </button>
            </div>
          </section>

          <section className="broto-settings__panel" aria-labelledby={`${idPrefix}-panel-look`}>
            <div className="broto-settings__panel-head">
              <h2 className="broto-settings__panel-title" id={`${idPrefix}-panel-look`}>
                Aparência
              </h2>
              <p className="broto-settings__panel-desc">Tema claro ou escuro em todo o app web.</p>
            </div>
            <div className="broto-settings__theme" role="group" aria-label="Tema do aplicativo">
              <button
                type="button"
                className={`broto-settings__theme-pill${theme === 'light' ? ' broto-settings__theme-pill--on' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={16} aria-hidden />
                Claro
              </button>
              <button
                type="button"
                className={`broto-settings__theme-pill${theme === 'dark' ? ' broto-settings__theme-pill--on' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={16} aria-hidden />
                Escuro
              </button>
            </div>
            <p className="broto-settings__theme-note">Dica: você também alterna o tema no ícone do canto da barra.</p>
          </section>

          <section className="broto-settings__panel" aria-labelledby={`${idPrefix}-panel-prefs`}>
            <div className="broto-settings__panel-head">
              <h2 className="broto-settings__panel-title" id={`${idPrefix}-panel-prefs`}>
                Preferências
              </h2>
              <p className="broto-settings__panel-desc">Ajustes adicionais em breve.</p>
            </div>
            <div className="broto-settings__placeholder">
              <Bell size={18} className="broto-settings__placeholder-icon" aria-hidden />
              <div>
                <p className="broto-settings__placeholder-title">Notificações e sons</p>
                <p className="broto-settings__placeholder-text">
                  Em breve você poderá ativar lembretes e sons de conclusão de meta.
                </p>
              </div>
            </div>
          </section>

          <section className="broto-settings__panel broto-settings__panel--danger" aria-labelledby={`${idPrefix}-panel-data`}>
            <div className="broto-settings__panel-head">
              <h2 className="broto-settings__panel-title" id={`${idPrefix}-panel-data`}>
                Dados e sessão
              </h2>
              <p className="broto-settings__panel-desc">Cache local, histórico leve e saída da conta.</p>
            </div>
            <div className="broto-settings__row-actions broto-settings__row-actions--wrap">
              <button type="button" className="broto-btn-secondary broto-btn-secondary--inline" onClick={handleClearLocal}>
                <Eraser size={16} aria-hidden />
                Limpar dados locais
              </button>
              {localMsg ? (
                <span className="broto-settings__inline-ok" id={localMsgId} role="status">
                  <Check size={14} aria-hidden />
                  {localMsg}
                </span>
              ) : null}
              <button
                type="button"
                className="broto-btn-secondary broto-btn-secondary--inline"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                aria-disabled={signingOut}
              >
                <LogOut size={16} aria-hidden />
                {signingOut ? 'Saindo…' : 'Sair da conta'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
