import { DOMAINS, DOMAIN_LABELS } from './domainConstants.js'

export { DOMAINS, DOMAIN_LABELS }

export const RULE_TYPES = DOMAINS

export const RULE_POLARITIES = ['must_do', 'must_not_do', 'prefer', 'avoid']

export const RULE_PRIORITIES = ['low', 'medium', 'high', 'critical']

export const RULE_SOURCES = ['client_defined', 'internal']

export const RULE_TYPE_LABELS = DOMAIN_LABELS

export const RULE_POLARITY_LABELS = {
  must_do: 'Must do',
  must_not_do: 'Must not do',
  prefer: 'Prefer',
  avoid: 'Avoid',
}

export const RULE_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const RULE_SOURCE_LABELS = {
  client_defined: 'Client defined',
  internal: 'Internal',
}

export function toSelectOptions(values, labels) {
  return values.map((value) => ({
    value,
    label: labels[value] ?? value,
  }))
}

export function joinFilterValues(values) {
  return values?.length ? values.join(',') : undefined
}
