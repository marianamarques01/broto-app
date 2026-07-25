/** Seletores estáveis para smoke tests E2E (Playwright / Agent Browser). */
export const NETWORK_SMOKE_SELECTORS = {
  root: '[data-testid="network-dashboard"]',
  demoBanner: '[data-testid="network-demo-banner"]',
  summaryRisk: '[data-testid="network-summary-risk"]',
  summaryActive: '[data-testid="network-summary-active"]',
  schoolCard: (orgId: string) => `[data-testid="network-school-card-${orgId}"]`,
  filterPeriod: '[data-testid="network-filter-period"]',
  filterRegional: '[data-testid="network-filter-regional"]',
  filterGrade: '[data-testid="network-filter-grade"]',
  emptyState: '[data-testid="network-empty-state"]',
} as const
