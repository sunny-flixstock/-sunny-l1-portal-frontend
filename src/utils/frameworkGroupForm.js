export const EMPTY_CONSTRAINT = ''

export function groupToFormValues(group) {
  if (!group) {
    return {
      client: '',
      gender: EMPTY_CONSTRAINT,
      season: EMPTY_CONSTRAINT,
      category: EMPTY_CONSTRAINT,
      priority: 0,
      name: '',
    }
  }

  return {
    client: group.client ?? '',
    gender: group.gender ?? EMPTY_CONSTRAINT,
    season: group.season ?? EMPTY_CONSTRAINT,
    category: group.category ?? EMPTY_CONSTRAINT,
    priority: group.priority ?? 0,
    name: group.name ?? '',
  }
}

export function formValuesToPayload(values) {
  return {
    client: values.client.trim(),
    gender: values.gender.trim() || null,
    season: values.season.trim() || null,
    category: values.category.trim() || null,
    priority: Number(values.priority) || 0,
    name: values.name.trim() || null,
  }
}

export function formatConstraint(value) {
  return value ? value : 'Any'
}
