import type { AchievementRow } from '@/components/progress/AchievementsCollapsible'
import { Target, Trophy, BookOpen, Star, Award, Crown, Medal } from 'lucide-react'

const ACHIEVEMENT_DEFS = [
  {
    id: 'first-question',
    label: 'Primeira Questão',
    desc: 'Respondeu sua primeira questão',
    icon: Star,
    color: '#2dd4a8',
    check: (t: number) => t >= 1,
  },
  {
    id: '10-questions',
    label: '10 Questões',
    desc: 'Respondeu 10 questões',
    icon: BookOpen,
    color: '#60a5fa',
    check: (t: number) => t >= 10,
  },
  {
    id: '50-questions',
    label: '50 Questões',
    desc: 'Respondeu 50 questões',
    icon: Target,
    color: '#a78bfa',
    check: (t: number) => t >= 50,
  },
  {
    id: '100-questions',
    label: 'Centurião',
    desc: '100 questões respondidas',
    icon: Trophy,
    color: '#f5c842',
    check: (t: number) => t >= 100,
  },
  {
    id: '250-questions',
    label: 'Maratonista',
    desc: '250 questões respondidas',
    icon: Crown,
    color: '#fb7e6a',
    check: (t: number) => t >= 250,
  },
  {
    id: '500-questions',
    label: 'Mestre ENEM',
    desc: '500 questões respondidas',
    icon: Medal,
    color: '#f5c842',
    check: (t: number) => t >= 500,
  },
  {
    id: '70-accuracy',
    label: 'Precisão 70%',
    desc: 'Taxa de acerto acima de 70%',
    icon: Award,
    color: '#2dd4a8',
    check: (_t: number, acc: number, total: number) => total >= 10 && acc >= 70,
  },
  {
    id: '80-accuracy',
    label: 'Precisão 80%',
    desc: 'Taxa de acerto acima de 80%',
    icon: Award,
    color: '#f5c842',
    check: (_t: number, acc: number, total: number) => total >= 20 && acc >= 80,
  },
] as const

export function buildAchievementRows(totalAnswered: number, accuracyPct: number): AchievementRow[] {
  return ACHIEVEMENT_DEFS.map((a) => ({
    id: a.id,
    label: a.label,
    desc: a.desc,
    icon: a.icon,
    color: a.color,
    unlocked: a.check(totalAnswered, accuracyPct, totalAnswered),
  }))
}
