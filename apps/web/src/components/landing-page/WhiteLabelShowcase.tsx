import { useEffect, useState } from 'react'
import { LP_FICTIONAL_BRANDS } from '@/lib/landing-page-content'
import { StudentPhoneRoutineMock } from './LandingPageMocks'

const ROTATION_INTERVAL_MS = 3500

/**
 * O momento "wow" da seção white-label: o mesmo app alternando entre três
 * marcas fictícias em loop lento — demonstra o multi-tenant sem explicar.
 */
export function WhiteLabelShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % LP_FICTIONAL_BRANDS.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="blp-wl__showcase">
      <div className="blp-wl__phones">
        {LP_FICTIONAL_BRANDS.map((brand, index) => (
          <div
            key={brand.name}
            className={`blp-wl__phone-slot${index === activeIndex ? ' blp-wl__phone-slot--active' : ''}`}
            style={{ '--brand-accent': brand.accent } as React.CSSProperties}
          >
            <StudentPhoneRoutineMock brand={brand} />
            <span className="blp-wl__phone-label">{brand.name}</span>
          </div>
        ))}
      </div>
      <p className="blp-wl__caption">
        O mesmo produto, três instituições diferentes — cada uma com sua marca, suas cores e seu
        conteúdo.
      </p>
    </div>
  )
}
