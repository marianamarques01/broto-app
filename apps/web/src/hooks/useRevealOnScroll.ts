import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Micro-animação de entrada das seções da landing: observa todos os
 * descendentes `.blp-reveal` do container e aplica `--visible` uma única vez.
 * Respeita `prefers-reduced-motion` (o CSS desativa a transição).
 */
export function useRevealOnScroll<T extends HTMLElement>(): RefObject<T> {
  const rootRef = useRef<T>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const targets = root.querySelectorAll<HTMLElement>('.blp-reveal')
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('blp-reveal--visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return rootRef
}
