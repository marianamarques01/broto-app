-- topic_performance.area_key: denormaliza área ENEM para agregações (missões diárias, dashboard).
-- Decisão P7 Opção A — coluna versionada; fallback TOPICO_TO_AREA permanece no Edge para linhas legadas sem backfill.

ALTER TABLE public.topic_performance
  ADD COLUMN IF NOT EXISTS area_key TEXT;

-- Rollup __area__:<slug> → area_key direto
UPDATE public.topic_performance
SET area_key = substring(topico_value FROM 10)
WHERE area_key IS NULL
  AND topico_value LIKE '__area__:%'
  AND substring(topico_value FROM 10) IN (
    'linguagens',
    'ciencias-humanas',
    'ciencias-natureza',
    'matematica'
  );

-- Slugs de tópico conhecidos (espelho de TOPICO_TO_AREA em enem-topic-area.ts)
UPDATE public.topic_performance
SET area_key = CASE topico_value
  WHEN 'interpretacao-textual' THEN 'linguagens'
  WHEN 'interpretacao-texto' THEN 'linguagens'
  WHEN 'literatura' THEN 'linguagens'
  WHEN 'gramatica' THEN 'linguagens'
  WHEN 'generos-textuais' THEN 'linguagens'
  WHEN 'variacoes-linguisticas' THEN 'linguagens'
  WHEN 'historia-brasil' THEN 'ciencias-humanas'
  WHEN 'geografia-politica' THEN 'ciencias-humanas'
  WHEN 'filosofia' THEN 'ciencias-humanas'
  WHEN 'sociologia' THEN 'ciencias-humanas'
  WHEN 'geografia-fisica' THEN 'ciencias-humanas'
  WHEN 'genetica' THEN 'ciencias-natureza'
  WHEN 'ecologia' THEN 'ciencias-natureza'
  WHEN 'quimica-organica' THEN 'ciencias-natureza'
  WHEN 'termodinamica' THEN 'ciencias-natureza'
  WHEN 'citologia' THEN 'ciencias-natureza'
  WHEN 'funcoes' THEN 'matematica'
  WHEN 'geometria-plana' THEN 'matematica'
  WHEN 'probabilidade' THEN 'matematica'
  WHEN 'porcentagem' THEN 'matematica'
  WHEN 'combinatoria' THEN 'matematica'
  ELSE area_key
END
WHERE area_key IS NULL;
