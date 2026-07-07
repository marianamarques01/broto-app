import { useState, type CSSProperties } from 'react'
import {
  REDACAO_COMPETENCIAS,
  REDACAO_EIXOS_TEMATICOS,
  REDACAO_REPERTORIO_TIPOS,
  type RedacaoCompetencia,
  type RedacaoEixoTematico,
  type RedacaoRepertorio,
  type RedacaoRepertorioTipo,
} from '@broto/shared'

const TIPO_LABEL: Record<RedacaoRepertorioTipo, string> = {
  dica: 'Dica',
  repertorio: 'Repertório',
  modelo_estrutura: 'Modelo de estrutura',
  conectivos: 'Conectivos',
  proposta_intervencao: 'Proposta de intervenção',
}

const EIXO_LABEL: Record<RedacaoEixoTematico, string> = {
  educacao: 'Educação',
  saude: 'Saúde',
  meio_ambiente: 'Meio ambiente',
  tecnologia: 'Tecnologia',
  trabalho: 'Trabalho',
  direitos_humanos: 'Direitos humanos',
  cultura: 'Cultura',
}

type CreateInput = {
  titulo: string
  conteudo: string
  tipo: RedacaoRepertorioTipo
  scope: 'org' | 'class'
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
}

type UpdateInput = {
  id: string
  titulo: string
  conteudo: string
  tipo: RedacaoRepertorioTipo
  scope: 'org' | 'class'
  eixo_tematico?: RedacaoEixoTematico | null
  competencia_alvo?: RedacaoCompetencia | null
}

type Props = {
  classId: string
  editing: RedacaoRepertorio | null
  onCreate: (input: CreateInput) => Promise<{ error: string | null }>
  onUpdate: (input: UpdateInput) => Promise<{ error: string | null }>
  onCancelEdit: () => void
}

export function RepertorioForm({ editing, onCreate, onUpdate, onCancelEdit }: Props) {
  const [titulo, setTitulo] = useState(editing?.titulo ?? '')
  const [conteudo, setConteudo] = useState(editing?.conteudo ?? '')
  const [tipo, setTipo] = useState<RedacaoRepertorioTipo>(editing?.tipo ?? 'dica')
  const [scope, setScope] = useState<'org' | 'class'>(
    editing ? (editing.class_id ? 'class' : 'org') : 'class',
  )
  const [eixo, setEixo] = useState<RedacaoEixoTematico | ''>(editing?.eixo_tematico ?? '')
  const [competencia, setCompetencia] = useState<RedacaoCompetencia | ''>(
    editing?.competencia_alvo ?? '',
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!titulo.trim()) {
      setError('Informe um título')
      return
    }
    if (!conteudo.trim()) {
      setError('Informe o conteúdo')
      return
    }

    setLoading(true)
    setError(null)

    const payload = {
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      tipo,
      scope,
      eixo_tematico: eixo || null,
      competencia_alvo: competencia || null,
    }

    const result = editing
      ? await onUpdate({ id: editing.id, ...payload })
      : await onCreate(payload)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    if (!editing) {
      setTitulo('')
      setConteudo('')
      setEixo('')
      setCompetencia('')
    }
    setTimeout(() => setSuccess(false), 3000)
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-deep)',
    color: 'var(--text-primary)',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    color: 'var(--text-secondary)',
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>
        {editing ? 'Editar repertório' : 'Novo repertório'}
      </h3>

      <label style={labelStyle}>Título</label>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ex.: Conectivos para argumentação"
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      <label style={labelStyle}>Tipo</label>
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as RedacaoRepertorioTipo)}
        style={{ ...inputStyle, marginBottom: 12 }}
      >
        {REDACAO_REPERTORIO_TIPOS.map((t) => (
          <option key={t} value={t}>
            {TIPO_LABEL[t]}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Escopo</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['class', 'org'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid',
              borderColor: scope === s ? 'var(--green-600)' : 'var(--border-strong)',
              background: scope === s ? 'var(--green-glow)' : 'var(--bg-deep)',
              color: scope === s ? 'var(--green-400)' : 'var(--text-muted)',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {s === 'class' ? 'Só esta turma' : 'Toda a organização'}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Eixo temático (opcional)</label>
      <select
        value={eixo}
        onChange={(e) => setEixo(e.target.value as RedacaoEixoTematico | '')}
        style={{ ...inputStyle, marginBottom: 12 }}
      >
        <option value="">Qualquer eixo</option>
        {REDACAO_EIXOS_TEMATICOS.map((e) => (
          <option key={e} value={e}>
            {EIXO_LABEL[e]}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Competência alvo (opcional)</label>
      <select
        value={competencia}
        onChange={(e) => setCompetencia(e.target.value as RedacaoCompetencia | '')}
        style={{ ...inputStyle, marginBottom: 12 }}
      >
        <option value="">Qualquer competência</option>
        {REDACAO_COMPETENCIAS.map((c) => (
          <option key={c} value={c}>
            Competência {c}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Conteúdo</label>
      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={6}
        placeholder="Texto, dicas ou modelo para o aluno consultar durante a escrita..."
        style={{ ...inputStyle, marginBottom: 16, resize: 'vertical' }}
      />

      {error && (
        <p style={{ color: 'var(--red-400)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
      )}
      {success && (
        <p style={{ color: 'var(--green-400)', fontSize: 13, margin: '0 0 12px' }}>
          {editing ? 'Repertório atualizado!' : 'Repertório criado!'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: 8,
            background: 'var(--green-600)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}
