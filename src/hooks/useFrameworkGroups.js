import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createFrameworkGroup,
  deleteFrameworkGroup,
  fetchFrameworkGroup,
  fetchFrameworkGroups,
  updateFrameworkGroup,
} from '../api/frameworkGroupApi.js'
import { LABELS } from '../constants/brandAiStylistLabels.js'
import { fetchAllPages } from '../utils/fetchAllPages.js'

export const frameworkGroupKeys = {
  all: ['frameworkGroups'],
  list: (params) => ['frameworkGroups', 'list', params],
  detail: (id) => ['frameworkGroups', id],
}

export function useFrameworkGroups(params = {}) {
  return useQuery({
    queryKey: frameworkGroupKeys.list(params),
    queryFn: () => fetchFrameworkGroups(params),
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistGroups.toLowerCase()}`,
    },
  })
}

export function useAllFrameworkGroups(params = {}) {
  return useQuery({
    queryKey: [...frameworkGroupKeys.all, 'all', params],
    queryFn: () =>
      fetchAllPages((pageParams) => fetchFrameworkGroups({ ...pageParams, ...params })),
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistGroups.toLowerCase()}`,
    },
  })
}

export function useFrameworkGroup(id, enabled = true) {
  return useQuery({
    queryKey: frameworkGroupKeys.detail(id),
    queryFn: async () => {
      const response = await fetchFrameworkGroup(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: `Failed to load ${LABELS.stylistGroup.toLowerCase()}`,
    },
  })
}

export function useCreateFrameworkGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createFrameworkGroup(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkGroupKeys.all })
      message.success(`${LABELS.stylistGroup} created`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to create ${LABELS.stylistGroup.toLowerCase()}`)
    },
  })
}

export function useUpdateFrameworkGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => updateFrameworkGroup(id, body),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(frameworkGroupKeys.detail(id), response.data)
      queryClient.invalidateQueries({ queryKey: frameworkGroupKeys.all })
      message.success(`${LABELS.stylistGroup} updated`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to update ${LABELS.stylistGroup.toLowerCase()}`)
    },
  })
}

export function useDeleteFrameworkGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteFrameworkGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: frameworkGroupKeys.all })
      message.success(`${LABELS.stylistGroup} deleted`)
    },
    onError: (error) => {
      message.error(error.message || `Failed to delete ${LABELS.stylistGroup.toLowerCase()}`)
    },
  })
}
