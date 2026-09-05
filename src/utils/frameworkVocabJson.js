export function parseVocabJson(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('JSON is required')
  }

  let parsed
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('Invalid JSON')
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('JSON must be an object or array')
  }

  return parsed
}

export function formatVocabPreview(vocab) {
  return JSON.stringify(vocab, null, 2)
}
