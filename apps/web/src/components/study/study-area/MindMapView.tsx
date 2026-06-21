import { useState } from 'react'
import { Brain, ChevronDown, ChevronRight, Trophy } from 'lucide-react'
import type { MindMapNode, StudyPackage } from '@/lib/study-area-mock'

function getAllIds(node: MindMapNode): string[] {
  const ids = [node.id]
  if (node.children) node.children.forEach((c) => ids.push(...getAllIds(c)))
  return ids
}

export function MindMapView({
  mindMap,
  areaColor,
  onDone,
}: {
  mindMap: StudyPackage['mindMap']
  areaColor: string
  onDone: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderNode(node: MindMapNode, depth: number) {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = expanded.has(node.id)
    const isRoot = depth === 0

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? 20 : 0 }}>
        <button
          type="button"
          onClick={() => hasChildren && toggle(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isRoot ? '12px 16px' : '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: isRoot ? `1.5px solid ${areaColor}44` : '1px solid var(--border-subtle)',
            background: isRoot ? `${areaColor}10` : 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            marginBottom: 6,
            transition: 'background 0.15s',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown size={14} color="var(--text-muted)" />
            ) : (
              <ChevronRight size={14} color="var(--text-muted)" />
            ))}
          {!hasChildren && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: areaColor,
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: isRoot ? '0.95rem' : '0.85rem',
              fontWeight: isRoot ? 700 : depth === 1 ? 600 : 400,
              color: isRoot ? areaColor : 'var(--text-primary)',
            }}
          >
            {node.label}
          </span>
        </button>
        {hasChildren && isOpen && (
          <div
            style={{
              borderLeft: `2px solid ${areaColor}22`,
              marginLeft: 14,
              paddingLeft: 4,
            }}
          >
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Brain size={18} color={areaColor} />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Mapa Mental: {mindMap.topic}
        </h3>
      </div>

      <div
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {renderNode(mindMap.root, 0)}
      </div>

      <button
        type="button"
        onClick={() => {
          setExpanded(new Set(getAllIds(mindMap.root)))
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 12,
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          cursor: 'pointer',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
        }}
      >
        Expandir tudo
      </button>

      <button
        type="button"
        onClick={onDone}
        className="broto-btn-primary"
        style={{ marginTop: 16, justifyContent: 'center' }}
      >
        Fechar trilha <Trophy size={18} />
      </button>
    </div>
  )
}
