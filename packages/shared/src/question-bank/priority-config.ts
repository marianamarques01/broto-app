/**
 * Regras de produto — motor de decisão do banco de questões (web; reutilizável no mobile).
 */
/** Janela para considerar um erro como “recente” no trilho de revisão. */
export const Q_BANK_RECENT_MISTAKE_DAYS = 14

/** Máximo de cards por trilho (mistakes / weak / new). */
export const Q_BANK_TRACK_ROW_LIMIT = 6

/** Mínimo de respostas num tópico para classificar como “fraco” por taxa de acerto. */
export const Q_BANK_WEAK_TOPIC_MIN_ANSWERS = 3

/** Taxa de acerto (%) abaixo da qual o tópico entra como candidato a “fraco” (com amostra mínima). */
export const Q_BANK_WEAK_ACCURACY_PCT_MAX = 62

/** Quantas questões puxar por tópico fraco no trilho. */
export const Q_BANK_WEAK_QUESTIONS_PER_TOPIC = 2

/** Máximo de tópicos fracos a misturar num trilho. */
export const Q_BANK_WEAK_TOPIC_CAP = 3
