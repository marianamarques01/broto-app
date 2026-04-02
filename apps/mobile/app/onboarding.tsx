import { useState, useCallback } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    TextInput,
    StyleSheet,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    GraduationCap,
    Target,
    BarChart3,
    Clock,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Sun,
    Sunset,
    Moon,
    BookOpen,
    Globe2,
    FlaskConical,
    Calculator,
    Brain,
    Check,
} from 'lucide-react-native';
import { colors, fonts, fontSize } from '@/theme/tokens';
import { BrotoCtaButton } from '@/components/BrotoCtaButton';

/* ── Constants ──────────────────────────────────────────── */

const TOTAL_STEPS = 6;

const CURSOS_POPULARES = [
    'Medicina',
    'Direito',
    'Engenharia',
    'Psicologia',
    'Administracao',
    'Enfermagem',
    'Arquitetura',
    'Ciencia da Computacao',
] as const;

const NOTAS_REFERENCIA = [
    { curso: 'Medicina', nota: 780 },
    { curso: 'Direito', nota: 720 },
    { curso: 'Engenharia', nota: 700 },
    { curso: 'Psicologia', nota: 660 },
    { curso: 'Administracao', nota: 620 },
    { curso: 'Pedagogia', nota: 580 },
] as const;

type NivelArea = 'iniciante' | 'intermediario' | 'avancado';
type Horario = 'manha' | 'tarde' | 'noite';

const AREAS = [
    { key: 'linguagens', label: 'Linguagens', color: colors.blue[500], glow: colors.blue.glow, Icon: BookOpen },
    { key: 'humanas', label: 'Ciencias Humanas', color: colors.amber[500], glow: colors.amber.glow, Icon: Globe2 },
    { key: 'natureza', label: 'Ciencias da Natureza', color: colors.green[500], glow: colors.green.glow, Icon: FlaskConical },
    { key: 'matematica', label: 'Matematica', color: colors.violet[500], glow: colors.violet.glow, Icon: Calculator },
] as const;

const NIVEIS: { value: NivelArea; label: string; dots: number }[] = [
    { value: 'iniciante', label: 'Iniciante', dots: 1 },
    { value: 'intermediario', label: 'Intermediario', dots: 2 },
    { value: 'avancado', label: 'Avancado', dots: 3 },
];

const HORAS_OPTIONS = [1, 2, 3, 4, 5] as const;

const HORARIOS: { value: Horario; label: string; Icon: typeof Sun }[] = [
    { value: 'manha', label: 'Manha', Icon: Sun },
    { value: 'tarde', label: 'Tarde', Icon: Sunset },
    { value: 'noite', label: 'Noite', Icon: Moon },
];

/* ── Types ──────────────────────────────────────────────── */

interface OnboardingState {
    faculdade: string;
    curso: string;
    metaNota: number;
    niveis: Record<string, NivelArea | null>;
    horasPorDia: number;
    horarios: Horario[];
}

/* ── Shared Components ──────────────────────────────────── */

function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <View style={st.dotsRow}>
            {Array.from({ length: total }, (_, i) => (
                <View
                    key={i}
                    style={[
                        st.dot,
                        i < current
                            ? st.dotCompleted
                            : i === current
                              ? st.dotActive
                              : st.dotInactive,
                    ]}
                />
            ))}
        </View>
    );
}

function StepHeader({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}) {
    return (
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={st.stepHeader}>
            <View style={st.stepIconWrap}>{icon}</View>
            <Text style={st.stepTitle}>{title}</Text>
            <Text style={st.stepSubtitle}>{subtitle}</Text>
        </Animated.View>
    );
}

function NavBar({
    step,
    onBack,
    onSkip,
    showSkip = true,
}: {
    step: number;
    onBack: () => void;
    onSkip: () => void;
    showSkip?: boolean;
}) {
    return (
        <View style={st.navBar}>
            {step > 0 ? (
                <Pressable onPress={onBack} style={st.navBtn} hitSlop={12}>
                    <ChevronLeft size={20} color={colors.text.secondary} />
                </Pressable>
            ) : (
                <View style={st.navBtn} />
            )}
            <ProgressDots current={step} total={TOTAL_STEPS} />
            {showSkip ? (
                <Pressable onPress={onSkip} hitSlop={12}>
                    <Text style={st.skipText}>Pular</Text>
                </Pressable>
            ) : (
                <View style={st.navBtn} />
            )}
        </View>
    );
}

/* ── Step 0: Welcome ────────────────────────────────────── */

function StepWelcome({
    onContinue,
    onSkipAll,
}: {
    onContinue: () => void;
    onSkipAll: () => void;
}) {
    return (
        <View style={st.stepContainer}>
            <View style={st.stepContent}>
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={st.welcomeEmoji}>
                    <View style={st.emojiBox}>
                        <Text style={{ fontSize: 56 }}>{'\u{1F331}'}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                    <Text style={st.welcomeTitle}>Vamos personalizar{'\n'}seus estudos!</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(550).duration(500)}>
                    <Text style={st.welcomeSubtitle}>
                        Sao algumas perguntas rapidas para{'\n'}montar seu plano ideal.
                    </Text>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(700).duration(500)} style={st.stepFooter}>
                <BrotoCtaButton onPress={onContinue} title="Vamos la!" />
                <Pressable onPress={onSkipAll} style={st.skipAllBtn}>
                    <Text style={st.skipAllText}>Pular configuracao</Text>
                </Pressable>
                <ProgressDots current={0} total={TOTAL_STEPS} />
            </Animated.View>
        </View>
    );
}

/* ── Step 1: Objetivo ───────────────────────────────────── */

function StepObjetivo({
    data,
    onChange,
}: {
    data: OnboardingState;
    onChange: (d: Partial<OnboardingState>) => void;
}) {
    return (
        <ScrollView
            style={st.scrollStep}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <StepHeader
                icon={<GraduationCap size={28} color={colors.green[400]} />}
                title="Qual seu objetivo?"
                subtitle="Saber o curso ajuda a focar no que importa"
            />

            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={st.fieldGroup}>
                <Text style={st.fieldLabel}>Faculdade desejada</Text>
                <View style={st.inputWrap}>
                    <TextInput
                        style={st.input}
                        value={data.faculdade}
                        onChangeText={v => onChange({ faculdade: v })}
                        placeholder="Ex: USP, UFMG, UNICAMP..."
                        placeholderTextColor={colors.text.muted40}
                        selectionColor={colors.green[500]}
                    />
                </View>
                <Text style={st.fieldHint}>Opcional — pode deixar em branco</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={st.fieldGroup}>
                <Text style={st.fieldLabel}>Curso desejado</Text>
                <View style={st.inputWrap}>
                    <TextInput
                        style={st.input}
                        value={data.curso}
                        onChangeText={v => onChange({ curso: v })}
                        placeholder="Ex: Medicina, Direito..."
                        placeholderTextColor={colors.text.muted40}
                        selectionColor={colors.green[500]}
                    />
                </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={st.fieldGroup}>
                <Text style={st.fieldLabel}>Cursos populares</Text>
                <View style={st.chipsRow}>
                    {CURSOS_POPULARES.map(c => {
                        const selected = data.curso === c;
                        return (
                            <Pressable
                                key={c}
                                onPress={() => onChange({ curso: c })}
                                style={[st.chip, selected && st.chipSelected]}
                            >
                                <Text style={[st.chipText, selected && st.chipTextSelected]}>
                                    {c}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Animated.View>
        </ScrollView>
    );
}

/* ── Step 2: Meta de Nota ───────────────────────────────── */

function getNotaColor(nota: number): string {
    if (nota < 550) return colors.text.muted;
    if (nota < 700) return colors.green[500];
    if (nota < 800) return colors.gold[500];
    return colors.violet[500];
}

function StepMeta({
    data,
    onChange,
}: {
    data: OnboardingState;
    onChange: (d: Partial<OnboardingState>) => void;
}) {
    const notaColor = getNotaColor(data.metaNota);
    const highlightCurso = data.curso;

    return (
        <ScrollView
            style={st.scrollStep}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <StepHeader
                icon={<Target size={28} color={colors.gold[400]} />}
                title="Qual sua meta de nota?"
                subtitle="A nota media do ENEM e 500"
            />

            {/* Big number */}
            <Animated.View entering={FadeIn.delay(200).duration(400)} style={st.metaNumberWrap}>
                <Text style={[st.metaNumber, { color: notaColor }]}>{data.metaNota}</Text>
                <Text style={st.metaLabel}>pontos</Text>
            </Animated.View>

            {/* Slider track */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={st.sliderContainer}>
                <View style={st.sliderTrack}>
                    <View
                        style={[
                            st.sliderFill,
                            {
                                width: `${((data.metaNota - 400) / 500) * 100}%`,
                                backgroundColor: notaColor,
                            },
                        ]}
                    />
                    <View
                        style={[
                            st.sliderThumb,
                            {
                                left: `${((data.metaNota - 400) / 500) * 100}%`,
                                backgroundColor: notaColor,
                            },
                        ]}
                    />
                </View>
                <View style={st.sliderLabels}>
                    <Text style={st.sliderLabel}>400</Text>
                    <Text style={st.sliderLabel}>900</Text>
                </View>
                {/* Tappable segments to change value */}
                <View style={st.sliderTapArea}>
                    {Array.from({ length: 11 }, (_, i) => {
                        const val = 400 + i * 50;
                        return (
                            <Pressable
                                key={val}
                                onPress={() => onChange({ metaNota: val })}
                                style={st.sliderTapSegment}
                            />
                        );
                    })}
                </View>
            </Animated.View>

            {/* Quick select pills */}
            <Animated.View entering={FadeInUp.delay(350).duration(400)} style={st.metaPills}>
                {[500, 600, 700, 750, 800, 850].map(n => (
                    <Pressable
                        key={n}
                        onPress={() => onChange({ metaNota: n })}
                        style={[
                            st.metaPill,
                            data.metaNota === n && {
                                backgroundColor: getNotaColor(n) + '30',
                                borderColor: getNotaColor(n),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                st.metaPillText,
                                data.metaNota === n && { color: getNotaColor(n) },
                            ]}
                        >
                            {n}
                        </Text>
                    </Pressable>
                ))}
            </Animated.View>

            {/* Reference table */}
            <Animated.View entering={FadeInUp.delay(450).duration(400)} style={st.refCard}>
                <Text style={st.refTitle}>Notas de referencia</Text>
                {NOTAS_REFERENCIA.map(r => {
                    const isHighlight =
                        !!highlightCurso &&
                        r.curso.toLowerCase().includes(highlightCurso.toLowerCase());
                    return (
                        <View
                            key={r.curso}
                            style={[st.refRow, isHighlight && st.refRowHighlight]}
                        >
                            <Text style={[st.refCurso, isHighlight && st.refCursoHighlight]}>
                                {r.curso}
                            </Text>
                            <Text style={[st.refNota, { color: getNotaColor(r.nota) }]}>
                                ~{r.nota}
                            </Text>
                        </View>
                    );
                })}
            </Animated.View>
        </ScrollView>
    );
}

/* ── Step 3: Nivel por Area ─────────────────────────────── */

function StepNivel({
    data,
    onChange,
}: {
    data: OnboardingState;
    onChange: (d: Partial<OnboardingState>) => void;
}) {
    const setNivel = (area: string, nivel: NivelArea) => {
        onChange({ niveis: { ...data.niveis, [area]: nivel } });
    };

    return (
        <ScrollView
            style={st.scrollStep}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <StepHeader
                icon={<BarChart3 size={28} color={colors.green[400]} />}
                title="Como voce se avalia?"
                subtitle="Seja honesto — isso ajuda a criar sua rotina ideal"
            />

            {AREAS.map((area, areaIdx) => {
                const selected = data.niveis[area.key];
                return (
                    <Animated.View
                        key={area.key}
                        entering={FadeInUp.delay(200 + areaIdx * 100).duration(400)}
                        style={st.areaCard}
                    >
                        <View style={[st.areaCardAccent, { backgroundColor: area.color }]} />
                        <View style={st.areaCardHeader}>
                            <View style={[st.areaIconWrap, { backgroundColor: area.glow }]}>
                                <area.Icon size={18} color={area.color} />
                            </View>
                            <Text style={st.areaLabel}>{area.label}</Text>
                        </View>
                        <View style={st.nivelRow}>
                            {NIVEIS.map(n => {
                                const isSelected = selected === n.value;
                                return (
                                    <Pressable
                                        key={n.value}
                                        onPress={() => setNivel(area.key, n.value)}
                                        style={[
                                            st.nivelBtn,
                                            isSelected && {
                                                backgroundColor: area.glow,
                                                borderColor: area.color,
                                            },
                                        ]}
                                    >
                                        <View style={st.nivelDots}>
                                            {Array.from({ length: 3 }, (_, i) => (
                                                <View
                                                    key={i}
                                                    style={[
                                                        st.nivelDot,
                                                        {
                                                            backgroundColor:
                                                                i < n.dots
                                                                    ? isSelected
                                                                        ? area.color
                                                                        : colors.text.muted
                                                                    : colors.bg.elevated,
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text
                                            style={[
                                                st.nivelText,
                                                isSelected && { color: area.color },
                                            ]}
                                        >
                                            {n.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Animated.View>
                );
            })}
        </ScrollView>
    );
}

/* ── Step 4: Disponibilidade ────────────────────────────── */

function StepDisponibilidade({
    data,
    onChange,
}: {
    data: OnboardingState;
    onChange: (d: Partial<OnboardingState>) => void;
}) {
    const toggleHorario = (h: Horario) => {
        const current = data.horarios;
        onChange({
            horarios: current.includes(h)
                ? current.filter(x => x !== h)
                : [...current, h],
        });
    };

    return (
        <ScrollView
            style={st.scrollStep}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <StepHeader
                icon={<Clock size={28} color={colors.green[400]} />}
                title="Quanto tempo voce tem?"
                subtitle="Vamos adaptar tudo ao seu ritmo"
            />

            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={st.fieldGroup}>
                <Text style={st.fieldLabel}>Horas por dia</Text>
                <View style={st.horasPills}>
                    {HORAS_OPTIONS.map(h => {
                        const selected = data.horasPorDia === h;
                        return (
                            <Pressable
                                key={h}
                                onPress={() => onChange({ horasPorDia: h })}
                                style={[st.horasPill, selected && st.horasPillSelected]}
                            >
                                <Text
                                    style={[
                                        st.horasPillText,
                                        selected && st.horasPillTextSelected,
                                    ]}
                                >
                                    {h}h
                                </Text>
                            </Pressable>
                        );
                    })}
                    <Pressable
                        onPress={() => onChange({ horasPorDia: 6 })}
                        style={[st.horasPill, data.horasPorDia >= 6 && st.horasPillSelected]}
                    >
                        <Text
                            style={[
                                st.horasPillText,
                                data.horasPorDia >= 6 && st.horasPillTextSelected,
                            ]}
                        >
                            6h+
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(350).duration(400)} style={st.fieldGroup}>
                <Text style={st.fieldLabel}>Melhor horario pra estudar</Text>
                <Text style={st.fieldHint}>Pode selecionar mais de um</Text>
                <View style={st.horariosRow}>
                    {HORARIOS.map(h => {
                        const selected = data.horarios.includes(h.value);
                        return (
                            <Pressable
                                key={h.value}
                                onPress={() => toggleHorario(h.value)}
                                style={[st.horarioCard, selected && st.horarioCardSelected]}
                            >
                                {selected && (
                                    <View style={st.horarioCheck}>
                                        <Check size={12} color={colors.green[500]} />
                                    </View>
                                )}
                                <View
                                    style={[
                                        st.horarioIconWrap,
                                        selected && { backgroundColor: colors.green.glow },
                                    ]}
                                >
                                    <h.Icon
                                        size={22}
                                        color={selected ? colors.green[400] : colors.text.muted}
                                    />
                                </View>
                                <Text
                                    style={[
                                        st.horarioLabel,
                                        selected && { color: colors.text.primary },
                                    ]}
                                >
                                    {h.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Animated.View>
        </ScrollView>
    );
}

/* ── Step 5: Resumo ─────────────────────────────────────── */

function NivelIndicator({ nivel, color }: { nivel: NivelArea | null; color: string }) {
    const dots = nivel === 'avancado' ? 3 : nivel === 'intermediario' ? 2 : 1;
    return (
        <View style={st.nivelIndicatorRow}>
            {[1, 2, 3].map(i => (
                <View
                    key={i}
                    style={[
                        st.nivelIndicatorDot,
                        { backgroundColor: i <= dots ? color : colors.bg.elevated },
                    ]}
                />
            ))}
        </View>
    );
}

function StepResumo({
    data,
    onSimulado,
    onStart,
}: {
    data: OnboardingState;
    onSimulado: () => void;
    onStart: () => void;
}) {
    const nivelLabel = (n: NivelArea | null) =>
        n === 'avancado' ? 'Ava' : n === 'intermediario' ? 'Int' : 'Ini';

    return (
        <ScrollView
            style={st.scrollStep}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <StepHeader
                icon={<Sparkles size={28} color={colors.gold[400]} />}
                title="Tudo pronto!"
                subtitle="Veja seu resumo"
            />

            {/* Summary card */}
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={st.resumoCard}>
                {(data.curso || data.faculdade) && (
                    <View style={st.resumoRow}>
                        <GraduationCap size={16} color={colors.green[400]} />
                        <Text style={st.resumoText}>
                            {data.curso || 'Curso nao definido'}
                            {data.faculdade ? ` — ${data.faculdade}` : ''}
                        </Text>
                    </View>
                )}
                <View style={st.resumoRow}>
                    <Target size={16} color={colors.gold[400]} />
                    <Text style={st.resumoText}>Meta: {data.metaNota} pontos</Text>
                </View>
                <View style={st.resumoRow}>
                    <Clock size={16} color={colors.green[400]} />
                    <Text style={st.resumoText}>
                        {data.horasPorDia}h/dia
                        {data.horarios.length > 0
                            ? ` — ${data.horarios
                                  .map(h => h.charAt(0).toUpperCase() + h.slice(1))
                                  .join(', ')}`
                            : ''}
                    </Text>
                </View>
            </Animated.View>

            {/* Area levels mini cards */}
            <Animated.View entering={FadeInUp.delay(350).duration(400)} style={st.resumoAreasRow}>
                {AREAS.map(area => (
                    <View key={area.key} style={st.resumoAreaCard}>
                        <View style={[st.resumoAreaIconWrap, { backgroundColor: area.glow }]}>
                            <area.Icon size={16} color={area.color} />
                        </View>
                        <NivelIndicator nivel={data.niveis[area.key]} color={area.color} />
                        <Text style={st.resumoAreaLabel}>
                            {nivelLabel(data.niveis[area.key])}
                        </Text>
                    </View>
                ))}
            </Animated.View>

            {/* Divider */}
            <View style={st.resumoDivider} />

            {/* Simulado CTA */}
            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={st.simuladoCard}>
                <View style={st.simuladoHeader}>
                    <Brain size={24} color={colors.gold[400]} />
                    <Text style={st.simuladoTitle}>Simulado diagnostico</Text>
                </View>
                <Text style={st.simuladoDesc}>
                    5 questoes de cada area (~15 min).{'\n'}
                    Com isso, seu plano fica ainda mais preciso!
                </Text>
                <BrotoCtaButton
                    onPress={onSimulado}
                    title="Fazer simulado"
                    leftIcon={<Brain size={18} color="#fff" />}
                    compact
                />
            </Animated.View>

            {/* Start without simulado */}
            <Animated.View entering={FadeInUp.delay(600).duration(400)}>
                <Pressable onPress={onStart} style={st.startWithoutBtn}>
                    <Text style={st.startWithoutText}>Comecar sem simulado</Text>
                </Pressable>
            </Animated.View>
        </ScrollView>
    );
}

/* ── Main Screen ────────────────────────────────────────── */

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingState>({
        faculdade: '',
        curso: '',
        metaNota: 700,
        niveis: {
            linguagens: null,
            humanas: null,
            natureza: null,
            matematica: null,
        },
        horasPorDia: 2,
        horarios: [],
    });

    const updateData = useCallback(
        (partial: Partial<OnboardingState>) => setData(prev => ({ ...prev, ...partial })),
        [],
    );

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const goBack = () => setStep(s => Math.max(s - 1, 0));

    const handleFinish = () => {
        // TODO: save data via API
        router.replace('/(tabs)');
    };

    const handleSimulado = () => {
        // TODO: navigate to diagnostic quiz
        router.replace('/(tabs)');
    };

    const handleSkipAll = () => {
        router.replace('/(tabs)');
    };

    // Step 0 (Welcome) has its own layout
    if (step === 0) {
        return (
            <View style={[st.screen, { paddingTop: insets.top }]}>
                <LinearGradient
                    colors={[colors.bg.deep, colors.bg.void]}
                    style={StyleSheet.absoluteFill}
                />
                <StepWelcome onContinue={goNext} onSkipAll={handleSkipAll} />
            </View>
        );
    }

    return (
        <View style={[st.screen, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={[colors.bg.deep, colors.bg.void]}
                style={StyleSheet.absoluteFill}
            />

            <NavBar
                step={step}
                onBack={goBack}
                onSkip={goNext}
                showSkip={step < TOTAL_STEPS}
            />

            <View style={st.stepBody}>
                {step === 1 && <StepObjetivo data={data} onChange={updateData} />}
                {step === 2 && <StepMeta data={data} onChange={updateData} />}
                {step === 3 && <StepNivel data={data} onChange={updateData} />}
                {step === 4 && <StepDisponibilidade data={data} onChange={updateData} />}
                {step === 5 && (
                    <StepResumo
                        data={data}
                        onSimulado={handleSimulado}
                        onStart={handleFinish}
                    />
                )}
            </View>

            {/* Bottom CTA for steps 1-4 */}
            {step >= 1 && step <= 4 && (
                <View style={[st.bottomCta, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <BrotoCtaButton
                        onPress={goNext}
                        title="Continuar"
                        rightIcon={<ChevronRight size={18} color="#fff" />}
                    />
                </View>
            )}
        </View>
    );
}

/* ── Styles ──────────────────────────────────────────────── */

const st = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.bg.void,
    },

    /* Nav bar */
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    navBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipText: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansMedium,
        color: colors.text.muted,
    },

    /* Progress dots */
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: colors.green[500],
        width: 24,
        borderRadius: 4,
    },
    dotCompleted: {
        backgroundColor: colors.green[500],
    },
    dotInactive: {
        backgroundColor: colors.bg.elevated,
    },

    /* Step layout */
    stepContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    stepContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    stepFooter: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 16,
        alignItems: 'center',
    },
    stepBody: {
        flex: 1,
    },
    scrollStep: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },

    /* Step header */
    stepHeader: {
        alignItems: 'center',
        marginBottom: 28,
        marginTop: 8,
    },
    stepIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.green.glow,
        marginBottom: 16,
    },
    stepTitle: {
        fontSize: fontSize.xl,
        fontFamily: fonts.displayBold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 6,
    },

    /* Welcome */
    welcomeEmoji: {
        marginBottom: 24,
    },
    emojiBox: {
        width: 112,
        height: 112,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.green.glow,
        borderWidth: 1,
        borderColor: colors.border.strong,
    },
    welcomeTitle: {
        fontSize: fontSize['2xl'],
        fontFamily: fonts.displayBold,
        color: colors.text.primary,
        textAlign: 'center',
        lineHeight: 34,
    },
    welcomeSubtitle: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    skipAllBtn: {
        paddingVertical: 8,
    },
    skipAllText: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.muted,
    },

    /* Fields */
    fieldGroup: {
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.primary,
        marginBottom: 8,
    },
    fieldHint: {
        fontSize: fontSize.xs,
        fontFamily: fonts.sans,
        color: colors.text.muted,
        marginTop: 6,
    },
    inputWrap: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.bg.deep,
        overflow: 'hidden',
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.primary,
    },

    /* Chips */
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    chipSelected: {
        backgroundColor: colors.green.glow,
        borderColor: colors.green[500],
    },
    chipText: {
        fontSize: fontSize.xs,
        fontFamily: fonts.sansMedium,
        color: colors.text.secondary,
    },
    chipTextSelected: {
        color: colors.green[400],
    },

    /* Meta nota */
    metaNumberWrap: {
        alignItems: 'center',
        marginBottom: 24,
    },
    metaNumber: {
        fontSize: 64,
        fontFamily: fonts.displayBold,
        lineHeight: 72,
    },
    metaLabel: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.muted,
        marginTop: -4,
    },
    sliderContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.bg.elevated,
        position: 'relative',
    },
    sliderFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 3,
    },
    sliderThumb: {
        position: 'absolute',
        top: -9,
        width: 24,
        height: 24,
        borderRadius: 12,
        marginLeft: -12,
        borderWidth: 3,
        borderColor: colors.bg.void,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderLabel: {
        fontSize: fontSize.xs,
        fontFamily: fonts.sans,
        color: colors.text.muted,
    },
    sliderTapArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -12,
        bottom: -12,
        flexDirection: 'row',
    },
    sliderTapSegment: {
        flex: 1,
    },

    /* Meta pills */
    metaPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    metaPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    metaPillText: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansMedium,
        color: colors.text.secondary,
    },

    /* Reference table */
    refCard: {
        borderRadius: 16,
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: 16,
    },
    refTitle: {
        fontSize: fontSize.xs,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    refRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    refRowHighlight: {
        backgroundColor: colors.green.glow,
    },
    refCurso: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.secondary,
    },
    refCursoHighlight: {
        color: colors.green[400],
        fontFamily: fonts.sansSemiBold,
    },
    refNota: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansBold,
    },

    /* Area cards */
    areaCard: {
        borderRadius: 16,
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    areaCardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    areaCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    areaIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaLabel: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.primary,
    },
    nivelRow: {
        flexDirection: 'row',
        gap: 8,
    },
    nivelBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
        backgroundColor: colors.bg.deep,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        gap: 4,
    },
    nivelDots: {
        flexDirection: 'row',
        gap: 4,
    },
    nivelDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    nivelText: {
        fontSize: fontSize.xs,
        fontFamily: fonts.sansMedium,
        color: colors.text.muted,
    },

    /* Horas */
    horasPills: {
        flexDirection: 'row',
        gap: 8,
    },
    horasPill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: colors.bg.deep,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    horasPillSelected: {
        backgroundColor: colors.green.glow,
        borderColor: colors.green[500],
    },
    horasPillText: {
        fontSize: fontSize.base,
        fontFamily: fonts.sansBold,
        color: colors.text.muted,
    },
    horasPillTextSelected: {
        color: colors.green[400],
    },

    /* Horarios */
    horariosRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    horarioCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        gap: 8,
        position: 'relative',
    },
    horarioCardSelected: {
        borderColor: colors.green[500],
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    horarioCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.green.glow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    horarioIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.elevated,
    },
    horarioLabel: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansMedium,
        color: colors.text.muted,
    },

    /* Resumo */
    resumoCard: {
        borderRadius: 16,
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: 16,
        gap: 12,
        marginBottom: 16,
    },
    resumoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    resumoText: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.primary,
        flex: 1,
    },

    /* Resumo area mini cards */
    resumoAreasRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    resumoAreaCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 14,
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.default,
        gap: 6,
    },
    resumoAreaIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resumoAreaLabel: {
        fontSize: 10,
        fontFamily: fonts.sansMedium,
        color: colors.text.muted,
    },
    nivelIndicatorRow: {
        flexDirection: 'row',
        gap: 3,
    },
    nivelIndicatorDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },

    resumoDivider: {
        height: 1,
        backgroundColor: colors.border.default,
        marginBottom: 20,
    },

    /* Simulado card */
    simuladoCard: {
        borderRadius: 16,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.gold[600] + '40',
        padding: 20,
        gap: 12,
        marginBottom: 16,
    },
    simuladoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    simuladoTitle: {
        fontSize: fontSize.base,
        fontFamily: fonts.sansBold,
        color: colors.text.primary,
    },
    simuladoDesc: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sans,
        color: colors.text.secondary,
        lineHeight: 22,
    },

    startWithoutBtn: {
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.bg.card,
    },
    startWithoutText: {
        fontSize: fontSize.sm,
        fontFamily: fonts.sansMedium,
        color: colors.text.secondary,
    },

    /* Bottom CTA */
    bottomCta: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: colors.bg.void + 'F0',
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
    },
});
