import ExcelJS from 'exceljs'
import { DOMAINS } from './domainConstants.js'
import {
  RULE_POLARITIES,
  RULE_PRIORITIES,
  RULE_SOURCES,
} from './ruleConstants.js'

const LEGACY_DOMAIN_ALIASES = {
  outfit: 'outfit_combination',
  posing: 'pose',
}

export const RULE_IMPORT_COLUMNS = [
  { key: 'client', header: 'client', width: 18 },
  { key: 'domain', header: 'domain', width: 20 },
  { key: 'polarity', header: 'polarity', width: 16 },
  { key: 'ruleText', header: 'ruleText', width: 48 },
  { key: 'priority', header: 'priority', width: 12 },
  { key: 'source', header: 'source', width: 18 },
  { key: 'createdBy', header: 'createdBy', width: 20 },
  { key: 'tags', header: 'tags', width: 24 },
]

const DOMAIN_HEADER_ALIASES = ['domain', 'ruletype']

export const RULE_IMPORT_TEMPLATE_ROW_COUNT = 100

const HEADER_ROW = 1
const DATA_START_ROW = 2

function columnLetter(index) {
  let letter = ''
  let n = index
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

function listValidationFormula(values) {
  return [`"${values.join(',')}"`]
}

function addListValidation(worksheet, columnIndex, values, lastRow) {
  const col = columnLetter(columnIndex)
  worksheet.dataValidations.add(`${col}${DATA_START_ROW}:${col}${lastRow}`, {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'error',
    errorTitle: 'Invalid value',
    error: `Choose one of: ${values.join(', ')}`,
    formulae: listValidationFormula(values),
  })
}

function normalizeDomainValue(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }
  const lowered = trimmed.toLowerCase()
  return LEGACY_DOMAIN_ALIASES[lowered] ?? lowered
}

function parseTags(value) {
  if (!value) {
    return []
  }
  return [...new Set(String(value).split(',').map((part) => part.trim()).filter(Boolean))]
}

export async function generateRuleImportTemplate(clientCode) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GTOM'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Rules', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = RULE_IMPORT_COLUMNS.map(({ header, key, width }) => ({
    header,
    key,
    width,
  }))

  const headerRow = sheet.getRow(HEADER_ROW)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle' }

  const lastDataRow = DATA_START_ROW + RULE_IMPORT_TEMPLATE_ROW_COUNT - 1

  for (let rowIndex = DATA_START_ROW; rowIndex <= lastDataRow; rowIndex += 1) {
    const isExample = rowIndex === DATA_START_ROW
    sheet.addRow({
      client: clientCode,
      domain: isExample ? 'styling' : '',
      polarity: isExample ? 'must_do' : '',
      ruleText: isExample ? 'Example: match belt to shoes.' : '',
      priority: isExample ? 'high' : '',
      source: isExample ? 'client_defined' : '',
      createdBy: isExample ? 'template' : '',
      tags: isExample ? 'footwear,accessories' : '',
    })
  }

  addListValidation(sheet, 2, DOMAINS, lastDataRow)
  addListValidation(sheet, 3, RULE_POLARITIES, lastDataRow)
  addListValidation(sheet, 5, RULE_PRIORITIES, lastDataRow)
  addListValidation(sheet, 6, RULE_SOURCES, lastDataRow)

  const instructions = workbook.addWorksheet('Instructions')
  instructions.columns = [{ width: 72 }]
  instructions.addRow(['Rules import template'])
  instructions.addRow([])
  instructions.addRow([
    'Fill rows on the Rules sheet. Empty rows are ignored on import.',
  ])
  instructions.addRow(['Required columns: client, domain, polarity, ruleText, priority, source.'])
  instructions.addRow(['Optional: createdBy, tags (comma-separated).'])
  instructions.addRow(['Row 2 includes an example you can edit or delete.'])
  instructions.addRow([])
  instructions.addRow([`Template client: ${clientCode}`])
  instructions.addRow([`domain: ${DOMAINS.join(', ')}`])
  instructions.addRow([`polarity: ${RULE_POLARITIES.join(', ')}`])
  instructions.addRow([`priority: ${RULE_PRIORITIES.join(', ')}`])
  instructions.addRow([`source: ${RULE_SOURCES.join(', ')}`])

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

export function downloadRuleImportTemplate(clientCode, buffer) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rules-import-template-${clientCode}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function cellToString(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object' && value.text !== undefined) {
    return String(value.text).trim()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return String(value).trim()
}

function normalizeHeader(value) {
  return cellToString(value).toLowerCase()
}

function buildHeaderIndexMap(headerRow) {
  const map = new Map()
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = normalizeHeader(cell.value)
    if (header) {
      map.set(header, colNumber)
    }
  })
  return map
}

function resolveDomainColumn(headerIndexMap) {
  for (const header of DOMAIN_HEADER_ALIASES) {
    const col = headerIndexMap.get(header)
    if (col) {
      return col
    }
  }
  return null
}

function readRowValues(row, headerIndexMap) {
  const values = {}
  const domainCol = resolveDomainColumn(headerIndexMap)

  for (const { key, header } of RULE_IMPORT_COLUMNS) {
    if (key === 'domain') {
      values.domain = domainCol ? cellToString(row.getCell(domainCol).value) : ''
      continue
    }

    const col = headerIndexMap.get(normalizeHeader(header))
    values[key] = col ? cellToString(row.getCell(col).value) : ''
  }

  values.domain = normalizeDomainValue(values.domain)
  return values
}

function isRowEmpty(values) {
  return !values.ruleText
    && !values.domain
    && !values.polarity
    && !values.priority
    && !values.source
    && !values.createdBy
    && !values.tags
}

export function validateRuleImportRow(values, rowNumber) {
  const errors = []

  if (!values.client) {
    errors.push('client is required')
  }
  if (!values.domain) {
    errors.push('domain is required')
  } else if (!DOMAINS.includes(values.domain)) {
    errors.push(`domain must be one of: ${DOMAINS.join(', ')}`)
  }
  if (!values.polarity) {
    errors.push('polarity is required')
  } else if (!RULE_POLARITIES.includes(values.polarity)) {
    errors.push(`polarity must be one of: ${RULE_POLARITIES.join(', ')}`)
  }
  if (!values.ruleText) {
    errors.push('ruleText is required')
  }
  if (!values.priority) {
    errors.push('priority is required')
  } else if (!RULE_PRIORITIES.includes(values.priority)) {
    errors.push(`priority must be one of: ${RULE_PRIORITIES.join(', ')}`)
  }
  if (!values.source) {
    errors.push('source is required')
  } else if (!RULE_SOURCES.includes(values.source)) {
    errors.push(`source must be one of: ${RULE_SOURCES.join(', ')}`)
  }

  return {
    rowNumber,
    values,
    errors,
    isValid: errors.length === 0,
  }
}

export function ruleImportRowToPayload(values) {
  return {
    client: values.client,
    ruleType: values.domain,
    polarity: values.polarity,
    ruleText: values.ruleText,
    priority: values.priority,
    source: values.source,
    createdBy: values.createdBy || null,
    tags: parseTags(values.tags),
  }
}

export async function parseRuleImportWorkbook(arrayBuffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const sheet =
    workbook.getWorksheet('Rules')
    ?? workbook.worksheets.find((ws) => ws.name.toLowerCase() === 'rules')
    ?? workbook.worksheets[0]

  if (!sheet) {
    throw new Error('Workbook has no worksheets')
  }

  const headerRow = sheet.getRow(HEADER_ROW)
  const headerIndexMap = buildHeaderIndexMap(headerRow)

  const requiredHeaders = ['client', 'polarity', 'ruletext', 'priority', 'source']
  const missing = requiredHeaders.filter((header) => !headerIndexMap.has(header))
  if (missing.length > 0) {
    throw new Error(
      `Missing required column(s): ${missing.join(', ')}. Use the downloaded template.`,
    )
  }

  if (!resolveDomainColumn(headerIndexMap)) {
    throw new Error(
      'Missing required column: domain (or legacy ruleType). Use the downloaded template.',
    )
  }

  const rows = []
  const lastRow = sheet.rowCount

  for (let rowNumber = DATA_START_ROW; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    if (!row || row.cellCount === 0) {
      continue
    }

    const values = readRowValues(row, headerIndexMap)
    if (isRowEmpty(values)) {
      continue
    }

    rows.push({
      id: `import-${rowNumber}`,
      rowNumber,
      ...validateRuleImportRow(values, rowNumber),
    })
  }

  return rows
}

export function revalidateImportRows(rows) {
  return rows.map((row) => {
    const result = validateRuleImportRow(row.values, row.rowNumber)
    return {
      ...row,
      ...result,
    }
  })
}
