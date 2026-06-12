import { useOrganization } from '@/contexts/OrganizationContext'

export function OrganizationSwitcher() {
  const { memberships, effectiveActiveOrganizationId, setActiveOrganization, loading } =
    useOrganization()

  if (loading || memberships.length <= 1) return null

  return (
    <div className="broto-sidebar__org">
      <label className="broto-sidebar__org-label" htmlFor="org-switcher">
        Organização
      </label>
      <select
        id="org-switcher"
        className="broto-input"
        value={effectiveActiveOrganizationId ?? memberships[0]?.organizationId ?? ''}
        onChange={(e) => {
          const id = e.target.value
          if (id) void setActiveOrganization(id)
        }}
        style={{ width: '100%', marginTop: 8, fontSize: '0.9rem' }}
      >
        {memberships.map((m) => (
          <option key={m.id} value={m.organizationId}>
            {m.organization.name}
          </option>
        ))}
      </select>
    </div>
  )
}
