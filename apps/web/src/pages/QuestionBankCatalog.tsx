import { useMemo } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { parseEnemAreaKey } from '@broto/shared'
import { TopBar } from '@/components/layout/TopBar'
import { QuestionBankView } from '@/components/study/QuestionBankView'
import { AREA_CONFIG } from '@/lib/area-config'

export function QuestionBankCatalog() {
  const { areaKey: raw } = useParams<{ areaKey: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const areaKey = raw ? parseEnemAreaKey(raw) : undefined

  const topicValues = useMemo(() => {
    const topicsRaw = searchParams.get('topics') ?? searchParams.get('topic') ?? ''
    return topicsRaw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }, [searchParams])

  if (!areaKey) {
    return <Navigate to="/study" replace />
  }

  const areaLabel = AREA_CONFIG[areaKey]?.label ?? ''

  return (
    <>
      <TopBar
        variant="study"
        title="Banco de questões"
        studyBreadcrumb={{ area: areaLabel, detail: 'Catálogo' }}
      />
      <div className="broto-main-inner broto-main-inner--study">
        <QuestionBankView
          bankCatalogOnly
          preferredArea={areaKey}
          initialFilters={{
            year: searchParams.get('year') ?? '',
            topic: topicValues.length === 1 ? topicValues[0] : '',
            topicValues: topicValues.length > 1 ? topicValues : undefined,
            language: searchParams.get('lang') ?? '',
            difficulty: (searchParams.get('difficulty') ?? '') as
              | ''
              | 'facil'
              | 'medio'
              | 'dificil',
            search: searchParams.get('q') ?? '',
            sortRecent: searchParams.get('sort') === 'recent',
          }}
          onBackToHub={() => navigate(`/study/${areaKey}`)}
        />
      </div>
    </>
  )
}
