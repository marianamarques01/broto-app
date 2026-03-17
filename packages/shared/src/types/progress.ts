export type TopicPerformance = {
  topic_id: string
  topic_label: string
  area: string
  total_answers: number
  correct_answers: number
  accuracy_rate: number
}

export type StudentProgress = {
  student_id: string
  class_id: string
  total_questions: number
  correct_answers: number
  accuracy_rate: number
  current_streak: number
  xp: number
  level: number
  topic_performance: TopicPerformance[]
  weak_topics: string[]
  last_activity_at: string
}

export type ClassIndicators = {
  class_id: string
  total_students: number
  active_students: number
  avg_accuracy_rate: number
  avg_streak: number
  weak_topics: TopicPerformance[]
  students: StudentProgress[]
}
