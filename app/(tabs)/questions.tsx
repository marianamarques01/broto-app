import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlidersHorizontal, RotateCcw, X } from 'lucide-react-native';
import {
    useQuestionsFilters,
    LANGUAGE_OPTIONS,
} from '@/hooks/use-questions-filters';
import { QuestionPlayer } from '@/components/questions/QuestionPlayer';
import { submitAnswer } from '@/lib/api/answer-question';
import type { Question } from '@/lib/types/questions';
import { getQuestionId } from '@/lib/types/questions';
import { colors } from '@/theme/tokens';

function FilterPicker({
    label,
    value,
    options,
    onSelect,
    disabled,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (v: string) => void;
    disabled?: boolean;
}) {
    const safeOptions = Array.isArray(options) ? options : [];
    return (
        <View className="mb-3">
            <Text className="mb-1 text-xs font-semibold text-muted-foreground">
                {label}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                    {safeOptions.map(opt => {
                        const isSelected = opt.value === value;
                        return (
                            <Pressable
                                key={opt.value || '_all'}
                                onPress={() => onSelect(opt.value)}
                                disabled={disabled}
                                className="rounded-lg px-3 py-2"
                                style={{
                                    backgroundColor: isSelected
                                        ? colors.green[600]
                                        : colors.bg.surface,
                                    opacity: disabled ? 0.5 : 1,
                                }}
                            >
                                <Text
                                    className="text-xs font-semibold"
                                    style={{
                                        color: isSelected
                                            ? '#fff'
                                            : colors.text.secondary,
                                    }}
                                >
                                    {opt.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

export default function QuestionsScreen() {
    const {
        areas,
        topicos,
        exams,
        questions,
        loading,
        loadingQuestions,
        error,
        selectedArea,
        selectedYear,
        selectedTopico,
        selectedLanguage,
        setSelectedArea,
        setSelectedYear,
        setSelectedTopico,
        setSelectedLanguage,
        retry,
        isLinguagensArea,
        isLanguageFilterEnabled,
    } = useQuestionsFilters();

    const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [scores, setScores] = useState({ correct: 0, total: 0 });
    const [showFilters, setShowFilters] = useState(false);

    function startSession() {
        if (questions.length === 0) return;
        setActiveQuestion(questions[0]);
        setQuestionIdx(0);
        setScores({ correct: 0, total: 0 });
    }

    function handleAnswer(_answer: string, isCorrect: boolean) {
        setScores(s => ({
            correct: s.correct + (isCorrect ? 1 : 0),
            total: s.total + 1,
        }));
        const questionId = getQuestionId(activeQuestion!);
        submitAnswer({ questionId, isCorrect }).catch(() => {});
    }

    function handleNext() {
        const nextIdx = questionIdx + 1;
        if (nextIdx < questions.length) {
            setActiveQuestion(questions[nextIdx]);
            setQuestionIdx(nextIdx);
        } else {
            setActiveQuestion(null);
        }
    }

    const hasActiveFilters = !!(selectedArea || selectedYear || selectedTopico);

    if (activeQuestion) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View
                    className="flex-row items-center justify-between border-b px-4 py-3"
                    style={{
                        borderBottomColor: colors.border.default,
                        backgroundColor: colors.bg.deep,
                    }}
                >
                    <Pressable
                        onPress={() => setActiveQuestion(null)}
                        className="flex-row items-center gap-1.5"
                    >
                        <X size={18} color={colors.text.muted} />
                        <Text className="text-sm text-muted-foreground">
                            Encerrar
                        </Text>
                    </Pressable>
                    <Text className="text-sm font-semibold text-foreground">
                        {scores.correct}/{scores.total} corretas
                    </Text>
                </View>
                <ScrollView>
                    <QuestionPlayer
                        question={activeQuestion}
                        questionNumber={questionIdx + 1}
                        totalQuestions={questions.length}
                        onAnswer={handleAnswer}
                        onNext={
                            questionIdx < questions.length - 1
                                ? handleNext
                                : undefined
                        }
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View
                className="flex-row items-center justify-between border-b px-4 py-3"
                style={{
                    borderBottomColor: colors.border.default,
                    backgroundColor: colors.bg.deep,
                }}
            >
                <Text className="text-base font-bold text-foreground">
                    Questoes ENEM
                </Text>
                <Pressable
                    onPress={() => setShowFilters(v => !v)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{
                        backgroundColor: hasActiveFilters
                            ? colors.green[600]
                            : colors.bg.surface,
                    }}
                >
                    <SlidersHorizontal
                        size={14}
                        color={hasActiveFilters ? '#fff' : colors.text.muted}
                    />
                    <Text
                        className="text-xs font-semibold"
                        style={{
                            color: hasActiveFilters
                                ? '#fff'
                                : colors.text.muted,
                        }}
                    >
                        Filtros
                    </Text>
                </Pressable>
            </View>

            {/* Filters */}
            {showFilters && (
                <View
                    className="border-b px-4 py-4"
                    style={{
                        borderBottomColor: colors.border.default,
                        backgroundColor: colors.bg.card,
                    }}
                >
                    <FilterPicker
                        label="Materia"
                        value={selectedArea}
                        options={[
                            { value: '', label: 'Todas' },
                            ...(Array.isArray(areas) ? areas : []).map(a => ({
                                value: a.value,
                                label: a.label,
                            })),
                        ]}
                        onSelect={setSelectedArea}
                        disabled={loading}
                    />
                    <FilterPicker
                        label="Ano"
                        value={selectedYear}
                        options={[
                            { value: '', label: 'Todos' },
                            ...(Array.isArray(exams) ? exams : []).map(e => ({
                                value: String(e.year),
                                label: String(e.year),
                            })),
                        ]}
                        onSelect={setSelectedYear}
                        disabled={loading}
                    />
                    {selectedArea && (
                        <FilterPicker
                            label="Topico"
                            value={selectedTopico}
                            options={[
                                { value: '', label: 'Todos' },
                                ...(Array.isArray(topicos) ? topicos : []).map(t => ({
                                    value: t.id,
                                    label: t.label,
                                })),
                            ]}
                            onSelect={setSelectedTopico}
                            disabled={loading}
                        />
                    )}
                    {isLinguagensArea && (
                        <FilterPicker
                            label="Idioma"
                            value={selectedLanguage}
                            options={LANGUAGE_OPTIONS.map(o => ({
                                value: o.value,
                                label: o.label,
                            }))}
                            onSelect={setSelectedLanguage}
                            disabled={!isLanguageFilterEnabled || loading}
                        />
                    )}
                    {hasActiveFilters && (
                        <Pressable
                            onPress={() => {
                                setSelectedArea('');
                                setSelectedYear('');
                                setSelectedTopico('');
                                setSelectedLanguage('');
                            }}
                            className="flex-row items-center gap-1.5"
                        >
                            <RotateCcw size={12} color={colors.text.muted} />
                            <Text className="text-xs text-muted-foreground">
                                Limpar filtros
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            <ScrollView className="flex-1 px-4 py-5">
                {error && (
                    <View
                        className="mb-4 flex-row items-center justify-between gap-3 rounded-xl px-4 py-3"
                        style={{
                            backgroundColor: colors.red.glow,
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.2)',
                        }}
                    >
                        <Text className="text-sm text-danger">{error}</Text>
                        <Pressable onPress={retry}>
                            <Text className="text-xs font-medium text-danger underline">
                                Tentar novamente
                            </Text>
                        </Pressable>
                    </View>
                )}

                {loading && (
                    <View className="items-center py-20">
                        <ActivityIndicator
                            size="large"
                            color={colors.green[500]}
                        />
                    </View>
                )}

                {!loading && !selectedArea && (
                    <View className="items-center py-20">
                        <View
                            className="h-20 w-20 items-center justify-center rounded-2xl"
                            style={{
                                backgroundColor: colors.green.glow,
                                borderWidth: 1,
                                borderColor: colors.border.default,
                            }}
                        >
                            <Text className="text-4xl">🎯</Text>
                        </View>
                        <Text className="mt-5 text-base font-bold text-foreground">
                            Escolha uma materia
                        </Text>
                        <Text className="mt-1.5 text-center text-sm text-muted-foreground">
                            Use os filtros para buscar questoes do banco ENEM
                            2009-2023.
                        </Text>
                        <Pressable
                            onPress={() => setShowFilters(true)}
                            className="mt-5 rounded-xl px-5 py-2.5"
                            style={{ backgroundColor: colors.green[600] }}
                        >
                            <Text className="text-sm font-bold text-white">
                                Abrir filtros
                            </Text>
                        </Pressable>
                    </View>
                )}

                {!loading && selectedArea && loadingQuestions && (
                    <View className="items-center py-20">
                        <ActivityIndicator
                            size="large"
                            color={colors.green[500]}
                        />
                    </View>
                )}

                {!loading &&
                    selectedArea &&
                    !loadingQuestions &&
                    questions.length === 0 && (
                        <View className="items-center py-20">
                            <View
                                className="h-20 w-20 items-center justify-center rounded-2xl"
                                style={{
                                    backgroundColor: colors.green.glow,
                                    borderWidth: 1,
                                    borderColor: colors.border.default,
                                }}
                            >
                                <Text className="text-4xl">🔍</Text>
                            </View>
                            <Text className="mt-5 text-base font-bold text-foreground">
                                Nenhuma questao encontrada
                            </Text>
                            <Text className="mt-1.5 text-sm text-muted-foreground">
                                Tente ajustar os filtros.
                            </Text>
                        </View>
                    )}

                {!loading && !loadingQuestions && questions.length > 0 && (
                    <View>
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-sm text-muted-foreground">
                                <Text className="font-semibold text-foreground">
                                    {questions.length}
                                </Text>{' '}
                                questoes encontradas
                            </Text>
                            <Pressable
                                onPress={startSession}
                                className="rounded-xl px-4 py-2"
                                style={{
                                    backgroundColor: colors.green[600],
                                }}
                            >
                                <Text className="text-sm font-bold text-white">
                                    Iniciar treino
                                </Text>
                            </Pressable>
                        </View>

                        <View className="gap-2.5">
                            {(Array.isArray(questions) ? questions : []).map((q, idx) => (
                                <Pressable
                                    key={`${q.year}-${q.index}`}
                                    onPress={() => {
                                        setActiveQuestion(q);
                                        setQuestionIdx(idx);
                                        setScores({ correct: 0, total: 0 });
                                    }}
                                    className="rounded-2xl border p-4"
                                    style={{
                                        borderColor: colors.border.default,
                                        backgroundColor: colors.bg.card,
                                    }}
                                >
                                    <Text
                                        className="text-sm font-medium text-foreground"
                                        numberOfLines={2}
                                    >
                                        {q.title}
                                    </Text>
                                    <Text className="mt-1.5 text-xs text-muted-foreground">
                                        ENEM {q.year} · Questao {q.index}
                                        {q.discipline &&
                                            ` · ${q.discipline}`}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
