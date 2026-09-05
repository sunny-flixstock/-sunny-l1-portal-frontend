import { normalizeCsvConfig } from './csvConfig.js'

function toColumnEntries(columns) {
  if (!columns) return []
  return Object.entries(columns)
}

export function compileCsvRules(csvConfig) {
  const normalized = normalizeCsvConfig(csvConfig)
  const rules = toColumnEntries(normalized.columns).map(([canonical, rule = {}]) => ({
    canonical,
    sources: rule.sources?.length ? rule.sources : [canonical],
    required: Boolean(rule.required),
    allowedValues: rule.allowedValues?.length ? rule.allowedValues : null,
  }))

  const barcodeRule = rules.find((rule) => rule.canonical === 'barcode')
  if (barcodeRule) {
    barcodeRule.required = true
  } else {
    rules.unshift({
      canonical: 'barcode',
      sources: ['barcode'],
      required: true,
      allowedValues: null,
    })
  }

  return rules
}

export function normaliseCsvRow(row, rules) {
  const out = { ...row }
  for (const { canonical, sources } of rules) {
    if (Object.prototype.hasOwnProperty.call(out, canonical)) {
      continue
    }
    const source = sources.find((name) =>
      Object.prototype.hasOwnProperty.call(row, name)
    )
    if (source) {
      out[canonical] = row[source]
    }
  }
  return out
}

function collectRowErrors(row, rules, label) {
  const errors = []
  for (const { canonical, required, allowedValues } of rules) {
    const raw = row[canonical]
    const value = typeof raw === 'string' ? raw.trim() : raw
    const isEmpty = value === undefined || value === null || value === ''

    if (required && isEmpty) {
      errors.push(`${label}: ${canonical} is empty or missing`)
      continue
    }

    if (!isEmpty && allowedValues && !allowedValues.includes(value)) {
      errors.push(
        `${label}: ${canonical}='${value}' is not in allowed values [${allowedValues.join(', ')}]`
      )
    }
  }
  return errors
}

export function validateMappedSkusAgainstCsvConfig(mappedSkus, csvConfig) {
  const rules = compileCsvRules(csvConfig)
  const validated = []
  const unvalidated = []

  for (const item of mappedSkus) {
    const label = item.barcode || item.skuName
    const normalisedCsvRow = normaliseCsvRow(item.csvRow ?? {}, rules)
    const errors = collectRowErrors(normalisedCsvRow, rules, label)

    if (errors.length === 0) {
      validated.push({ ...item, normalisedCsvRow })
    } else {
      unvalidated.push({ ...item, normalisedCsvRow, errors })
    }
  }

  return {
    validated,
    unvalidated,
    validatedCount: validated.length,
    unvalidatedCount: unvalidated.length,
  }
}
