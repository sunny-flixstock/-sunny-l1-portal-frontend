import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  archiveClientAngle,
  fetchClientAngle,
  fetchClientAngleVersions,
  fetchClientAngles,
  fetchClientAnglesMeta,
  generateClientAngle,
  reviseClientAngleDefinition,
  renameClientAngle,
} from '../api/clientAngleApi.js'

export const clientAngleKeys = {
  all: ['clientAngles'],
  list: (params) => ['clientAngles', 'list', params],
  detail: (id, params) => ['clientAngles', id, params],
  versions: (seriesKey) => ['clientAngles', 'versions', seriesKey],
  meta: ['clientAngles', 'meta'],
}

export function useClientAngles(params = {}, enabled = true) {
  return useQuery({
    queryKey: clientAngleKeys.list(params),
    queryFn: () => fetchClientAngles(params),
    enabled,
    meta: {
      errorMessage: 'Failed to load client angles',
    },
  })
}

export function useClientAngle(id, params = {}, enabled = true) {
  return useQuery({
    queryKey: clientAngleKeys.detail(id, params),
    queryFn: async () => {
      const response = await fetchClientAngle(id, params)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load client angle',
    },
  })
}

export function useClientAngleVersions(seriesKey, enabled = true) {
  return useQuery({
    queryKey: clientAngleKeys.versions(seriesKey),
    queryFn: async () => {
      const response = await fetchClientAngleVersions(seriesKey)
      return response.data
    },
    enabled: Boolean(seriesKey) && enabled,
    meta: {
      errorMessage: 'Failed to load version history',
    },
  })
}

export function useClientAnglesMeta() {
  return useQuery({
    queryKey: clientAngleKeys.meta,
    queryFn: async () => {
      const response = await fetchClientAnglesMeta()
      return response.data
    },
    staleTime: Infinity,
    meta: {
      errorMessage: 'Failed to load client angle options',
    },
  })
}

export function useGenerateClientAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => generateClientAngle(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientAngleKeys.all })
      message.success('Client angle generated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to generate client angle')
    },
  })
}

export function useReviseClientAngleDefinition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => reviseClientAngleDefinition(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientAngleKeys.all })
      message.success('Client angle definition saved')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to save client angle definition')
    },
  })
}

export function useRenameClientAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }) => renameClientAngle(id, name),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(clientAngleKeys.detail(id, {}), response.data)
      queryClient.invalidateQueries({ queryKey: clientAngleKeys.all })
      message.success('Client angle renamed')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to rename client angle')
    },
  })
}

export function useArchiveClientAngle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => archiveClientAngle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientAngleKeys.all })
      message.success('Client angle archived')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to archive client angle')
    },
  })
}
