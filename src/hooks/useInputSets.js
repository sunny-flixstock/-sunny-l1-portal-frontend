import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import {
  archiveInputSet,
  createInputSet,
  fetchInputSet,
  fetchInputSets,
  updateInputSet,
} from '../api/inputSetApi.js'

export const inputSetKeys = {
  all: ['inputSets'],
  list: (params) => ['inputSets', 'list', params],
  detail: (id) => ['inputSets', id],
}

export function useInputSets(params = {}) {
  return useQuery({
    queryKey: inputSetKeys.list(params),
    queryFn: () => fetchInputSets(params),
    meta: {
      errorMessage: 'Failed to load input sets',
    },
  })
}

export function useInputSet(id, enabled = true) {
  return useQuery({
    queryKey: inputSetKeys.detail(id),
    queryFn: async () => {
      const response = await fetchInputSet(id)
      return response.data
    },
    enabled: Boolean(id) && enabled,
    meta: {
      errorMessage: 'Failed to load input set',
    },
  })
}

export function useCreateInputSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => createInputSet(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inputSetKeys.all })
      message.success('Input set created')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create input set')
    },
  })
}

export function useUpdateInputSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => updateInputSet(id, body),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(inputSetKeys.detail(id), response.data)
      queryClient.invalidateQueries({ queryKey: inputSetKeys.all })
      message.success('Input set updated')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update input set')
    },
  })
}

export function useArchiveInputSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => archiveInputSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inputSetKeys.all })
      message.success('Input set archived')
    },
    onError: (error) => {
      message.error(error.message || 'Failed to archive input set')
    },
  })
}
