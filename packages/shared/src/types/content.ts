export type GeneratedContent = {
  id: string
  class_id: string
  topic_id: string
  content_type: 'flashcards' | 'mind_map' | 'study_guide'
  data: FlashcardsData | MindMapData | string
  generated_at: string
}

export type Flashcard = {
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export type FlashcardsData = {
  topic: string
  cards: Flashcard[]
}

export type MindMapNode = {
  id: string
  label: string
  children?: MindMapNode[]
}

export type MindMapData = {
  topic: string
  root: MindMapNode
}
