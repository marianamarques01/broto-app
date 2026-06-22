/** Meta mínima de questões por missão de volume — alinhada a `daily-mission-bonus.ts` (Edge). */
export const DAILY_MISSION_VOLUME_QUEST_GOAL = 5

/** Áreas padrão quando não há histórico suficiente — alinhado a `daily-mission-constants.ts` (Edge). */
export const DEFAULT_MISSION_AREAS = ['matematica', 'linguagens', 'ciencias-humanas'] as const

/** XP por missão concluída (índices 0, 1, 2) — alinhado a `daily-mission-constants.ts` (Edge). */
export const DAILY_MISSION_XP_REWARDS = [30, 20, 50] as const

/** Slots de missões diárias na Home (volume + volume + meta de acerto). */
export const DAILY_MISSION_SLOT_COUNT = 3
