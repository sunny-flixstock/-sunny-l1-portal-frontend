import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  archiveFrameworkVersion,
  createFrameworkVersion,
  fetchFrameworkVersion,
  fetchFrameworkVersionDomainDescriptions,
  updateFrameworkVersionDomainDescription,
  fetchFrameworkVersions,
  makeFrameworkVersionLive,
  demoteToInReview,
  startFrameworkCreation,
} from '../api/frameworkVersionApi.js'
import { frameworkGroupKeys } from './useFrameworkGroups.js'
import { LABELS } from '../constants/brandAiStylistLabels.js'

export const frameworkVersionKeys = {
  all: ['frameworkVersions'],
  list: (params) => ['frameworkVersions', 'list', params],
  detail: (id) => ['frameworkVersions', id],
}

export function useFrameworkVersions(params = {}) {
  const { enabled = true, ...queryParams } = params

  return useQuery({
    queryKey: frameworkVersionKeys.list(queryParams),
    queryFn: () => fetchFrameworkVersions(queryParams),
    enabled,
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistVersions.toLowerCase()}`,
    },
  })
}

export function useFrameworkVersion(id, enabled = true) {
  return useQuery({
    queryKey: frameworkVersionKeys.detail(id),
    queryFn: async () => {
      const response = await fetchFrameworkVersion(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistVersion.toLowerCase()}`,
    },
  })
}

export function useCreateFrameworkVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createFrameworkVersion(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['frameworkGroups'] })
      queryClient.invalidateQueries({ queryKey: ['inputSets'] })
      message.success(`${LABELS.stylistVersion} created`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to create ${LABELS.stylistVersion.toLowerCase()}`)
    },
  })
}

export function useFrameworkVersionDomainDescriptions(id, enabled = true) {
  return useQuery({
    queryKey: [...frameworkVersionKeys.detail(id), 'domainDescriptions'],
    queryFn: async () => {
      const response = await fetchFrameworkVersionDomainDescriptions(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load domain descriptions',
    },
  })
}

export function useUpdateFrameworkVersionDomainDescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, domain, contentMarkdown }) =>
      updateFrameworkVersionDomainDescription(id, domain, { contentMarkdown }),
    onSuccess: (_response, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [...frameworkVersionKeys.detail(id), 'domainDescriptions'],
      })
      message.success('Domain description saved')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save domain description')
    },
  })
}

export function useArchiveFrameworkVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => archiveFrameworkVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.all })
      message.success(`${LABELS.stylistVersion} archived`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to archive ${LABELS.stylistVersion.toLowerCase()}`)
    },
  })
}

export function useMakeFrameworkVersionLive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => makeFrameworkVersionLive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.all })
      queryClient.invalidateQueries({ queryKey: frameworkGroupKeys.all })
      message.success('Version is now live in production')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to make version live')
    },
  })
}

export function useDemoteToInReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => demoteToInReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.all })
      queryClient.invalidateQueries({ queryKey: frameworkGroupKeys.all })
      message.success('Version returned to in review')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to return version to in review')
    },
  })
}

export function useStartFrameworkCreation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => startFrameworkCreation(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.all })
      queryClient.invalidateQueries({ queryKey: frameworkVersionKeys.detail(id) })

      const stats = result?.imageDescriptions
      if (stats) {
        const parts = [`${stats.created} image description${stats.created === 1 ? '' : 's'} created`]
        if (stats.skipped > 0) {
          parts.push(`${stats.skipped} already existed`)
        }
        message.success(`${LABELS.brandAiStylist} creation started (${parts.join(', ')})`)
      } else {
        message.success(`${LABELS.brandAiStylist} creation started`)
      }
    },
    onError: (error) => {
      message.error(error.message || `Failed to start ${LABELS.brandAiStylist.toLowerCase()} creation`)
    },
  })
}
