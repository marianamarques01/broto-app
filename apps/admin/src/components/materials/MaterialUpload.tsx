import { useState, useRef } from 'react'

type Props = {
  classId: string
  onUploadPDF: (file: File, title: string) => Promise<{ error: string | null }>
  onAddURL: (url: string, title: string, type: 'url' | 'youtube') => Promise<{ error: string | null }>
}

type UploadTab = 'pdf' | 'url' | 'youtube'

export function MaterialUpload({ onUploadPDF, onAddURL }: Props) {
  const [tab, setTab] = useState<UploadTab>('pdf')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function isYouTube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Informe um titulo'); return }
    setLoading(true)
    setError(null)

    let result: { error: string | null }

    if (tab === 'pdf') {
      if (!file) { setError('Selecione um arquivo'); setLoading(false); return }
      result = await onUploadPDF(file, title.trim())
    } else {
      if (!url.trim()) { setError('Informe uma URL'); setLoading(false); return }
      const type = isYouTube(url) ? 'youtube' : 'url'
      result = await onAddURL(url.trim(), title.trim(), type)
    }

    setLoading(false)
    if (result.error) { setError(result.error); return }

    setSuccess(true)
    setTitle('')
    setUrl('')
    setFile(null)
    setTimeout(() => setSuccess(false), 3000)
  }

  const tabBtn = (t: UploadTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: '8px',
        border: '1px solid',
        borderColor: tab === t ? 'var(--green-600)' : 'var(--border-strong)',
        background: tab === t ? 'var(--green-glow)' : 'var(--bg-deep)',
        color: tab === t ? 'var(--green-400)' : 'var(--text-muted)',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: tab === t ? 500 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '20px 24px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Adicionar material</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabBtn('pdf', 'PDF')}
        {tabBtn('url', 'URL')}
        {tabBtn('youtube', 'YouTube')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Titulo</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Apostila de Matematica"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
          />
        </div>

        {tab === 'pdf' ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Arquivo PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              role="presentation"
              style={{
                border: '1px dashed var(--border-strong)',
                borderRadius: 8,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'var(--green-glow)' : 'var(--bg-deep)',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {file ? file.name : 'Clique para selecionar um PDF'}
              </p>
              {file && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {tab === 'youtube' ? 'Link do YouTube' : 'URL da pagina'}
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={tab === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {error && <p style={{ color: 'var(--red-400)', fontSize: 12, margin: 0 }}>{error}</p>}
        {success && <p style={{ color: 'var(--green-600)', fontSize: 12, margin: 0 }}>Material adicionado!</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: 'var(--green-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Enviando...' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}
