import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { OptionButton, type OptionState } from './OptionButton';
import type { Question } from '@/lib/types/questions';
import { colors } from '@/theme/tokens';

interface QuestionPlayerProps {
    question: Question;
    questionNumber?: number;
    totalQuestions?: number;
    onAnswer: (answer: string, isCorrect: boolean) => void;
    onNext?: () => void;
}

export function QuestionPlayer({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    onNext,
}: QuestionPlayerProps) {
    const { width } = useWindowDimensions();
    const [selected, setSelected] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);

    useEffect(() => {
        setSelected(null);
        setAnswered(false);
    }, [question.year, question.index]);

    const handleSelect = useCallback((letter: string) => {
        if (answered) return;
        const isCorrect =
            question.alternatives.find(a => a.letter === letter)?.isCorrect ??
            false;
        setSelected(letter);
        setAnswered(true);
        onAnswer(letter, isCorrect);
    }, [answered, question.alternatives, onAnswer]);

    function getState(letter: string): OptionState {
        if (!answered) return 'idle';
        const isCorrect =
            question.alternatives.find(a => a.letter === letter)?.isCorrect ??
            false;
        if (isCorrect) return 'correct';
        if (letter === selected) return 'wrong';
        return 'idle';
    }

    const isCorrect =
        answered &&
        (question.alternatives.find(a => a.letter === selected)?.isCorrect ??
            false);
    const correctLetter = question.alternatives.find(a => a.isCorrect)?.letter;

    const contextHtml = useMemo(() => {
        if (!question.context) return null;
        return question.context
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
            .replace(/\n/g, '<br />');
    }, [question.context]);

    const htmlSource = useMemo(
        () => contextHtml ? { html: contextHtml } : { html: '' },
        [contextHtml],
    );
    const renderHtmlBaseStyle = useMemo(() => ({
        color: colors.text.primary,
        fontSize: 14,
        lineHeight: 22,
    }), []);
    const renderHtmlTagsStyles = useMemo(() => ({
        img: { marginVertical: 8, borderRadius: 8 },
    }), []);

    return (
        <View className="gap-4 p-4 pb-8">
            {/* Progress bar */}
            {totalQuestions != null && questionNumber != null && (
                <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">
                            Questao {questionNumber} de {totalQuestions}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                            {question.discipline
                                ? `${question.discipline} · `
                                : ''}
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
                <Text className="text-sm font-semibold leading-relaxed text-foreground">
                    {question.title}
                </Text>
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
                {question.alternatives.map(alt => (
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
                        backgroundColor: isCorrect
                            ? 'rgba(34,197,94,0.08)'
                            : colors.red.glow,
                        borderColor: isCorrect
                            ? 'rgba(34,197,94,0.2)'
                            : 'rgba(239,68,68,0.2)',
                    }}
                >
                    {isCorrect ? (
                        <CheckCircle
                            size={20}
                            color={colors.green[500]}
                            style={{ marginTop: 2 }}
                        />
                    ) : (
                        <XCircle
                            size={20}
                            color={colors.red[500]}
                            style={{ marginTop: 2 }}
                        />
                    )}
                    <View>
                        <Text
                            className="text-sm font-semibold"
                            style={{
                                color: isCorrect
                                    ? colors.green[500]
                                    : colors.red[500],
                            }}
                        >
                            {isCorrect
                                ? 'Resposta correta! 🎉'
                                : 'Resposta incorreta'}
                        </Text>
                        {!isCorrect && correctLetter && (
                            <Text className="mt-0.5 text-xs text-muted-foreground">
                                A alternativa correta e a{' '}
                                <Text
                                    className="font-bold"
                                    style={{ color: colors.green[500] }}
                                >
                                    {correctLetter}
                                </Text>
                                .
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Next */}
            {answered && onNext && (
                <Pressable
                    onPress={onNext}
                    className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-4"
                    style={{ backgroundColor: colors.green[600] }}
                >
                    <Text className="text-sm font-bold text-white">
                        Próxima questão
                    </Text>
                    <ChevronRight size={18} color="#fff" />
                </Pressable>
            )}

            {answered && !onNext && (
                <View
                    className="rounded-2xl border p-4"
                    style={{
                        borderColor: colors.border.default,
                        backgroundColor: colors.green.glow,
                    }}
                >
                    <Text className="text-center text-sm font-semibold text-foreground">
                        Sessao concluida! 🌱
                    </Text>
                    <Text className="mt-1 text-center text-xs text-muted-foreground">
                        Voce chegou ao fim das questoes filtradas.
                    </Text>
                </View>
            )}
        </View>
    );
}
