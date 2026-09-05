import { formatConstraint } from './frameworkGroupForm.js'
import { DOMAINS } from './domainConstants.js'

export const DEFAULT_DOMAINS = DOMAINS

export const DEFAULT_DOMAIN_CONFIGS = DEFAULT_DOMAINS.map((domain) => ({
  domain,
  descriptionInstructionId: undefined,
  descriptionProvider: undefined,
  descriptionModel: undefined,
  frameworkCreationInstructionId: undefined,
  frameworkProvider: undefined,
  frameworkModel: undefined,
}))

export function formatFrameworkGroupLabel(group) {
  if (!group) return '—'
  const name = group.name?.trim()
  if (name) return name

  const parts = [
    group.client,
    formatConstraint(group.gender),
    formatConstraint(group.season),
    formatConstraint(group.category),
  ].filter((part) => part && part !== '—')

  return parts.join(' · ') || group.client || '—'
}

export function formatInstructionOption(instruction) {
  if (!instruction) return '—'
  const version = instruction.version != null ? ` v${instruction.version}` : ''
  return `${instruction.name}${version}`
}

export function formatModelSelection(provider, model, providers = []) {
  if (!provider || !model) return '—'
  const providerLabel = providers.find((row) => row.value === provider)?.label ?? provider
  return `${providerLabel} · ${model}`
}

export function formValuesToPayload(values) {
  const domainConfigs = values.domainConfigs ?? []

  return {
    frameworkGroupId: values.frameworkGroupId,
    client: values.client,
    name: values.name.trim(),
    domains: domainConfigs.map((row) => row.domain.trim().toLowerCase()),
    descriptionGenerationInstructions: domainConfigs.map((row) => ({
      domain: row.domain.trim().toLowerCase(),
      instructionId: row.descriptionInstructionId,
      provider: row.descriptionProvider,
      model: row.descriptionModel,
    })),
    frameworkCreationInstructions: domainConfigs.map((row) => ({
      domain: row.domain.trim().toLowerCase(),
      instructionId: row.frameworkCreationInstructionId,
      provider: row.frameworkProvider,
      model: row.frameworkModel,
    })),
    inputSet: values.inputSet,
    frameworkVocabId: values.frameworkVocabId,
    categoryRegistryId: values.categoryRegistryId,
  }
}
