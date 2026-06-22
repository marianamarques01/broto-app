import { assertEquals } from 'jsr:@std/assert@1'
import {
  computeMissionBonusXp,
  pickMissionAreasFromTopicPerformance,
} from './daily-mission-bonus.ts'
import { DEFAULT_MISSION_AREAS, DAILY_MISSION_XP_REWARDS } from './daily-mission-constants.ts'

Deno.test('computeMissionBonusXp: conclui missão 0 quando volume atinge meta', () => {
  const missionAreas: [string, string, string] = ['matematica', 'linguagens', 'ciencias-humanas']
  const before = { matematica: { answered: 4, correct: 3 } }
  const after = { matematica: { answered: 5, correct: 4 } }

  const result = computeMissionBonusXp({ before, after, missionAreas })

  assertEquals(result.bonusXp, DAILY_MISSION_XP_REWARDS[0])
  assertEquals(result.completedIndexes, [0])
})

Deno.test('computeMissionBonusXp: missão já concluída não gera bônus duplicado', () => {
  const missionAreas: [string, string, string] = ['matematica', 'linguagens', 'ciencias-humanas']
  const before = { matematica: { answered: 5, correct: 4 } }
  const after = { matematica: { answered: 6, correct: 5 } }

  const result = computeMissionBonusXp({ before, after, missionAreas })

  assertEquals(result.bonusXp, 0)
  assertEquals(result.completedIndexes, [])
})

Deno.test('pickMissionAreasFromTopicPerformance: sem histórico usa áreas padrão', () => {
  const areas = pickMissionAreasFromTopicPerformance([])
  assertEquals(areas, [
    DEFAULT_MISSION_AREAS[0],
    DEFAULT_MISSION_AREAS[1],
    DEFAULT_MISSION_AREAS[2],
  ])
})

Deno.test('pickMissionAreasFromTopicPerformance: prioriza piores acertos por area_key', () => {
  const areas = pickMissionAreasFromTopicPerformance([
    {
      topico_value: 'ignored',
      total_answered: 10,
      total_correct: 9,
      accuracy_pct: 90,
      area_key: 'matematica',
    },
    {
      topico_value: 'ignored',
      total_answered: 10,
      total_correct: 2,
      accuracy_pct: 20,
      area_key: 'linguagens',
    },
    {
      topico_value: 'ignored',
      total_answered: 10,
      total_correct: 5,
      accuracy_pct: 50,
      area_key: 'ciencias-humanas',
    },
  ])

  assertEquals(areas[0], 'linguagens')
  assertEquals(areas[1], 'ciencias-humanas')
  assertEquals(areas[2], 'matematica')
})
