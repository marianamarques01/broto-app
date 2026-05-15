import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { View, Text, useWindowDimensions, Pressable } from 'react-native'
import RenderHtml from 'react-native-render-html'
import { CheckCircle, XCircle, ChevronRight, ChevronLeft } from 'lucide-react-native'
import { OptionButton, type OptionState } from './OptionButton'
import type { Question } from '@broto/shared'
import {
  getQuestionId,
  questionFieldMarkdownToHtml,
  questionFieldNeedsHtmlRendering,
} from '@broto/shared'
import { colors } from '@/theme/tokens'
import { BrotoCtaButton } from '@/components/BrotoCtaButton'

interface QuestionPlayerProps {
  question: Question
  questionNumber?: number
  totalQuestions?: number
  /** A questão passada é sempre a do enunciado exibido (evita fechar captura sobre estado do pai). */
  onAnswer: (question: Question, answer: string, isCorrect: boolean) => void
  onNext?: () => void
  onPrevious?: () => void
  previousDisabled?: boolean
}

export function QuestionPlayer({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  onPrevious,
  previousDisabled = false,
}: QuestionPlayerProps) {
  const { width } = useWindowDimensions()
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const answeringRef = useRef(false)

  const questionKey = getQuestionId(question)
  // Sincroniza estado local com nova questão (ano/índice/idioma); necessário se o pai não passar `key`.
  useEffect(() => {
    answeringRef.current = false
    /* eslint-disable react-hooks/set-state-in-effect -- reset intencional quando questionKey (ano/índice/idioma) muda */
    setSelected(null)
    setAnswered(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [questionKey])

  const handleSelect = useCallback(
    (letter: string) => {
      if (answered || answeringRef.current) return
      answeringRef.current = true
      const isCorrect = question.alternatives.find((a) => a.letter === letter)?.isCorrect ?? false
      setSelected(letter)
      setAnswered(true)
      onAnswer(question, letter, isCorrect)
    },
    [answered, question, onAnswer],
  )

  function getState(letter: string): OptionState {
    if (!answered) return 'idle'
    const isCorrect = question.alternatives.find((a) => a.letter === letter)?.isCorrect ?? false
    if (isCorrect) return 'correct'
    if (letter === selected) return 'wrong'
    return 'idle'
  }

  const isCorrect =
    answered && (question.alternatives.find((a) => a.letter === selected)?.isCorrect ?? false)
  const correctLetter = question.alternatives.find((a) => a.isCorrect)?.letter

  const contextHtml = useMemo(() => questionFieldMarkdownToHtml(question.context), [question.context])

  const htmlSource = useMemo(
    () => (contextHtml ? { html: contextHtml } : { html: '' }),
    [contextHtml],
  )

  const titleHtml = useMemo(() => questionFieldMarkdownToHtml(question.title), [question.title])
  const titleAsHtml = titleHtml != null && questionFieldNeedsHtmlRendering(titleHtml)
  const titleHtmlSource = useMemo(
    () => (titleAsHtml && titleHtml ? { html: titleHtml } : { html: '' }),
    [titleAsHtml, titleHtml],
  )
  const renderHtmlBaseStyle = useMemo(
    () => ({
      color: colors.text.primary,
      fontSize: 14,
      lineHeight: 22,
    }),
    [],
  )
  const renderHtmlTagsStyles = useMemo(
    () => ({
      img: { marginVertical: 8, borderRadius: 8 },
    }),
    [],
  )

  return (
    <View className="gap-4 p-4 pb-8">
      {/* Progress bar */}
      {totalQuestions != null && questionNumber != null && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs" style={{ color: colors.text.muted }}>
              Questao {questionNumber} de {totalQuestions}
            </Text>
            <Text className="text-xs" style={{ color: colors.text.muted }}>
              {question.discipline ? `${question.discipline} · ` : ''}
              ENEM {question.year}
            </Text>
          </View>
          <View
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: colors.bg.surface }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${((questionNumber - 1) / totalQuestions) * 100}%`,
                backgroundColor: colors.green[500],
              }}
            />
          </View>
        </View>
      )}

      {/* Statement */}
      <View
        className="rounded-2xl border p-4"
        style={{
          borderColor: colors.border.default,
          backgroundColor: colors.bg.card,
        }}
      >
        {titleAsHtml ? (
          <RenderHtml
            contentWidth={width - 64}
            source={titleHtmlSource}
            baseStyle={{
              color: colors.text.primary,
              fontSize: 14,
              lineHeight: 22,
              fontWeight: '600',
            }}
            tagsStyles={renderHtmlTagsStyles}
          />
        ) : (
          <Text
            className="text-sm font-semibold leading-relaxed"
            style={{ color: colors.text.primary }}
          >
            {question.title}
          </Text>
        )}
        {contextHtml && (
          <View className="mt-3">
            <RenderHtml
              contentWidth={width - 64}
              source={htmlSource}
              baseStyle={renderHtmlBaseStyle}
              tagsStyles={renderHtmlTagsStyles}
            />
          </View>
        )}
      </View>

      {/* Alternatives */}
      <View className="gap-2.5">
        {question.alternatives.map((alt) => (
          <OptionButton
            key={alt.letter}
            letter={alt.letter}
            text={alt.text}
            state={getState(alt.letter)}
            answered={answered}
            onPress={() => handleSelect(alt.letter)}
          />
        ))}
      </View>

      {/* Feedback */}
      {answered && (
        <View
          className="flex-row items-start gap-3 rounded-2xl border p-4"
          style={{
            backgroundColor: isCorrect ? 'rgba(34,197,94,0.08)' : colors.red.glow,
            borderColor: isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          }}
        >
          {isCorrect ? (
            <CheckCircle size={20} color={colors.green[500]} style={{ marginTop: 2 }} />
          ) : (
            <XCircle size={20} color={colors.red[500]} style={{ marginTop: 2 }} />
          )}
          <View>
            <Text
              className="text-sm font-semibold"
              style={{
                color: isCorrect ? colors.green[500] : colors.red[500],
              }}
            >
              {isCorrect ? 'Resposta correta! 🎉' : 'Resposta incorreta'}
            </Text>
            {!isCorrect && correctLetter && (
              <Text className="mt-0.5 text-xs" style={{ color: colors.text.muted }}>
                A alternativa correta e a{' '}
                <Text className="font-bold" style={{ color: colors.green[500] }}>
                  {correctLetter}
                </Text>
                .
              </Text>
            )}
          </View>
        </View>
      )}

      {(onPrevious != null || (answered && onNext)) && (
        <View className="flex-row gap-2">
          {onPrevious != null && (
            <Pressable
              onPress={onPrevious}
              disabled={previousDisabled}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-2xl border-2 py-3.5 px-3"
              style={{
                borderColor: colors.border.default,
                backgroundColor: colors.bg.surface,
                opacity: previousDisabled ? 0.45 : 1,
              }}
            >
              <ChevronLeft size={18} color={colors.text.secondary} />
              <Text className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                Anterior
              </Text>
            </Pressable>
          )}
          {answered && onNext && (
            <View style={{ flex: onPrevious != null ? 1 : undefined, alignSelf: 'stretch', flexGrow: 1 }}>
              <BrotoCtaButton
                compact
                title="Próxima questão"
                onPress={onNext}
                rightIcon={<ChevronRight size={18} color={colors.cta.text} />}
              />
            </View>
          )}
        </View>
      )}

      {answered && !onNext && (
        <View
          className="rounded-2xl border p-4"
          style={{
            borderColor: colors.border.default,
            backgroundColor: colors.green.glow,
          }}
        >
          <Text
            className="text-center text-sm font-semibold"
            style={{ color: colors.text.primary }}
          >
            Sessao concluida! 🌱
          </Text>
          <Text className="mt-1 text-center text-xs" style={{ color: colors.text.muted }}>
            Voce chegou ao fim das questoes filtradas.
          </Text>
        </View>
      )}
    </View>
  )
}
