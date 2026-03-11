import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import {
    X,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    AlertCircle,
    BookOpen,
    Calculator,
    FlaskConical,
    Globe2,
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
import { FadeInSection, StaggerItem } from '@/components/AnimatedEntry';

// ─── Config por matéria (igual à Home — identidade visual) ─────────────────
const AREA_CONFIG: Record<
    string,
    { label: string; short: string; color: string; glow: string; Icon: any }
> = {
    linguagens: {
        label: 'Linguagens',
        short: 'LCT',
        color: colors.blue[500],
        glow: colors.blue.glow,
        Icon: BookOpen,
    },
    'ciencias-humanas': {
        label: 'Ciências Humanas',
        short: 'HUM',
        color: colors.amber[500],
        glow: colors.amber.glow,
        Icon: Globe2,
    },
    'ciencias-natureza': {
        label: 'Ciências da Natureza',
        short: 'NAT',
        color: colors.green[500],
        glow: colors.green.glow,
        Icon: FlaskConical,
    },
    matematica: {
        label: 'Matemática',
        short: 'MAT',
        color: colors.violet[500],
        glow: colors.violet.glow,
        Icon: Calculator,
    },
};

function FilterDropdown({
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
    const [visible, setVisible] = useState(false);
    const safeOptions = Array.isArray(options) ? options : [];
    const selectedOption = safeOptions.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label ?? 'Todos';

    return (
        <View style={{ marginBottom: 16 }}>
            <Text
                style={{
                    fontSize: 11,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    marginBottom: 8,
                }}
            >
                {label}
            </Text>
            <Pressable
                onPress={() => !disabled && setVisible(true)}
                disabled={disabled}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: colors.bg.card,
                    borderWidth: 1,
                    borderColor: colors.border.default,
                    opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
                })}
            >
                <Text
                    style={{
                        fontSize: 15,
                        fontFamily: fonts.sansMedium,
                        color: colors.text.primary,
                    }}
                    numberOfLines={1}
                >
                    {displayLabel}
                </Text>
                <ChevronDown size={20} color={colors.text.muted} />
            </Pressable>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'flex-end',
                    }}
                    onPress={() => setVisible(false)}
                >
                    <Pressable
                        style={{
                            backgroundColor: colors.bg.deep,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 12,
                            paddingBottom: 32,
                            maxHeight: '70%',
                        }}
                        onPress={e => e.stopPropagation()}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.border.default,
                                alignSelf: 'center',
                                marginBottom: 16,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.muted,
                                textTransform: 'uppercase',
                                letterSpacing: 1.2,
                                paddingHorizontal: 20,
                                marginBottom: 12,
                            }}
                        >
                            {label}
                        </Text>
                        <FlatList
                            data={safeOptions}
                            keyExtractor={item => item.value || '_all'}
                            style={{ maxHeight: 320 }}
                            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
                            renderItem={({ item }) => {
                                const isSelected = item.value === value;
                                return (
                                    <Pressable
                                        onPress={() => {
                                            onSelect(item.value);
                                            setVisible(false);
                                        }}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 14,
                                            paddingHorizontal: 12,
                                            borderRadius: 12,
                                            backgroundColor: isSelected
                                                ? colors.green.glow
                                                : pressed
                                                  ? colors.bg.elevated
                                                  : 'transparent',
                                            borderWidth: 1,
                                            borderColor: isSelected
                                                ? colors.green[500]
                                                : 'transparent',
                                        })}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontFamily: isSelected
                                                    ? fonts.sansSemiBold
                                                    : fonts.sans,
                                                color: isSelected
                                                    ? colors.green[400]
                                                    : colors.text.primary,
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                        {isSelected && (
                                            <View
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    backgroundColor: colors.green[600],
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: fonts.sansBold,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    ✓
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
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
    const [showList, setShowList] = useState(false);

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

    const areaConfig = selectedArea ? AREA_CONFIG[selectedArea] : null;
    const AreaIcon = areaConfig?.Icon;

    // ─── Modo: jogando questão ─────────────────────────────────────────────
    if (activeQuestion) {
        return (
            <SafeAreaView
                className="flex-1"
                style={{ backgroundColor: colors.bg.void }}
                edges={['top']}
            >
                <View
                    className="flex-row items-center justify-between px-5 py-3"
                    style={{ backgroundColor: colors.bg.deep }}
                >
                    <Pressable
                        onPress={() => setActiveQuestion(null)}
                        style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: colors.bg.card,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                            opacity: pressed ? 0.85 : 1,
                        })}
                    >
                        <X size={16} color={colors.text.muted} />
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.secondary,
                            }}
                        >
                            Encerrar
                        </Text>
                    </Pressable>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: colors.green.glow,
                            borderWidth: 1,
                            borderColor: 'rgba(16,185,129,0.2)',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: fonts.sansBold,
                                color: colors.green[400],
                            }}
                        >
                            {scores.correct}/{scores.total} corretas
                        </Text>
                    </View>
                </View>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                >
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

    // ─── Step 1: Escolher matéria (cards grandes, como na Home) ─────────────
    if (!selectedArea) {
        return (
            <SafeAreaView
                className="flex-1"
                style={{ backgroundColor: colors.bg.void }}
                edges={['top']}
            >
                {/* Header padronizado (igual Rotina / Progresso) */}
                <View
                    className="flex-row items-center gap-2 px-5 py-3"
                    style={{ backgroundColor: colors.bg.deep }}
                >
                    <BookOpen size={18} color={colors.green[500]} />
                    <Text
                        style={{
                            fontSize: 17,
                            fontFamily: fonts.sansBold,
                            color: colors.text.primary,
                        }}
                    >
                        Questões
                    </Text>
                </View>

                {error && (
                    <View
                        style={{
                            marginHorizontal: 16,
                            marginTop: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: 16,
                            borderRadius: 16,
                            backgroundColor: colors.red.glow,
                            borderWidth: 1,
                            borderColor: 'rgba(224,82,82,0.2)',
                        }}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <AlertCircle size={18} color={colors.red[500]} />
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
                                Tentar de novo
                            </Text>
                        </Pressable>
                    </View>
                )}

                {loading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <ActivityIndicator size="large" color={colors.green[500]} />
                    </View>
                ) : (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingTop: 8,
                            paddingBottom: 120,
                            gap: 12,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {(Array.isArray(areas) ? areas : []).map((area, idx) => {
                            const config = AREA_CONFIG[area.value] ?? AREA_CONFIG.matematica;
                            const { label, color, glow, Icon } = config;
                            return (
                                <Animated.View
                                    key={area.value}
                                    entering={FadeInDown.delay(80 + idx * 60)
                                        .duration(380)
                                        .easing(Easing.out(Easing.quad))}
                                >
                                    <Pressable
                                        onPress={() => setSelectedArea(area.value)}
                                        style={({ pressed }) => ({
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: 18,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: colors.border.default,
                                            backgroundColor: colors.bg.card,
                                            opacity: pressed ? 0.92 : 1,
                                        })}
                                    >
                                        <View
                                            style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 14,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: glow,
                                                borderWidth: 1,
                                                borderColor: `${color}40`,
                                            }}
                                        >
                                            <Icon size={24} color={color} />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontFamily: fonts.sansBold,
                                                    color: colors.text.primary,
                                                }}
                                            >
                                                {label}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontFamily: fonts.sans,
                                                    color: colors.text.muted,
                                                    marginTop: 2,
                                                }}
                                            >
                                                ENEM 2015–2023 · por ano e tópico
                                            </Text>
                                        </View>
                                        <ChevronRight size={20} color={colors.text.muted} />
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                )}
            </SafeAreaView>
        );
    }

    // ─── Step 2: Matéria escolhida — refinamento + CTA + lista ──────────────
    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: colors.bg.void }}
            edges={['top']}
        >
            {/* Header padronizado (igual Rotina / Progresso) com voltar + chip da matéria */}
            <View
                className="px-5 pt-2 pb-4"
                style={{ backgroundColor: colors.bg.deep }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => {
                                setSelectedArea('');
                                setShowList(false);
                            }}
                            style={({ pressed }) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.bg.card,
                                borderWidth: 1,
                                borderColor: colors.border.subtle,
                                opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <ChevronLeft size={18} color={colors.text.secondary} />
                        </Pressable>
                        <BookOpen size={18} color={colors.green[500]} />
                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: fonts.sansBold,
                                color: colors.text.primary,
                            }}
                        >
                            Questões
                        </Text>
                    </View>
                    <View
                        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                        }}
                    >
                        {AreaIcon && (
                            <AreaIcon size={14} color={areaConfig!.color} />
                        )}
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: fonts.sansSemiBold,
                                color: colors.text.secondary,
                            }}
                            numberOfLines={1}
                        >
                            {areaConfig?.label ?? selectedArea}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: 120,
                }}
                showsVerticalScrollIndicator={false}
            >
                {error && (
                    <FadeInSection delay={0}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: 16,
                                borderRadius: 16,
                                backgroundColor: colors.red.glow,
                                borderWidth: 1,
                                borderColor: 'rgba(224,82,82,0.2)',
                                marginBottom: 20,
                            }}
                        >
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <AlertCircle size={18} color={colors.red[500]} />
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
                                    Tentar de novo
                                </Text>
                            </Pressable>
                        </View>
                    </FadeInSection>
                )}

                <FilterDropdown
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
                <FilterDropdown
                    label="Tópico"
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
                {isLinguagensArea && (
                    <FilterDropdown
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
                {(selectedYear || selectedTopico || selectedLanguage) && (
                    <Pressable
                        onPress={() => {
                            setSelectedYear('');
                            setSelectedTopico('');
                            setSelectedLanguage('');
                        }}
                        style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
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

                {/* CTA principal + contador */}
                {loadingQuestions ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                        <ActivityIndicator size="large" color={colors.green[500]} />
                    </View>
                ) : questions.length === 0 ? (
                    <FadeInSection delay={0}>
                        <View
                            style={{
                                alignItems: 'center',
                                paddingVertical: 40,
                                paddingHorizontal: 24,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: fonts.sans,
                                    color: colors.text.muted,
                                    textAlign: 'center',
                                }}
                            >
                                Nenhuma questão encontrada com esses filtros. Ajuste ano ou tópico.
                            </Text>
                        </View>
                    </FadeInSection>
                ) : (
                    <>
                        <FadeInSection delay={0}>
                            <View
                                style={{
                                    marginBottom: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 12,
                                }}
                            >
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
                                    questões
                                </Text>
                                <Pressable
                                    onPress={startSession}
                                    style={({ pressed }) => ({
                                        opacity: pressed ? 0.9 : 1,
                                    })}
                                >
                                    <LinearGradient
                                        colors={[colors.green[600], '#047857']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            paddingVertical: 14,
                                            paddingHorizontal: 24,
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: 'rgba(16,185,129,0.35)',
                                            minWidth: 180,
                                        }}
                                    >
                                        <Sparkles size={18} color="#fff" />
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontFamily: fonts.sansBold,
                                                color: '#fff',
                                            }}
                                        >
                                            Iniciar treino
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </FadeInSection>

                        {/* Lista (expandível ou sempre visível) */}
                        <Pressable
                            onPress={() => setShowList(v => !v)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 10,
                                marginBottom: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: fonts.sansSemiBold,
                                    color: colors.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}
                            >
                                {showList ? 'Ocultar lista' : 'Ver lista de questões'}
                            </Text>
                            <View style={{ transform: [{ rotate: showList ? '90deg' : '0deg' }] }}>
                                <ChevronRight size={16} color={colors.text.muted} />
                            </View>
                        </Pressable>
                        {showList && (
                            <View style={{ gap: 10 }}>
                                {(Array.isArray(questions) ? questions : []).map((q, idx) => (
                                    <StaggerItem
                                        key={`${q.year}-${q.index}`}
                                        index={idx}
                                        baseDelay={0}
                                        stagger={40}
                                    >
                                        <Pressable
                                            onPress={() => {
                                                setActiveQuestion(q);
                                                setQuestionIdx(idx);
                                                setScores({ correct: 0, total: 0 });
                                            }}
                                            style={({ pressed }) => ({
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: 16,
                                                borderRadius: 16,
                                                backgroundColor: colors.bg.card,
                                                borderWidth: 1,
                                                borderColor: colors.border.subtle,
                                                opacity: pressed ? 0.9 : 1,
                                            })}
                                        >
                                            <View style={{ flex: 1, minWidth: 0 }}>
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
                                                    ENEM {q.year} · Questão {q.index}
                                                    {q.discipline ? ` · ${q.discipline}` : ''}
                                                </Text>
                                            </View>
                                            <ChevronRight size={18} color={colors.text.muted} />
                                        </Pressable>
                                    </StaggerItem>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
