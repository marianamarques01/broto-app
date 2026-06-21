import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { LP_CTA_LABEL, LP_NAV_ANCHORS } from '@/lib/landing-page-content'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const MOBILE_CTA_SCROLL_THRESHOLD = 480

export function LandingPageNavbar({ onOpenDemo }: { onOpenDemo: () => void }) {
  const [showMobileCta, setShowMobileCta] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowMobileCta(window.scrollY > MOBILE_CTA_SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="blp-nav">
        <div className="blp-nav__inner">
          <a
            href="#top"
            className="blp-nav__brand"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="blp-nav__brand-sprout" aria-hidden>
              🌱
            </span>
            broto
          </a>
          <nav className="blp-nav__links" aria-label="Seções da página">
            {LP_NAV_ANCHORS.map((anchor) => (
              <button
                key={anchor.id}
                type="button"
                className="blp-nav__link"
                onClick={() => scrollToId(anchor.id)}
              >
                {anchor.label}
                {anchor.hasChevron ? <ChevronDown size={14} aria-hidden /> : null}
              </button>
            ))}
          </nav>
          <button type="button" className="blp-btn blp-btn--dark blp-nav__cta" onClick={onOpenDemo}>
            {LP_CTA_LABEL}
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      <div
        className={`blp-mobile-cta${showMobileCta ? ' blp-mobile-cta--visible' : ''}`}
        aria-hidden={!showMobileCta}
      >
        <button
          type="button"
          className="blp-btn blp-btn--dark"
          onClick={onOpenDemo}
          tabIndex={showMobileCta ? 0 : -1}
        >
          {LP_CTA_LABEL}
        </button>
      </div>
    </>
  )
}
