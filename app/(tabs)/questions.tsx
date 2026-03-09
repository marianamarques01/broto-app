import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    SlidersHorizontal,
    RotateCcw,
    X,
    Search,
    BookOpen,
    Sparkles,
    ChevronRight,
    AlertCircle,
} from 'lucide-react-native';
import {
    useQuestionsFilters,
    LANGUAGE_OPTIONS,
} from '@/hooks/use-questions-filters';
import { QuestionPlayer } from '@/components/questions/QuestionPlayer';
import { submitAnswer } from '@/lib/api/answer-question';
import type { Question } from '@/lib/types/questions';
import { getQuestionId } from '@/lib/types/questions';
import { colors, fonts } from '@/theme/tokens';

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
            <Text
                style={{
                    fontSize: 11,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 6,
                }}
            >
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
                                className="rounded-lg px-3.5 py-2"
                                style={{
                                    backgroundColor: isSelected
                                        ? colors.green[600]
                                        : colors.bg.elevated,
                                    opacity: disabled ? 0.5 : 1,
                                    borderWidth: 1,
                                    borderColor: isSelected
                                        ? colors.green[500]
                                        : colors.border.subtle,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontFamily: fonts.sansSemiBold,
                                        color: isSelected ? '#fff' : colors.text.secondary,
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

    // ——— Active question player ———
    if (activeQuestion) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
                <View
                    className="flex-row items-center justify-between px-5 py-3"
                    style={{ backgroundColor: colors.bg.deep }}
                >
                    <Pressable
                        onPress={() => setActiveQuestion(null)}
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                        }}
                    >
                        <X size={14} color={colors.text.muted} />
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.secondary,
                            }}
                        >
                            Encerrar
                        </Text>
                    </Pressable>
                    <View
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{
                            backgroundColor: colors.green.glow,
                            borderWidth: 1,
                            borderColor: 'rgba(16,185,129,0.15)',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.sansBold,
                                color: colors.green[400],
                            }}
                        >
                            {scores.correct}/{scores.total} corretas
                        </Text>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
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

    // ——— Main list view ———
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.void }}>
            {/* Header */}
            <View
                className="flex-row items-center justify-between px-5 py-3"
                style={{ backgroundColor: colors.bg.deep }}
            >
                <View className="flex-row items-center gap-2">
                    <BookOpen size={18} color={colors.green[500]} />
                    <Text
                        style={{
                            fontSize: 17,
                            fontFamily: fonts.sansBold,
                            color: colors.text.primary,
                        }}
                    >
                        Questoes ENEM
                    </Text>
                </View>
                <Pressable
                    onPress={() => setShowFilters(v => !v)}
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{
                        backgroundColor: hasActiveFilters
                            ? colors.green[600]
                            : colors.bg.card,
                        borderWidth: 1,
                        borderColor: hasActiveFilters
                            ? colors.green[500]
                            : colors.border.subtle,
                    }}
                >
                    <SlidersHorizontal
                        size={14}
                        color={hasActiveFilters ? '#fff' : colors.text.muted}
                    />
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: fonts.sansSemiBold,
                            color: hasActiveFilters ? '#fff' : colors.text.secondary,
                        }}
                    >
                        Filtros
                    </Text>
                </Pressable>
            </View>

            {/* Filters panel */}
            {showFilters && (
                <View
                    className="px-4 py-4"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border.subtle,
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
                            className="flex-row items-center gap-1.5 mt-1"
                        >
                            <RotateCcw size={12} color={colors.text.muted} />
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                }}
                            >
                                Limpar filtros
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Error */}
                {error && (
                    <View
                        className="mb-4 flex-row items-center justify-between gap-3 rounded-xl px-4 py-3"
                        style={{
                            backgroundColor: colors.red.glow,
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.15)',
                        }}
                    >
                        <View className="flex-row items-center gap-2 flex-1">
                            <AlertCircle size={16} color={colors.red[500]} />
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: fonts.sans,
                                    color: colors.red[400],
                                    flex: 1,
                                }}
                            >
                                {error}
                            </Text>
                        </View>
                        <Pressable onPress={retry}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sansSemiBold,
                                    color: colors.red[400],
                                    textDecorationLine: 'underline',
                                }}
                            >
                                Tentar novamente
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Loading */}
                {loading && (
                    <View className="items-center py-20">
                        <ActivityIndicator size="large" color={colors.green[500]} />
                    </View>
                )}

                {/* Empty — no area selected */}
                {!loading && !selectedArea && (
                    <View className="items-center py-16">
                        <View
                            className="h-20 w-20 items-center justify-center rounded-3xl"
                            style={{
                                backgroundColor: colors.green.glow,
                                borderWidth: 1,
                                borderColor: colors.border.default,
                            }}
                        >
                            <Search size={36} color={colors.green[500]} />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                                marginTop: 20,
                            }}
                        >
                            Escolha uma materia
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sans,
                                color: colors.text.muted,
                                marginTop: 6,
                                textAlign: 'center',
                                lineHeight: 20,
                                maxWidth: 260,
                            }}
                        >
                            Use os filtros para buscar questoes do banco ENEM 2009-2023.
                        </Text>
                        <Pressable
                            onPress={() => setShowFilters(true)}
                            className="mt-5 flex-row items-center gap-2 rounded-xl px-5 py-2.5"
                            style={{ backgroundColor: colors.green[600] }}
                        >
                            <SlidersHorizontal size={14} color="#fff" />
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: fonts.sansBold,
                                    color: '#fff',
                                }}
                            >
                                Abrir filtros
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Loading questions */}
                {!loading && selectedArea && loadingQuestions && (
                    <View className="items-center py-20">
                        <ActivityIndicator size="large" color={colors.green[500]} />
                    </View>
                )}

                {/* No results */}
                {!loading && selectedArea && !loadingQuestions && questions.length === 0 && (
                    <View className="items-center py-16">
                        <View
                            className="h-20 w-20 items-center justify-center rounded-3xl"
                            style={{
                                backgroundColor: colors.bg.card,
                                borderWidth: 1,
                                borderColor: colors.border.default,
                            }}
                        >
                            <Search size={36} color={colors.text.muted} />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                                marginTop: 20,
                            }}
                        >
                            Nenhuma questao encontrada
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sans,
                                color: colors.text.muted,
                                marginTop: 6,
                            }}
                        >
                            Tente ajustar os filtros.
                        </Text>
                    </View>
                )}

                {/* Question list */}
                {!loading && !loadingQuestions && questions.length > 0 && (
                    <View>
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: fonts.sansBold,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {questions.length}
                                </Text>{' '}
                                questoes encontradas
                            </Text>
                            <Pressable
                                onPress={startSession}
                                className="flex-row items-center gap-1.5 rounded-xl px-4 py-2"
                                style={{ backgroundColor: colors.green[600] }}
                            >
                                <Sparkles size={14} color="#fff" />
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: fonts.sansBold,
                                        color: '#fff',
                                    }}
                                >
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
                                    className="flex-row items-center gap-3 rounded-2xl p-4"
                                    style={{
                                        backgroundColor: colors.bg.card,
                                        borderWidth: 1,
                                        borderColor: colors.border.subtle,
                                    }}
                                >
                                    <View className="flex-1">
                                        <Text
                                            numberOfLines={2}
                                            style={{
                                                fontSize: 14,
                                                fontFamily: fonts.sansMedium,
                                                color: colors.text.primary,
                                            }}
                                        >
                                            {q.title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontFamily: fonts.sans,
                                                color: colors.text.muted,
                                                marginTop: 4,
                                            }}
                                        >
                                            ENEM {q.year} · Questao {q.index}
                                            {q.discipline && ` · ${q.discipline}`}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color={colors.text.muted} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
