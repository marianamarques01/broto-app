-- Frequência de p_know pulado por dia
SELECT
  date_trunc('day', created_at) AS day,
  count(*) AS skipped_count,
  count(DISTINCT user_id) AS affected_users
FROM data_quality_events
WHERE event_type = 'p_know_skipped'
GROUP BY 1
ORDER BY 1 DESC;
