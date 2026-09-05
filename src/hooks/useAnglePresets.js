import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  createAnglePreset,
  deleteAnglePreset,
  fetchAnglePreset,
  fetchAnglePresets,
  updateAnglePreset,
} from '../api/anglePresetApi.js'

export const anglePresetKeys = {
  all: ['anglePresets'],
  list: (params) => ['anglePresets', 'list', params],
  detail: (id) => ['anglePresets', id],
}

export function useAnglePresets(params = {}) {
  return useQuery({
    queryKey: anglePresetKeys.list(params),
    queryFn: () => fetchAnglePresets(params),
    meta: {
      errorMessage: 'Failed to load angle presets',
    },
  })
}

export function useAnglePreset(id, enabled = true) {
  return useQuery({
    queryKey: anglePresetKeys.detail(id),
    queryFn: async () => {
      const response = await fetchAnglePreset(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load angle preset',
    },
  })
}

export function useCreateAnglePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createAnglePreset(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: anglePresetKeys.all })
      message.success('Angle preset created')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create angle preset')
    },
  })
}

export function useUpdateAnglePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }) => updateAnglePreset(id, body),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(anglePresetKeys.detail(id), response.data)
      queryClient.invalidateQueries({ queryKey: anglePresetKeys.all })
      message.success('Angle preset updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update angle preset')
    },
  })
}

export function useDeleteAnglePreset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteAnglePreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: anglePresetKeys.all })
      message.success('Angle preset deleted')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to delete angle preset')
    },
  })
}
