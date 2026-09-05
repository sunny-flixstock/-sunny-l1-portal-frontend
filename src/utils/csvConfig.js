export function createEmptyCsvConfig() {
  return { columns: {} }
}

export function normalizeCsvConfig(csvConfig) {
  if (!csvConfig || typeof csvConfig !== 'object') {
    return createEmptyCsvConfig()
  }

  return {
    columns: csvConfig.columns && typeof csvConfig.columns === 'object'
      ? { ...csvConfig.columns }
      : {},
  }
}

export function columnConfigToForm(columnName, config = {}) {
  return {
    name: columnName,
    required: Boolean(config.required),
    allowedValues: Array.isArray(config.allowedValues) ? [...config.allowedValues] : [],
    sources: Array.isArray(config.sources) ? [...config.sources] : [],
  }
}

export function csvConfigToFormRows(csvConfig) {
  const normalized = normalizeCsvConfig(csvConfig)

  return Object.entries(normalized.columns).map(([name, config]) =>
    columnConfigToForm(name, config),
  )
}

export function formRowsToCsvConfig(rows) {
  const columns = {}

  for (const row of rows) {
    const name = row.name.trim()
    if (!name) continue

    const config = {}

    if (row.required) {
      config.required = true
    }

    const allowedValues = row.allowedValues.map((value) => value.trim()).filter(Boolean)
    if (allowedValues.length) {
      config.allowedValues = allowedValues
    }

    const sources = row.sources.map((value) => value.trim()).filter(Boolean)
    if (sources.length) {
      config.sources = sources
    }

    columns[name] = config
  }

  return { columns }
}

export function createEmptyColumnRow() {
  return {
    name: '',
    required: false,
    allowedValues: [],
    sources: [],
  }
}
