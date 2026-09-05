import { LABELS } from '../constants/brandAiStylistLabels.js'

export const INSTRUCTION_TYPES = [
  'image_description',
  'framework_builder',
  'category_identification',
  'client_angle_definition',
]

export const INSTRUCTION_TYPE_LABELS = {
  image_description: 'Example image description generation',
  framework_builder: LABELS.stylistCreationAndStorage,
  category_identification: 'Example image categorization',
  client_angle_definition: 'Client angle definition generation',
}

export const INSTRUCTION_TYPE_DESCRIPTIONS = {
  image_description:
    'Generate image descriptions from different domains such as outfit combination, styling, and pose.',
  framework_builder:
    `Create and store ${LABELS.stylistOutput} files per domain.`,
  category_identification:
    'Categorize example images using one or more classification instructions.',
  client_angle_definition:
    'Generate client-specific angle definitions from base angles and reference images.',
}

export function instructionTypePath(type) {
  return `/system-instructions/${encodeURIComponent(type)}`
}

export function instructionDetailPath(type, id) {
  return `${instructionTypePath(type)}/${encodeURIComponent(id)}`
}
