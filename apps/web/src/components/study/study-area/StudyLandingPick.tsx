import { useNavigate } from 'react-router-dom'
import { ChevronRight, PenLine, Timer } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AREA_CONFIG } from '@/lib/area-config'
import { AREA_ACCENT_VARS, StudyAreaCardPattern } from '@/components/study/study-area-card-pattern'
import type { ProgressData } from '@/hooks/useProgress'
import {
  areaBlockForKey,
  landingQuickStats,
  STUDY_AREA_CARD_KEYS,
  topicsForAreaKey,
} from '@/components/study/study-area/study-area-utils'

export function StudyLandingPick({ progress }: { progress: ProgressData | undefined }) {
  const navigate = useNavigate()
  const welcomeStats = landingQuickStats(progress)
  const areaKeys = STUDY_AREA_CARD_KEYS
  const areaDelays = [100, 180, 260, 340]

  return (
    <div>
      <div className="study-welcome">
        <div className="study-welcome__text">
          <h2 className="study-welcome__title">
            Escolha seu caminho
            <br />
            de <em>estudo</em>
          </h2>
          <p className="study-welcome__sub">
            Cada área tem <strong>trilha por tópico</strong> e <strong>banco de questões</strong>.
            Para treinar em bloco no <strong>estilo de um simulado</strong> (cronômetro opcional,
            quantidade à sua escolha — não é a prova inteira), use a <strong>sessão ENEM</strong> no
            card abaixo.
          </p>
        </div>
        <div className="study-quickstats" aria-label="Resumo de desempenho">
          <div className="study-quickstat">
            <span className="study-quickstat__val">{welcomeStats.totalAnswered}</span>
            <span className="study-quickstat__lab">Questões</span>
          </div>
          <div className="study-quickstat">
            <span
              className={`study-quickstat__val${welcomeStats.weightedAcc !== null ? ' study-quickstat__val--teal' : ''}`}
            >
              {welcomeStats.weightedAcc !== null ? `${welcomeStats.weightedAcc}%` : '—'}
            </span>
            <span className="study-quickstat__lab">Acerto geral</span>
          </div>
          <div
            className={`study-quickstat${welcomeStats.lowest !== null ? ' study-quickstat--coral' : ''}`}
          >
            <span className="study-quickstat__val">
              {welcomeStats.lowest !== null ? `${welcomeStats.lowest}%` : '—'}
            </span>
            <span className="study-quickstat__lab">Menor nota</span>
          </div>
        </div>
      </div>

      <div className="study-areas-label">Área de conhecimento</div>
      <div className="study-areas">
        {areaKeys.map((key, i) => {
          const cfg = AREA_CONFIG[key]
          const Icon = cfg.icon
          const block = areaBlockForKey(progress?.areas, key)
          const avg =
            block != null && block.totalAnswered > 0 ? Math.round(block.accuracyPct) : null
          const n = topicsForAreaKey(key, progress?.areas).length
          const av = AREA_ACCENT_VARS[key] ?? AREA_ACCENT_VARS.linguagens
          return (
            <button
              key={key}
              type="button"
              className="study-area-card"
              style={
                {
                  '--study-area-accent': cfg.color,
                  '--ac-dim': av.dim,
                  '--ac-glow': av.glow,
                  animation: 'study-scale-in 0.4s ease-out both',
                  animationDelay: `${areaDelays[i] ?? 340}ms`,
                } as CSSProperties
              }
              onClick={() => navigate(`/study/${key}`)}
            >
              <StudyAreaCardPattern areaKey={key} />
              <div className="study-area-card__glow" aria-hidden />
              <span className="study-area-card__dot" aria-hidden />
              <div className="study-area-card__icon">
                <Icon size={20} color="currentColor" strokeWidth={1.8} />
              </div>
              <p className="study-area-card__label">{cfg.label}</p>
              <p className="study-area-card__meta">
                {n} tópicos · {avg !== null ? `${avg}% média` : 'sem média'}
              </p>
            </button>
          )
        })}
      </div>

      <Link
        to="/redacao"
        className="study-simulado-landing"
        aria-label="Redação ENEM — escolher tema e praticar dissertação"
      >
        <div className="study-simulado-landing__icon">
          <PenLine size={22} strokeWidth={1.8} aria-hidden />
        </div>
        <div className="study-simulado-landing__body">
          <h3 className="study-simulado-landing__title">Redação ENEM</h3>
          <p className="study-simulado-landing__desc">
            Pratique dissertação com <strong>temas no estilo da prova</strong>, contador de linhas,
            cronômetro opcional e repertórios da sua turma.
          </p>
        </div>
        <span className="study-simulado-landing__trailing-chev" aria-hidden>
          <ChevronRight size={15} strokeWidth={2.2} />
        </span>
      </Link>

      <div className="study-simulado-label">Sessão (estilo simulado)</div>
      <Link
        to="/study/mock-exam"
        className="study-simulado-landing"
        aria-label="Sessão ENEM — montar bloco tipo simulado com filtros e quantidade"
      >
        <div className="study-simulado-landing__icon">
          <Timer size={22} strokeWidth={1.8} aria-hidden />
        </div>
        <div className="study-simulado-landing__body">
          <h3 className="study-simulado-landing__title">Sessão ENEM</h3>
          <p className="study-simulado-landing__desc">
            Monte um bloco personalizado no <strong>estilo de um simulado</strong> (filtros por
            área, ano e quantidade; tempo limite opcional). Você não fica preso ao formato inteiro
            da prova.
          </p>
        </div>
        <span className="study-simulado-landing__trailing-chev" aria-hidden>
          <ChevronRight size={15} strokeWidth={2.2} />
        </span>
      </Link>
    </div>
  )
}
