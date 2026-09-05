export function filterRules(rules, filters) {
  const search = filters.search?.trim().toLowerCase() ?? ''
  const domains = filters.domains ?? []
  const polarities = filters.polarities ?? []
  const priorities = filters.priorities ?? []
  const sources = filters.sources ?? []
  const tags = filters.tags ?? []

  return rules.filter((rule) => {
    if (search && !rule.ruleText?.toLowerCase().includes(search)) {
      return false
    }
    if (domains.length > 0 && !domains.includes(rule.ruleType)) {
      return false
    }
    if (polarities.length > 0 && !polarities.includes(rule.polarity)) {
      return false
    }
    if (priorities.length > 0 && !priorities.includes(rule.priority)) {
      return false
    }
    if (sources.length > 0 && !sources.includes(rule.source)) {
      return false
    }
    if (tags.length > 0) {
      const ruleTags = rule.tags ?? []
      if (!tags.some((tag) => ruleTags.includes(tag))) {
        return false
      }
    }
    return true
  })
}

export const EMPTY_RULE_FILTERS = {
  search: '',
  domains: [],
  polarities: [],
  priorities: [],
  sources: [],
  tags: [],
}
