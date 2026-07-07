import { describe, expect, it } from 'vitest'
import {
  buildEvolucaoSeries,
  buildRoutineHints,
  computeMetaProgress,
  computeWeakCompetences,
  getLastNotasForCompetencia,
} from './evolucao'
import type { RedacaoCompetenceSnapshot } from '../types/redacao'

function snap(
  competencia: RedacaoCompetenceSnapshot['competencia'],
  redacaoId: string,
  nota: number,
  createdAt: string,
): RedacaoCompetenceSnapshot {
  return {
    id: `${redacaoId}-${competencia}`,
    user_id: 'user-1',
    competencia,
    nota,
    redacao_id: redacaoId,
    created_at: createdAt,
  }
}

describe('computeWeakCompetences', () => {
  it('marca competência com média < 120 nas últimas 3 redações', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('IV', 'r1', 80, '2026-01-01T00:00:00Z'),
      snap('IV', 'r2', 80, '2026-01-02T00:00:00Z'),
      snap('IV', 'r3', 80, '2026-01-03T00:00:00Z'),
      snap('I', 'r1', 160, '2026-01-01T00:00:00Z'),
      snap('I', 'r2', 160, '2026-01-02T00:00:00Z'),
      snap('I', 'r3', 160, '2026-01-03T00:00:00Z'),
    ]

    expect(computeWeakCompetences(snapshots)).toEqual(['IV'])
  })

  it('ignora competência com menos de 3 redações', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('IV', 'r1', 40, '2026-01-01T00:00:00Z'),
      snap('IV', 'r2', 40, '2026-01-02T00:00:00Z'),
    ]

    expect(computeWeakCompetences(snapshots)).toEqual([])
  })

  it('não marca competência com média >= limiar', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('IV', 'r1', 120, '2026-01-01T00:00:00Z'),
      snap('IV', 'r2', 120, '2026-01-02T00:00:00Z'),
      snap('IV', 'r3', 120, '2026-01-03T00:00:00Z'),
    ]

    expect(computeWeakCompetences(snapshots)).toEqual([])
  })
})

describe('getLastNotasForCompetencia', () => {
  it('retorna notas das redações mais recentes', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('II', 'r1', 80, '2026-01-01T00:00:00Z'),
      snap('II', 'r2', 120, '2026-01-02T00:00:00Z'),
      snap('II', 'r3', 160, '2026-01-03T00:00:00Z'),
      snap('II', 'r4', 200, '2026-01-04T00:00:00Z'),
    ]

    expect(getLastNotasForCompetencia(snapshots, 'II', 3)).toEqual([200, 160, 120])
  })

  it('deduplica snapshots duplicados da mesma redação', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('II', 'r1', 80, '2026-01-01T00:00:00Z'),
      {
        ...snap('II', 'r1', 120, '2026-01-01T01:00:00Z'),
        id: 'dup',
      },
    ]

    expect(getLastNotasForCompetencia(snapshots, 'II', 3)).toEqual([
      120,
    ])
  })
})

describe('buildEvolucaoSeries', () => {
  it('monta série temporal e calcula delta', () => {
    const snapshots: RedacaoCompetenceSnapshot[] = [
      snap('III', 'r1', 80, '2026-01-01T00:00:00Z'),
      snap('III', 'r2', 120, '2026-01-02T00:00:00Z'),
    ]

    const series = buildEvolucaoSeries(snapshots)
    const compIii = series.find((s) => s.competencia === 'III')

    expect(compIii?.points).toHaveLength(2)
    expect(compIii?.media).toBe(100)
    expect(compIii?.delta).toBe(40)
  })
})

describe('buildRoutineHints', () => {
  it('gera hints para competências fracas', () => {
    const hints = buildRoutineHints(['IV', 'V'])
    expect(hints).toHaveLength(2)
    expect(hints[0]?.area).toBe('linguagens')
    expect(hints[1]?.topic).toBe('proposta_intervencao')
  })
})

describe('computeMetaProgress', () => {
  it('calcula progresso em relação à meta', () => {
    expect(computeMetaProgress(800, 600)).toEqual({
      meta: 800,
      progressPct: 75,
      faltam: 200,
    })
  })

  it('retorna null quando meta ausente', () => {
    expect(computeMetaProgress(null, 600)).toEqual({
      meta: null,
      progressPct: null,
      faltam: null,
    })
  })
})
