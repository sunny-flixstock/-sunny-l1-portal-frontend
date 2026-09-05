import { isAllowedUploadImageFile } from './allowedImageFormats.js'

const REQUIRED_CSV_COLUMN = 'barcode'

export function isSupportingItemImageFile(file) {
  return isAllowedUploadImageFile(file)
}

function detectDelimiter(line) {
  const tabCount = (line.match(/\t/g) ?? []).length
  const commaCount = (line.match(/,/g) ?? []).length
  return tabCount > commaCount ? '\t' : ','
}

function parseCsvLine(line, delimiter) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function splitCsvRows(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter)
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line, delimiter)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    return row
  })

  return { headers, rows }
}

export function parseCsvText(text) {
  return splitCsvRows(text)
}

export async function parseCsvFile(file) {
  const text = await file.text()
  return { fileName: file.name, ...splitCsvRows(text) }
}

export function validateCsvHeaders(headers, fileName) {
  const normalized = headers.map((header) => header.trim().toLowerCase())
  if (!normalized.includes(REQUIRED_CSV_COLUMN)) {
    throw new Error(`${fileName}: CSV must include a "${REQUIRED_CSV_COLUMN}" column`)
  }
  return headers.find((header) => header.trim().toLowerCase() === REQUIRED_CSV_COLUMN)
}

export async function parseAndMergeCsvFiles(files) {
  if (!files.length) {
    return { rows: [], fileNames: [], errors: [] }
  }

  const mergedByBarcode = new Map()
  const fileNames = []
  const errors = []

  for (const file of files) {
    try {
      const { headers, rows, fileName } = await parseCsvFile(file)
      const barcodeKey = validateCsvHeaders(headers, fileName)
      fileNames.push(fileName)

      for (const row of rows) {
        const barcode = String(row[barcodeKey] ?? '').trim()
        if (!barcode) {
          continue
        }
        const entry = { barcode }
        headers.forEach((header) => {
          entry[header] = row[header] ?? ''
        })
        mergedByBarcode.set(barcode, entry)
      }
    } catch (error) {
      errors.push(error.message || `Failed to parse ${file.name}`)
    }
  }

  return {
    rows: Array.from(mergedByBarcode.values()),
    fileNames,
    errors,
  }
}

export function extractSkuStructure(files) {
  const fileArray = Array.from(files)
  if (fileArray.length === 0) {
    return { rootName: null, skus: [] }
  }

  const skuMap = new Map()

  for (const file of fileArray) {
    if (!isSupportingItemImageFile(file)) {
      continue
    }

    const parts = file.webkitRelativePath.split('/').filter(Boolean)
    if (parts.length < 3) {
      continue
    }

    const skuName = parts[1]
    if (!skuMap.has(skuName)) {
      skuMap.set(skuName, { name: skuName, files: [] })
    }
    skuMap.get(skuName).files.push(file)
  }

  const rootName = fileArray[0]?.webkitRelativePath.split('/')[0] ?? null

  return {
    rootName,
    skus: Array.from(skuMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export function mapSkusToCsvData(skus, csvRows) {
  const csvByBarcode = new Map(
    csvRows.map((row) => [String(row.barcode).trim(), row])
  )

  const mapped = []
  const unmapped = []

  for (const sku of skus) {
    const csvRow = csvByBarcode.get(sku.name.trim())
    if (csvRow) {
      mapped.push({
        skuName: sku.name,
        barcode: csvRow.barcode,
        csvRow,
        files: sku.files,
        fileCount: sku.files.length,
      })
    } else {
      unmapped.push({
        skuName: sku.name,
        fileCount: sku.files.length,
      })
    }
  }

  return {
    totalSkus: skus.length,
    mappedCount: mapped.length,
    unmappedCount: unmapped.length,
    mapped,
    unmapped,
  }
}

export async function analyzeSupportingItemsBulkUpload({ csvFiles, folderFiles }) {
  const csvResult = await parseAndMergeCsvFiles(csvFiles)
  if (csvResult.errors.length) {
    return { ok: false, errors: csvResult.errors }
  }

  if (csvFiles.length > 0 && csvResult.rows.length === 0) {
    return { ok: false, errors: ['CSV files contain no rows with a barcode value'] }
  }

  const { rootName, skus } = extractSkuStructure(folderFiles)
  if (folderFiles.length > 0 && skus.length === 0) {
    return {
      ok: false,
      errors: [
        'Selected folder has no SKU subdirectories with image files. Each SKU folder should contain jpg, jpeg, or png images.',
      ],
    }
  }

  const mapping =
    csvResult.rows.length && skus.length
      ? mapSkusToCsvData(skus, csvResult.rows)
      : {
        totalSkus: skus.length,
        mappedCount: 0,
        unmappedCount: skus.length,
        mapped: [],
        unmapped: skus.map((sku) => ({
          skuName: sku.name,
          fileCount: sku.files.length,
        })),
      }

  return {
    ok: true,
    csvFileNames: csvResult.fileNames,
    csvRowCount: csvResult.rows.length,
    folderRootName: rootName,
    ...mapping,
  }
}
