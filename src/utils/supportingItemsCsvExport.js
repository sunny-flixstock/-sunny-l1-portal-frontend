function escapeCsvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function rowsToCsvContent(headers, rows) {
  const lines = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(','))
  }
  return lines.join('\n')
}

export function downloadCsvFile(filename, headers, rows) {
  const content = rowsToCsvContent(headers, rows)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportUnmappedSkuFolders(unmapped) {
  downloadCsvFile(
    'unmapped-sku-folders.csv',
    ['skuFolder', 'fileCount'],
    unmapped.map((entry) => ({
      skuFolder: entry.skuName,
      fileCount: entry.fileCount,
    }))
  )
}

export function exportUnvalidatedSkus(unvalidated) {
  if (!unvalidated.length) {
    return
  }

  const csvHeaders = new Set(['skuFolder', 'barcode', 'fileCount', 'validationErrors'])
  for (const entry of unvalidated) {
    Object.keys(entry.normalisedCsvRow ?? entry.csvRow ?? {}).forEach((key) => {
      csvHeaders.add(key)
    })
  }

  const headers = Array.from(csvHeaders)
  const rows = unvalidated.map((entry) => {
    const row = {
      skuFolder: entry.skuName,
      barcode: entry.barcode,
      fileCount: entry.fileCount,
      validationErrors: (entry.errors ?? []).join('; '),
      ...(entry.normalisedCsvRow ?? entry.csvRow ?? {}),
    }
    return row
  })

  downloadCsvFile('unvalidated-skus.csv', headers, rows)
}
