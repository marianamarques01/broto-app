import { useEffect, useState, useCallback, useRef } from 'react';
import type {
    Area,
    Topico,
    Exam,
    Question,
    QuestionsResponse,
} from '@/lib/types/questions';

const QUESTIONS_LIMIT = 10;
const IDIOMAS_QUESTIONS_LIMIT = 5;
const LINGUAGENS_AREA_VALUE = 'linguagens';
const IDIOMAS_TOPIC_ID = '__idiomas';

/** Apenas questões de 2015 a 2023. */
const EXAM_YEAR_MIN = 2015;
const EXAM_YEAR_MAX = 2023;

export const LANGUAGE_OPTIONS = [
    { value: '', label: 'Todos os idiomas' },
    { value: 'ingles', label: 'Inglês' },
    { value: 'espanhol', label: 'Espanhol' },
] as const;

const IDIOMAS_TOPIC: Topico = {
    id: IDIOMAS_TOPIC_ID,
    value: 'idiomas',
    label: 'Idiomas',
};

// Igual ao desktop PWA: se tiver URL do app (PWA), busca os JSONs de lá (public/). Senão, usa Supabase Storage.
const BASE_URL = process.env.EXPO_PUBLIC_QUESTIONS_BASE_URL
    ? process.env.EXPO_PUBLIC_QUESTIONS_BASE_URL.replace(/\/$/, '')
    : process.env.EXPO_PUBLIC_SUPABASE_URL
      ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/static`
      : '';

/** Mensagem amigável para erros de rede (NetworkError, fetch failed, etc.). */
function normalizeNetworkErrorMessage(err: unknown, defaultMsg: string): string {
    const raw = err instanceof Error ? err.message : String(err);
    const isNetworkError =
        /NetworkError|fetch failed|Failed to fetch|network request failed/i.test(raw) ||
        /attempting to fetch resource/i.test(raw);
    if (!isNetworkError) return raw || defaultMsg;

    const isLocalhost =
        /localhost|127\.0\.0\.1/i.test(BASE_URL || '') ||
        /localhost|127\.0\.0\.1/i.test(process.env.EXPO_PUBLIC_QUESTIONS_BASE_URL || '');
    if (isLocalhost) {
        return 'Não foi possível conectar ao servidor. No simulador ou dispositivo, use o IP da sua máquina (ex: http://192.168.x.x:3000) no .env em vez de localhost.';
    }
    // IP na rede (ex.: celular): mesmo Wi‑Fi, servidor com host:true e firewall
    return 'Não foi possível conectar. Celular e PC na mesma rede Wi‑Fi? API rodando com host liberado? Ou use Supabase: deixe EXPO_PUBLIC_QUESTIONS_BASE_URL vazio e rode npm run upload:static na raiz.';
}

interface ExamDetails {
    year: number;
    questions: Array<{
        title: string;
        index: number;
        discipline: string;
        language?: string | null;
    }>;
}

let topicMappingCache: Record<string, string> | null = null;

async function loadTopicMapping(): Promise<Record<string, string>> {
    if (topicMappingCache) return topicMappingCache;
    const res = await fetch(`${BASE_URL}/data/question-topic-mapping.json`);
    if (!res.ok) return {};
    const data = (await res.json()) as { mapping?: Record<string, string> };
    topicMappingCache = data?.mapping && typeof data.mapping === 'object' ? data.mapping : {};
    return topicMappingCache;
}

const examDetailsCache = new Map<number, ExamDetails>();

async function loadExamDetails(year: number): Promise<ExamDetails | null> {
    if (examDetailsCache.has(year)) return examDetailsCache.get(year)!;
    const res = await fetch(`${BASE_URL}/${year}/details.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as ExamDetails;
    if (!data || !Array.isArray(data.questions)) return null;
    examDetailsCache.set(year, data);
    return data;
}

async function fetchAreas(): Promise<Area[]> {
    const res = await fetch(`${BASE_URL}/areas.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

async function fetchExams(): Promise<Exam[]> {
    const res = await fetch(`${BASE_URL}/exams.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
        .map((e: { year?: number; title?: string }) => ({
            year: Number(e?.year),
            title: String(e?.title ?? ''),
        }))
        .filter(e => e.year >= EXAM_YEAR_MIN && e.year <= EXAM_YEAR_MAX);
}

async function fetchTopics(areaValue: string): Promise<Topico[]> {
    const res = await fetch(`${BASE_URL}/topics/${areaValue}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

async function fetchQuestionDetail(
    year: number,
    index: number,
    language?: string | null,
): Promise<Question | null> {
    const paths = language
        ? [
              `${BASE_URL}/${year}/questions/${index}-${language}/details.json`,
              `${BASE_URL}/${year}/questions/${index}/details.json`,
          ]
        : [`${BASE_URL}/${year}/questions/${index}/details.json`];

    for (const path of paths) {
        const res = await fetch(path);
        if (res.ok) {
            const q = await res.json();
            return {
                title: q.title,
                index: q.index,
                year: q.year ?? year,
                discipline: q.discipline ?? null,
                language: q.language ?? language ?? null,
                context: q.context ?? null,
                alternatives: (q.alternatives ?? []).map(
                    (a: {
                        letter: string;
                        text?: string | null;
                        isCorrect?: boolean;
                    }) => ({
                        letter: a.letter,
                        text: a.text ?? null,
                        isCorrect: a.isCorrect ?? false,
                    }),
                ),
            };
        }
    }
    return null;
}

interface SearchParams {
    area: string;
    year?: string;
    topicoId?: string;
    topicoValue?: string;
    language?: string;
    limit?: number;
}

async function searchQuestions(
    params: SearchParams,
): Promise<QuestionsResponse> {
    const { area, year, topicoId, language, limit = QUESTIONS_LIMIT } = params;

    const [exams, topicMapping] = await Promise.all([
        fetchExams(),
        topicoId && topicoId !== IDIOMAS_TOPIC_ID
            ? loadTopicMapping()
            : Promise.resolve(null),
    ]);

    const yearsToSearch = year
        ? exams.filter(e => String(e.year) === year).map(e => e.year)
        : exams.map(e => e.year).sort((a, b) => b - a);

    let topicQuestionSet: Set<string> | null = null;
    if (topicoId && topicoId !== IDIOMAS_TOPIC_ID && topicMapping) {
        const topicoValue = params.topicoValue;
        if (topicoValue) {
            topicQuestionSet = new Set(
                Object.entries(topicMapping)
                    .filter(([, v]) => v === topicoValue)
                    .map(([k]) => k),
            );
        }
    }

    type QuestionRef = { year: number; index: number; language: string | null };
    const allRefs: QuestionRef[] = [];

    for (const y of yearsToSearch) {
        const examDetails = await loadExamDetails(y);
        if (!examDetails) continue;

        for (const q of examDetails.questions) {
            if (q.discipline !== area) continue;

            const hasLanguage = !!q.language;
            const matchLanguage =
                !language || q.language === language || !hasLanguage;
            if (!matchLanguage) continue;

            if (topicQuestionSet) {
                const key = q.language
                    ? `${y}-${q.index}-${q.language}`
                    : `${y}-${q.index}`;
                const keyAlt = `${y}-${q.index}`;
                if (!topicQuestionSet.has(key) && !topicQuestionSet.has(keyAlt))
                    continue;
            }

            allRefs.push({
                year: y,
                index: q.index,
                language: q.language ?? null,
            });
        }
    }

    const total = allRefs.length;
    const slice = allRefs.slice(0, limit);

    const questions = await Promise.all(
        slice.map(ref =>
            fetchQuestionDetail(ref.year, ref.index, ref.language),
        ),
    );

    return {
        questions: questions.filter((q): q is Question => q !== null),
        metadata: { limit, offset: 0, total, hasMore: total > limit },
    };
}

interface QuestionsFiltersState {
    areas: Area[];
    topicos: Topico[];
    exams: Exam[];
    questions: Question[];
    loading: boolean;
    loadingQuestions: boolean;
    error: string | null;
    isLinguagensArea: boolean;
    isLanguageFilterEnabled: boolean;
}

interface QuestionsFiltersActions {
    selectedArea: string;
    selectedYear: string;
    selectedTopico: string;
    selectedLanguage: string;
    setSelectedArea: (v: string) => void;
    setSelectedYear: (v: string) => void;
    setSelectedTopico: (v: string) => void;
    setSelectedLanguage: (v: string) => void;
    retry: () => void;
}

export function useQuestionsFilters(): QuestionsFiltersState &
    QuestionsFiltersActions {
    const [areas, setAreas] = useState<Area[]>([]);
    const [topicos, setTopicos] = useState<Topico[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedArea, setSelectedArea] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedTopico, setSelectedTopico] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');

    const topicosRef = useRef<Topico[]>([]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [areasData, examsData] = await Promise.all([
                fetchAreas(),
                fetchExams(),
            ]);
            setAreas(areasData);
            setExams(examsData);
        } catch (err) {
            setError(normalizeNetworkErrorMessage(err, 'Erro ao carregar dados'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (!selectedArea) {
            setTopicos([]);
            topicosRef.current = [];
            setSelectedTopico('');
            setSelectedLanguage('');
            return;
        }
        fetchTopics(selectedArea)
            .then(data => {
                const list =
                    selectedArea === LINGUAGENS_AREA_VALUE
                        ? [IDIOMAS_TOPIC, ...data]
                        : data;
                setTopicos(list);
                topicosRef.current = list;
            })
            .catch(() => {
                setTopicos([]);
                topicosRef.current = [];
            });
        setSelectedTopico('');
        setSelectedLanguage('');
    }, [selectedArea]);

    const isIdiomasTopicSelected = selectedTopico === IDIOMAS_TOPIC_ID;

    useEffect(() => {
        if (!selectedArea) {
            setQuestions([]);
            return;
        }

        setLoadingQuestions(true);
        setError(null);

        const topicoValue = topicosRef.current.find(
            t => t.id === selectedTopico,
        )?.value;

        const run = async () => {
            if (isIdiomasTopicSelected) {
                const langs = selectedLanguage
                    ? [selectedLanguage]
                    : ['ingles', 'espanhol'];

                const results = await Promise.all(
                    langs.map(lang =>
                        searchQuestions({
                            area: selectedArea,
                            year: selectedYear || undefined,
                            language: lang,
                            limit: IDIOMAS_QUESTIONS_LIMIT,
                        }),
                    ),
                );

                const merged = results.flatMap(r => r.questions);
                setQuestions(merged);
            } else {
                const result = await searchQuestions({
                    area: selectedArea,
                    year: selectedYear || undefined,
                    topicoId: selectedTopico || undefined,
                    topicoValue,
                    limit: QUESTIONS_LIMIT,
                });
                setQuestions(result.questions);
            }
        };

        run()
            .catch(err => {
                setError(
                    normalizeNetworkErrorMessage(err, 'Erro ao buscar questões'),
                );
                setQuestions([]);
            })
            .finally(() => setLoadingQuestions(false));
    }, [
        selectedArea,
        selectedYear,
        selectedTopico,
        selectedLanguage,
        isIdiomasTopicSelected,
    ]);

    const retry = useCallback(() => {
        if (areas.length === 0) {
            loadInitialData();
        } else {
            setLoadingQuestions(true);
            setError(null);
            const topicoValue = topicosRef.current.find(
                t => t.id === selectedTopico,
            )?.value;

            const run = isIdiomasTopicSelected
                ? Promise.all(
                      (selectedLanguage
                          ? [selectedLanguage]
                          : ['ingles', 'espanhol']
                      ).map(lang =>
                          searchQuestions({
                              area: selectedArea,
                              year: selectedYear || undefined,
                              language: lang,
                              limit: IDIOMAS_QUESTIONS_LIMIT,
                          }),
                      ),
                  ).then(results =>
                      setQuestions(results.flatMap(r => r.questions)),
                  )
                : searchQuestions({
                      area: selectedArea,
                      year: selectedYear || undefined,
                      topicoId: selectedTopico || undefined,
                      topicoValue,
                      limit: QUESTIONS_LIMIT,
                  }).then(r => setQuestions(r.questions));

            run.catch(err => {
                setError(
                    normalizeNetworkErrorMessage(err, 'Erro ao buscar questões'),
                );
                setQuestions([]);
            }).finally(() => setLoadingQuestions(false));
        }
    }, [
        areas.length,
        loadInitialData,
        selectedArea,
        selectedYear,
        selectedTopico,
        selectedLanguage,
        isIdiomasTopicSelected,
    ]);

    const isLinguagensArea = selectedArea === LINGUAGENS_AREA_VALUE;
    const isLanguageFilterEnabled = isLinguagensArea && isIdiomasTopicSelected;

    return {
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
    };
}
