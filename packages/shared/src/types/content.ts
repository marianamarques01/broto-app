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
