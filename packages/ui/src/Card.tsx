import { type HTMLAttributes, type CSSProperties } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const paddings: Record<NonNullable<Props['padding']>, string> = {
  none: '0',
  sm: '16px',
  md: '20px',
  lg: '24px',
}

export function Card({ padding = 'md', hoverable = false, style, children, ...props }: Props) {
  const baseStyle: CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '0.5px solid #e0e0e0',
    padding: paddings[padding],
    cursor: hoverable ? 'pointer' : undefined,
    transition: hoverable ? 'all 0.15s' : undefined,
    ...style,
  }

  return <div {...props} style={baseStyle}>{children}</div>
}
