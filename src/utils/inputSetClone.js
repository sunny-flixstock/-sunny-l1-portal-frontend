export function buildCloneInitialData(source) {
  if (!source) return undefined

  return {
    ...source,
    name: `${source.name} (copy)`,
    status: 'draft',
  }
}
