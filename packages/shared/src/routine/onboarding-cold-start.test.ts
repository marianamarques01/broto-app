import { describe, expect, it } from 'vitest'
import {
  buildColdStartAreas,
  deriveStrongWeakAreas,
  generateOnboardingRoutine,
} from './onboarding-cold-start'

describe('deriveStrongWeakAreas', () => {
  it('mapeia chaves curtas do onboarding para slugs ENEM', () => {
    const { strongAreas, weakAreas } = deriveStrongWeakAreas({
      matematica: 'avancado',
      humanas: 'iniciante',
      natureza: 'intermediario',
      linguagens: null,
    })
    expect(strongAreas).toEqual(['matematica'])
    expect(weakAreas).toEqual(['ciencias-humanas'])
  })
})

describe('buildColdStartAreas', () => {
  it('ordena áreas fracas antes das fortes para priorização na rotina', () => {
    const areas = buildColdStartAreas({
      horasPorDia: 2,
      niveis: {
        matematica: 'avancado',
        humanas: 'iniciante',
      },
    })
    expect(areas[0]?.value).toBe('ciencias-humanas')
    expect(areas[areas.length - 1]?.value).toBe('matematica')
  })
})

describe('generateOnboardingRoutine', () => {
  it('gera 7 dias com blocos de estudo e descanso', () => {
    const rotina = generateOnboardingRoutine({
      horasPorDia: 3,
      niveis: { humanas: 'iniciante', matematica: 'avancado' },
    })
    expect(rotina).toHaveLength(7)
    expect(rotina.some((d) => d.ehDescanso)).toBe(true)
    expect(rotina.filter((d) => !d.ehDescanso).every((d) => d.duracaoMin === 180)).toBe(true)
  })
})
