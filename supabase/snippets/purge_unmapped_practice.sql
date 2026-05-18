-- Remove agregados de prática sem área ENEM canónica (rodar manualmente no SQL Editor).
-- Não apaga `user_question_answers` (histórico bruto); só limpa `topic_performance` órfão.

DELETE FROM public.topic_performance tp
WHERE NOT EXISTS (
  SELECT 1
  FROM (
    VALUES
      ('linguagens'),
      ('ciencias-humanas'),
      ('ciencias-natureza'),
      ('matematica')
  ) AS enem(area_key)
  WHERE enem.area_key = tp.area_key
)
AND NOT (
  tp.topico_value LIKE '__area__:%'
  OR tp.topico_value IN (
    'interpretacao-textual',
    'interpretacao-texto',
    'literatura',
    'gramatica',
    'generos-textuais',
    'variacoes-linguisticas',
    'historia-brasil',
    'geografia-politica',
    'filosofia',
    'sociologia',
    'geografia-fisica',
    'genetica',
    'ecologia',
    'quimica-organica',
    'termodinamica',
    'citologia',
    'funcoes',
    'geometria-plana',
    'probabilidade',
    'porcentagem',
    'combinatoria'
  )
);
