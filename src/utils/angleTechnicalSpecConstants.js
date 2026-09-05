export const NAMING_PATTERN_HELP = [
  '${barcode} — product barcode from SKU data',
  '${ext} — file extension from the selected spec (e.g. jpg, png)',
  '${fieldName} — any CSV column from product data (use the exact column name)',
]

export const NAMING_PATTERN_EXAMPLES = [
  '${barcode}_front.${ext}',
  '${style_number}_${color_code}_12.${ext}',
  '${sku}_${angle_name}.${ext}',
]

export function formatDimensions(dimensions) {
  if (!dimensions) return '—'
  return `${dimensions.width} × ${dimensions.height} @ ${dimensions.dpi} dpi`
}

export function formatFileSpec(fileSpecifications) {
  if (!fileSpecifications) return '—'
  return `${fileSpecifications.colorMode.toUpperCase()} · ${fileSpecifications.fileFormat.toUpperCase()}`
}
