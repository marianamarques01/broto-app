import { useState, useCallback, useRef, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  RotateCcw,
  Trophy,
  Zap,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react-native'
import { colors, fonts } from '@/theme/tokens'
import { AREA_CONFIG, getAreaConfig } from '@/theme/area-config'
import { FadeInSection, StaggerItem } from '@/components/AnimatedEntry'
import { BrotoCtaButton } from '@/components/BrotoCtaButton'
import {
  getMockTopics,
  getMockStudyPackage,
  type StudyPackage,
  type StudyFlashcard,
  type TopicOption,
  type MindMapNode,
} from '@/lib/study-area-mock'
import type { StudyJourneyTab } from '@broto/shared'
import {
  STUDY_JOURNEY_STAGES,
  studyJourneyCompletedCount,
  brotoCelebrateLine,
  computeStickyAction,
} from '@broto/shared'

type Step = 'select' | 'loading' | 'study'
type Tab = StudyJourneyTab

/* ─── Area/Topic Selector ──────────────────── */

function AreaTopicSelector({
  onStart,
}: {
  onStart: (areaKey: string, topic: TopicOption) => void
}) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const topics = selectedArea ? getMockTopics(selectedArea) : []
  const sorted = [...topics].sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) return 0
    if (a.accuracy === null) return 1
    if (b.accuracy === null) return -1
    return a.accuracy - b.accuracy
  })
  const weakest = sorted.find((t) => t.accuracy !== null)

  return (
    <View style={{ gap: 20 }}>
      {/* Hero */}
      <FadeInSection delay={0}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 18,
            borderRadius: 16,
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.default,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.green.glow,
              borderWidth: 1,
              borderColor: colors.border.strong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>📚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.sansBold, color: colors.text.primary }}>
              Área de Estudo
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sans,
                color: colors.text.secondary,
                marginTop: 2,
              }}
            >
              Resumo, flashcards, quiz e mapa mental
            </Text>
          </View>
        </View>
      </FadeInSection>

      {/* Area label */}
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.sansSemiBold,
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
        }}
      >
        Escolha a área
      </Text>

      {/* Area grid */}
      <FadeInSection delay={100}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(AREA_CONFIG).map(([key, cfg]) => {
            const active = selectedArea === key
            const Icon = cfg.Icon
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedArea(active ? null : key)}
                style={{ width: '48%' }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? cfg.color : colors.border.default,
                    backgroundColor: active ? cfg.gradientFrom : colors.bg.card,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: cfg.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} color={cfg.color} />
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                      color: active ? cfg.textColor : colors.text.primary,
                      flex: 1,
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </FadeInSection>

      {/* Topics */}
      {selectedArea && (
        <FadeInSection delay={0}>
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansSemiBold,
                color: colors.text.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              Escolha o tópico
            </Text>

            {weakest && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.green.glow,
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.15)',
                }}
              >
                <Sparkles size={14} color={colors.green[400]} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sans,
                    color: colors.green[400],
                    flex: 1,
                  }}
                >
                  Sugerido: <Text style={{ fontFamily: fonts.sansSemiBold }}>{weakest.label}</Text>{' '}
                  ({weakest.accuracy}% acerto)
                </Text>
              </View>
            )}

            {sorted.map((topic, i) => {
              const cfg = getAreaConfig(selectedArea)
              const hasData = topic.accuracy !== null
              return (
                <StaggerItem key={topic.value} index={i} baseDelay={60} stagger={40}>
                  <Pressable onPress={() => onStart(selectedArea, topic)} style={{ width: '100%' }}>
                    {({ pressed }) => (
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: colors.border.strong,
                          backgroundColor: pressed ? colors.bg.elevated : colors.bg.card,
                        }}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: fonts.sansSemiBold,
                              color: colors.text.primary,
                            }}
                          >
                            {topic.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.sans,
                              color: colors.text.muted,
                              marginTop: 2,
                            }}
                          >
                            {hasData
                              ? `${topic.accuracy}% acerto · ${topic.totalAnswered} questões`
                              : 'Sem dados ainda'}
                          </Text>
                        </View>
                        {hasData && (
                          <View
                            style={{ width: 72, flexShrink: 0, alignItems: 'flex-end', gap: 4 }}
                          >
                            <Text
                              style={{ fontSize: 12, fontFamily: fonts.sansBold, color: cfg.color }}
                            >
                              {topic.accuracy}%
                            </Text>
                            <View
                              style={{
                                width: '100%',
                                height: 5,
                                borderRadius: 999,
                                backgroundColor: 'rgba(255,255,255,0.32)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.16)',
                                overflow: 'hidden',
                              }}
                            >
                              <View
                                style={{
                                  width: `${topic.accuracy ?? 0}%` as any,
                                  height: '100%',
                                  borderRadius: 999,
                                  backgroundColor: cfg.color,
                                }}
                              />
                            </View>
                          </View>
                        )}
                        <View style={{ flexShrink: 0, justifyContent: 'center' }}>
                          <ChevronRight size={18} color={colors.text.muted} />
                        </View>
                      </View>
                    )}
                  </Pressable>
                </StaggerItem>
              )
            })}
          </View>
        </FadeInSection>
      )}
    </View>
  )
}

/* ─── Trilha do Broto (mobile) ───────────────── */

function StudyTrailVerticalMobile({
  activeTab,
  completed,
  areaColor,
  onSelectTab,
}: {
  activeTab: Tab
  completed: Record<Tab, boolean>
  areaColor: string
  onSelectTab: (t: Tab) => void
}) {
  return (
    <View style={{ gap: 8, marginBottom: 18 }}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.sansSemiBold,
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Caminho
      </Text>
      {STUDY_JOURNEY_STAGES.map((stage) => {
        const active = activeTab === stage.tab
        const done = completed[stage.tab]
        return (
          <Pressable key={stage.tab} onPress={() => onSelectTab(stage.tab)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? areaColor : colors.border.default,
                backgroundColor: active ? areaColor + '12' : colors.bg.card,
              }}
            >
              <View style={{ width: 28, alignItems: 'center' }}>
                {done ? (
                  <CheckCircle2 size={17} color={colors.green[400]} />
                ) : (
                  <Text style={{ color: colors.text.muted, fontSize: 14 }}>○</Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.sansBold, color: colors.text.primary }}>
                  {stage.title}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: colors.text.secondary }}>
                  {stage.oneLiner}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.text.muted} />
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

/* ─── Summary ──────────────────────────────── */

function SummaryTab({
  summary,
  areaColor,
  onDone,
}: {
  summary: StudyPackage['summary']
  areaColor: string
  onDone: () => void
}) {
  return (
    <FadeInSection delay={0}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 18, fontFamily: fonts.sansBold, color: colors.text.primary }}>
          {summary.title}
        </Text>
        <View
          style={{
            padding: 18,
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.10)',
            borderWidth: 1,
            borderColor: colors.border.default,
          }}
        >
          {summary.content.split('\n\n').map((p, i) => {
            if (p.startsWith('### '))
              return (
                <Text
                  key={i}
                  style={{
                    fontSize: 15,
                    fontFamily: fonts.sansBold,
                    color: colors.text.primary,
                    marginTop: 14,
                    marginBottom: 6,
                  }}
                >
                  {p.replace('### ', '')}
                </Text>
              )
            if (p.startsWith('- '))
              return (
                <View key={i} style={{ gap: 4, marginVertical: 4 }}>
                  {p.split('\n').map((line, j) => (
                    <Text
                      key={j}
                      style={{
                        fontSize: 14,
                        fontFamily: fonts.sans,
                        color: colors.text.secondary,
                        lineHeight: 22,
                        paddingLeft: 8,
                      }}
                    >
                      {'•  '}
                      {line.replace(/^- /, '').replace(/\*\*/g, '')}
                    </Text>
                  ))}
                </View>
              )
            return (
              <Text
                key={i}
                style={{
                  fontSize: 14,
                  fontFamily: fonts.sans,
                  color: colors.text.secondary,
                  lineHeight: 22,
                  marginVertical: 4,
                }}
              >
                {p.replace(/\*\*/g, '')}
              </Text>
            )
          })}
        </View>

        {/* Key points */}
        <View
          style={{
            padding: 16,
            borderRadius: 14,
            backgroundColor: areaColor + '10',
            borderWidth: 1,
            borderColor: areaColor + '20',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sansBold,
              color: areaColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Pontos-chave
          </Text>
          {summary.keyPoints.map((pt, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}
            >
              <CheckCircle2 size={14} color={areaColor} style={{ marginTop: 3 }} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontFamily: fonts.sans,
                  color: colors.text.primary,
                  lineHeight: 20,
                }}
              >
                {pt}
              </Text>
            </View>
          ))}
        </View>

        <BrotoCtaButton
          compact
          title="CONCLUIR LEITURA E SEGUIR"
          onPress={onDone}
          rightIcon={<ArrowRight size={16} color={colors.cta.text} />}
        />
      </View>
    </FadeInSection>
  )
}

/* ─── Flashcard Deck ───────────────────────── */

function FlashcardsTab({
  cards,
  areaColor,
  onDone,
}: {
  cards: StudyFlashcard[]
  areaColor: string
  onDone: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const card = cards[idx]
  const isLast = idx === cards.length - 1
  const allDone = reviewed.size === cards.length
  const DIFF: Record<string, { color: string; label: string }> = {
    easy: { color: colors.green[400], label: 'Facil' },
    medium: { color: colors.gold[400], label: 'Medio' },
    hard: { color: colors.red[400], label: 'Dificil' },
  }

  function next() {
    setReviewed((p) => new Set(p).add(idx))
    if (!isLast) {
      setFlipped(false)
      setIdx((i) => i + 1)
    }
  }

  return (
    <FadeInSection delay={0}>
      <View style={{ gap: 14 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text
            style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.text.secondary }}
          >
            Card {idx + 1} de {cards.length}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: DIFF[card.difficulty].color + '18',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansSemiBold,
                color: DIFF[card.difficulty].color,
              }}
            >
              {DIFF[card.difficulty].label}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setFlipped(!flipped)}
          style={{
            minHeight: 200,
            padding: 28,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: flipped ? areaColor + '44' : colors.border.default,
            backgroundColor: flipped ? areaColor + '08' : 'rgba(0,0,0,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sansSemiBold,
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 1,
              position: 'absolute',
              top: 14,
            }}
          >
            {flipped ? 'Resposta' : 'Pergunta'}
          </Text>
          <Text
            style={{
              fontSize: flipped ? 14 : 16,
              fontFamily: flipped ? fonts.sans : fonts.sansSemiBold,
              color: flipped ? colors.text.secondary : colors.text.primary,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            {flipped ? card.back : card.front}
          </Text>
          {!flipped && (
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sans,
                color: colors.text.muted,
                position: 'absolute',
                bottom: 14,
              }}
            >
              Toque para ver a resposta
            </Text>
          )}
        </Pressable>

        {/* Nav */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            disabled={idx === 0}
            onPress={() => {
              setFlipped(false)
              setIdx((i) => i - 1)
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border.default,
              backgroundColor: 'rgba(0,0,0,0.10)',
              opacity: idx === 0 ? 0.4 : 1,
            }}
          >
            <ArrowLeft size={14} color={colors.text.secondary} />
            <Text
              style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.text.secondary }}
            >
              Anterior
            </Text>
          </Pressable>
          <Pressable
            onPress={next}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: areaColor + '44',
              backgroundColor: areaColor + '12',
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: areaColor }}>
              {isLast ? 'Finalizar' : 'Proximo'}
            </Text>
            <ArrowRight size={14} color={areaColor} />
          </Pressable>
        </View>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === idx ? 18 : 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: reviewed.has(i)
                  ? areaColor
                  : i === idx
                    ? areaColor + '88'
                    : colors.border.strong,
              }}
            />
          ))}
        </View>

        {allDone && (
          <BrotoCtaButton
            compact
            title="SEGUIR PARA APLICAR"
            onPress={onDone}
            rightIcon={<ArrowRight size={16} color={colors.cta.text} />}
          />
        )}
      </View>
    </FadeInSection>
  )
}

/* ─── Practice Questions ───────────────────── */

function QuestionsTab({
  questions,
  areaColor: _areaColor,
  onDone,
}: {
  questions: StudyPackage['practiceQuestions']
  areaColor: string
  onDone: (correct: number, total: number) => void
}) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const q = questions[idx]
  const correct = q.alternatives.find((a) => a.isCorrect)?.letter ?? ''
  const isLast = idx === questions.length - 1

  function handleSelect(letter: string) {
    if (answered) return
    setSelected(letter)
    setAnswered(true)
    setResults((p) => [...p, letter === correct])
  }

  function handleNext() {
    if (isLast) {
      onDone(results.filter(Boolean).length, results.length)
      return
    }
    setSelected(null)
    setAnswered(false)
    setIdx((i) => i + 1)
  }

  return (
    <FadeInSection delay={0}>
      <View style={{ gap: 12 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text
            style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.text.secondary }}
          >
            Questao {idx + 1} de {questions.length}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: colors.green.glow,
            }}
          >
            <Text
              style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.green[400] }}
            >
              {results.filter(Boolean).length}/{results.length}
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 18,
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.10)',
            borderWidth: 1,
            borderColor: colors.border.default,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansMedium,
              color: colors.text.primary,
              lineHeight: 22,
            }}
          >
            {q.question}
          </Text>
        </View>

        {q.alternatives.map((alt) => {
          const isSel = selected === alt.letter
          const isCorr = alt.isCorrect
          let bg: string = 'rgba(0,0,0,0.10)'
          let border: string = colors.border.default
          let textCol: string = colors.text.primary
          if (answered && isCorr) {
            bg = 'rgba(16,185,129,0.1)'
            border = colors.green[500]
            textCol = colors.green[400]
          } else if (answered && isSel) {
            bg = colors.red.glow
            border = colors.red[500]
            textCol = colors.red[400]
          } else if (isSel) {
            bg = colors.green.glow
            border = colors.green[500]
          }

          return (
            <Pressable
              key={alt.letter}
              onPress={() => handleSelect(alt.letter)}
              disabled={answered}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: bg,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: answered && isCorr ? colors.green[500] : 'rgba(16,185,129,0.1)',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sansBold,
                    color: answered && isCorr ? '#fff' : colors.green[400],
                  }}
                >
                  {alt.letter}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontFamily: fonts.sans, color: textCol }}>
                {alt.text}
              </Text>
              {answered && isCorr && <CheckCircle2 size={16} color={colors.green[400]} />}
              {answered && isSel && !isCorr && <XCircle size={16} color={colors.red[400]} />}
            </Pressable>
          )
        })}

        {answered && (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor:
                selected === correct ? 'rgba(16,185,129,0.06)' : 'rgba(224,82,82,0.06)',
              borderWidth: 1,
              borderColor: selected === correct ? 'rgba(16,185,129,0.15)' : 'rgba(224,82,82,0.15)',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sansBold,
                color: selected === correct ? colors.green[400] : colors.red[400],
                marginBottom: 4,
              }}
            >
              {selected === correct ? 'Correto!' : 'Incorreta'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fonts.sans,
                color: colors.text.secondary,
                lineHeight: 20,
              }}
            >
              {q.explanation}
            </Text>
          </View>
        )}

        {answered && (
          <BrotoCtaButton
            compact
            title={isLast ? 'VER RESULTADO' : 'PROXIMA QUESTAO'}
            onPress={handleNext}
            rightIcon={<ArrowRight size={16} color={colors.cta.text} />}
          />
        )}
      </View>
    </FadeInSection>
  )
}

/* ─── Mind Map ─────────────────────────────── */

function MindMapTab({
  mindMap,
  areaColor,
  onDone,
}: {
  mindMap: StudyPackage['mindMap']
  areaColor: string
  onDone: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))
  function toggle(id: string) {
    setExpanded((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function expandAll(node: MindMapNode): string[] {
    return [node.id, ...(node.children?.flatMap(expandAll) ?? [])]
  }

  function renderNode(node: MindMapNode, depth: number): React.ReactNode {
    const hasKids = !!node.children?.length
    const open = expanded.has(node.id)
    const isRoot = depth === 0
    return (
      <View key={node.id} style={{ marginLeft: depth > 0 ? 18 : 0 }}>
        <Pressable
          onPress={() => hasKids && toggle(node.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: isRoot ? 12 : 8,
            borderRadius: 12,
            marginBottom: 4,
            borderWidth: isRoot ? 1.5 : 1,
            borderColor: isRoot ? areaColor + '44' : colors.border.subtle,
            backgroundColor: isRoot ? areaColor + '10' : 'transparent',
          }}
        >
          {hasKids ? (
            open ? (
              <ChevronDown size={14} color={colors.text.muted} />
            ) : (
              <ChevronRight size={14} color={colors.text.muted} />
            )
          ) : (
            <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: areaColor }} />
          )}
          <Text
            style={{
              fontSize: isRoot ? 15 : 13,
              fontFamily: isRoot ? fonts.sansBold : depth === 1 ? fonts.sansSemiBold : fonts.sans,
              color: isRoot ? areaColor : colors.text.primary,
            }}
          >
            {node.label}
          </Text>
        </Pressable>
        {hasKids && open && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: areaColor + '22',
              marginLeft: 12,
              paddingLeft: 4,
            }}
          >
            {node.children!.map((c) => renderNode(c, depth + 1))}
          </View>
        )}
      </View>
    )
  }

  return (
    <FadeInSection delay={0}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Brain size={18} color={areaColor} />
          <Text style={{ fontSize: 16, fontFamily: fonts.sansBold, color: colors.text.primary }}>
            Mapa Mental: {mindMap.topic}
          </Text>
        </View>
        <View
          style={{
            padding: 18,
            borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.10)',
            borderWidth: 1,
            borderColor: colors.border.default,
          }}
        >
          {renderNode(mindMap.root, 0)}
        </View>
        <Pressable
          onPress={() => setExpanded(new Set(expandAll(mindMap.root)))}
          style={{
            alignItems: 'center',
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border.default,
            backgroundColor: 'rgba(0,0,0,0.10)',
          }}
        >
          <Text
            style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.text.secondary }}
          >
            Expandir tudo
          </Text>
        </Pressable>
        <BrotoCtaButton
          compact
          title="FECHAR TRILHA"
          onPress={onDone}
          rightIcon={<Trophy size={16} color={colors.cta.text} />}
        />
      </View>
    </FadeInSection>
  )
}

/* ─── Session Summary ──────────────────────── */

function SessionDone({
  pkg,
  correct,
  total,
  flashcards,
  areaColor,
  onBack,
  completed,
}: {
  pkg: StudyPackage
  correct: number
  total: number
  flashcards: number
  areaColor: string
  onBack: () => void
  completed: Record<Tab, boolean>
}) {
  const xp = 50 + correct * 10
  const trailHuman = STUDY_JOURNEY_STAGES.filter((s) => completed[s.tab])
    .map((s) => s.title)
    .join(' → ')
  const lastDoneTab = [...STUDY_JOURNEY_STAGES]
    .reverse()
    .find((s) => completed[s.tab])?.tab
  const brotoClose = lastDoneTab ? brotoCelebrateLine(lastDoneTab) : 'Orgulho do Broto: você chegou até aqui com calma.'
  return (
    <FadeInSection delay={0}>
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: areaColor + '15',
            borderWidth: 2,
            borderColor: areaColor + '44',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Trophy size={32} color={colors.gold[400]} />
        </View>
        <Text style={{ fontSize: 22, fontFamily: fonts.sansBold, color: colors.text.primary }}>
          Sessao concluida!
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sans,
            color: colors.text.secondary,
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 12,
          }}
        >
          Você completou a trilha de{' '}
          <Text style={{ fontFamily: fonts.sansSemiBold, color: areaColor }}>{pkg.topicoLabel}</Text>
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sans,
            color: colors.text.secondary,
            marginTop: 12,
            textAlign: 'center',
            lineHeight: 20,
            paddingHorizontal: 16,
          }}
        >
          {brotoClose}
        </Text>
        {trailHuman ? (
          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              fontFamily: fonts.sansSemiBold,
              color: colors.text.muted,
              textAlign: 'center',
            }}
          >
            Etapas: {trailHuman}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, width: '100%' }}>
          {[
            {
              label: 'XP',
              value: `+${xp}`,
              icon: <Zap size={16} color={colors.gold[400]} />,
              bg: colors.gold.glow,
            },
            {
              label: 'Quiz',
              value: `${correct}/${total}`,
              icon: <CheckCircle2 size={16} color={colors.green[400]} />,
              bg: colors.green.glow,
            },
            {
              label: 'Cards',
              value: `${flashcards}`,
              icon: <RotateCcw size={16} color={areaColor} />,
              bg: areaColor + '15',
            },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                backgroundColor: s.bg,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                gap: 6,
              }}
            >
              {s.icon}
              <Text
                style={{ fontSize: 20, fontFamily: fonts.sansBold, color: colors.text.primary }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: fonts.sansSemiBold,
                  color: colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <BrotoCtaButton
          compact
          style={{ marginTop: 24 }}
          title="ESTUDAR OUTRO TOPICO"
          onPress={onBack}
        />
      </View>
    </FadeInSection>
  )
}

/* ─── Main Screen ──────────────────────────── */

export default function StudyAreaScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<Step>('select')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [pkg, setPkg] = useState<StudyPackage | null>(null)
  const [completed, setCompleted] = useState<Record<Tab, boolean>>({
    summary: false,
    flashcards: false,
    questions: false,
    mindmap: false,
  })
  const [qResult, setQResult] = useState({ correct: 0, total: 0 })
  const [showDone, setShowDone] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [gentleStopOpen, setGentleStopOpen] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const stageAnchorY = useRef(0)

  const areaColor = pkg ? getAreaConfig(pkg.areaKey).color : colors.green[500]
  const areaLabel = pkg ? getAreaConfig(pkg.areaKey).label : ''

  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), [])

  async function handleStart(areaKey: string, topic: TopicOption) {
    setStep('loading')
    setActiveTab('summary')
    setCompleted({ summary: false, flashcards: false, questions: false, mindmap: false })
    setShowDone(false)
    setFocusMode(false)
    setGentleStopOpen(false)
    const data = await getMockStudyPackage(areaKey, topic.value)
    setPkg(data)
    setStep('study')
  }

  function markDone(tab: Tab) {
    setCompleted((p) => ({ ...p, [tab]: true }))
  }
  const goToTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab)
      scrollToTop()
    },
    [scrollToTop],
  )
  function handleBack() {
    setStep('select')
    setPkg(null)
    setShowDone(false)
    setFocusMode(false)
    setGentleStopOpen(false)
  }

  const estimateInput = useMemo(
    () => ({
      flashcardsLen: pkg?.flashcards.length ?? 0,
      practiceQuestionsLen: pkg?.practiceQuestions.length ?? 0,
      bankRowCount: null as number | null,
    }),
    [pkg],
  )

  const stickyAction = useMemo(
    () => computeStickyAction(activeTab, completed, estimateInput),
    [activeTab, completed, estimateInput],
  )

  const handleStickyPrimary = useCallback(() => {
    if (stickyAction.advanceTab) {
      goToTab(stickyAction.advanceTab)
    } else {
      const y = Math.max(0, stageAnchorY.current - 8)
      scrollRef.current?.scrollTo({ y, animated: true })
    }
  }, [stickyAction, goToTab])

  const doneCount = studyJourneyCompletedCount(completed)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#02140D' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: '#031A11',
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Pressable onPress={() => (step === 'select' ? router.back() : handleBack())} hitSlop={12}>
          <ArrowLeft size={20} color={colors.text.primary} />
        </Pressable>
        <GraduationCap size={18} color={colors.green[500]} />
        <Text
          style={{ flex: 1, fontSize: 16, fontFamily: fonts.sansBold, color: colors.text.primary }}
        >
          {step === 'select'
            ? 'Área de Estudo'
            : pkg
              ? `${areaLabel} · ${pkg.topicoLabel}`
              : 'Área de Estudo'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom:
              step === 'study' && pkg && !showDone ? 128 + insets.bottom : 40 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
        {step === 'select' && <AreaTopicSelector onStart={handleStart} />}

        {step === 'loading' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <ActivityIndicator size="large" color={colors.green[500]} />
            <Text
              style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.text.primary }}
            >
              Gerando pacote de estudo...
            </Text>
          </View>
        )}

        {step === 'study' && pkg && !showDone && (
          <>
            {!focusMode ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Pressable
                  onPress={() => setFocusMode(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border.default,
                  }}
                >
                  <Eye size={15} color={colors.text.secondary} />
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.text.secondary }}>
                    Modo foco
                  </Text>
                </Pressable>
                <Pressable onPress={() => setGentleStopOpen(true)} style={{ padding: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: fonts.sansSemiBold,
                      color: colors.text.muted,
                      textDecorationLine: 'underline',
                    }}
                  >
                    Parar com calma
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setFocusMode(false)}
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: areaColor + '44',
                }}
              >
                <EyeOff size={15} color={areaColor} />
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: areaColor }}>
                  Sair do modo foco
                </Text>
              </Pressable>
            )}

            {!focusMode && (
              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  Trilha do Broto · {areaLabel}
                </Text>
                <Text style={{ fontSize: 20, fontFamily: fonts.sansBold, color: colors.text.primary }}>
                  {pkg.topicoLabel}
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontFamily: fonts.sans,
                    color: colors.text.secondary,
                    lineHeight: 20,
                  }}
                >
                  Quatro passos leves — constância emocional, não pressa.
                </Text>
              </View>
            )}

            {!focusMode && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.text.secondary, marginBottom: 8 }}>
                  Trilha: {doneCount} de {STUDY_JOURNEY_STAGES.length} etapas
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {STUDY_JOURNEY_STAGES.map((s, i) => (
                    <View
                      key={s.tab}
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: i < doneCount ? areaColor : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {!focusMode && (
              <StudyTrailVerticalMobile
                activeTab={activeTab}
                completed={completed}
                areaColor={areaColor}
                onSelectTab={goToTab}
              />
            )}

            <View
              onLayout={(e) => {
                stageAnchorY.current = e.nativeEvent.layout.y
              }}
            >
              {activeTab === 'summary' && (
              <SummaryTab
                summary={pkg.summary}
                areaColor={areaColor}
                onDone={() => {
                  markDone('summary')
                  goToTab('flashcards')
                }}
              />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardsTab
                cards={pkg.flashcards}
                areaColor={areaColor}
                onDone={() => {
                  markDone('flashcards')
                  goToTab('questions')
                }}
              />
            )}
            {activeTab === 'questions' && (
              <QuestionsTab
                questions={pkg.practiceQuestions}
                areaColor={areaColor}
                onDone={(c, t) => {
                  markDone('questions')
                  setQResult({ correct: c, total: t })
                  goToTab('mindmap')
                }}
              />
            )}
            {activeTab === 'mindmap' && (
              <MindMapTab
                mindMap={pkg.mindMap}
                areaColor={areaColor}
                onDone={() => {
                  markDone('mindmap')
                  setShowDone(true)
                  scrollToTop()
                }}
              />
            )}
            </View>
          </>
        )}

        {step === 'study' && pkg && showDone && (
          <SessionDone
            pkg={pkg}
            correct={qResult.correct}
            total={qResult.total}
            flashcards={pkg.flashcards.length}
            areaColor={areaColor}
            onBack={handleBack}
            completed={completed}
          />
        )}
      </ScrollView>

        {step === 'study' && pkg && !showDone && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 6,
              backgroundColor: '#031A11',
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sansSemiBold,
                color: colors.text.primary,
                marginBottom: stickyAction.sub ? 2 : 8,
              }}
              numberOfLines={2}
            >
              {stickyAction.title}
            </Text>
            {stickyAction.sub ? (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sans,
                  color: colors.text.muted,
                  marginBottom: 8,
                  lineHeight: 16,
                }}
                numberOfLines={3}
              >
                {stickyAction.sub}
              </Text>
            ) : null}
            {focusMode ? (
              <Pressable
                onPress={() => setFocusMode(false)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: areaColor + '55',
                  backgroundColor: areaColor + '12',
                }}
              >
                <EyeOff size={17} color={areaColor} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: areaColor }}>
                  Sair do modo foco
                </Text>
              </Pressable>
            ) : null}
            <BrotoCtaButton
              compact
              title={stickyAction.buttonText.toUpperCase()}
              onPress={handleStickyPrimary}
              rightIcon={<ChevronRight size={16} color={colors.cta.text} />}
            />
          </View>
        )}
      </View>

      <Modal
        visible={gentleStopOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGentleStopOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            padding: 24,
          }}
          onPress={() => setGentleStopOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              borderRadius: 20,
              padding: 20,
              backgroundColor: colors.bg.card,
              borderWidth: 1,
              borderColor: colors.border.default,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: fonts.sansBold, color: colors.text.primary }}>
              Pausa com dignidade
            </Text>
            <Text style={{ marginTop: 12, fontSize: 14, color: colors.text.secondary, lineHeight: 22 }}>
              Parar também é treino. Nesta sessão: {studyJourneyCompletedCount(completed)} etapa(s). Quando voltar,
              eu te espero aqui.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <Pressable
                onPress={() => setGentleStopOpen(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.text.secondary }}>
                  Continuar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setGentleStopOpen(false)
                  handleBack()
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.sansBold,
                    color: colors.green[400],
                  }}
                >
                  Sair
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
