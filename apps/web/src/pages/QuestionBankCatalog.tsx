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
            topic: searchParams.get('topic') ?? '',
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
